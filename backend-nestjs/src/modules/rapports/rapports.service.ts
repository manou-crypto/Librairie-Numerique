import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RapportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(period: string) {
    const now = new Date();
    let startDate = new Date();

    if (period === 'semaine') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'mois') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'trimestre') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (period === 'annee') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Récupérer les ventes de la période
    const ventes = await this.prisma.vente.findMany({
      where: {
        date_vente: { gte: startDate, lte: now },
        statut_vente: 'VALIDEE',
      },
      include: {
        lignes: {
          include: {
            produit: {
              include: {
                categories: {
                  include: { categorie: true }
                }
              }
            }
          }
        }
      }
    });

    // 1. KPI globaux
    const ventesTotales = ventes.length;
    let chiffreAffaires = 0;
    let beneficeNet = 0;

    ventes.forEach(v => {
      chiffreAffaires += Number(v.total_ttc);
      beneficeNet += Number(v.marge_totale);
    });

    const margeMoyenne = chiffreAffaires > 0 ? Math.round((beneficeNet / chiffreAffaires) * 100) : 0;

    // 2. Évolution (CA & Benefice)
    const groupByMonth = period === 'trimestre' || period === 'annee';
    const caMap = new Map<string, { ca: number; benefice: number }>();

    ventes.forEach(v => {
      const d = v.date_vente;
      let key = '';
      if (groupByMonth) {
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      } else {
        key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!caMap.has(key)) {
        caMap.set(key, { ca: 0, benefice: 0 });
      }
      const entry = caMap.get(key)!;
      entry.ca += Number(v.total_ttc);
      entry.benefice += Number(v.marge_totale);
    });

    // Ordonner chronologiquement si c'est par jour, pour les mois c'est plus complexe mais Map conserve l'ordre d'insertion en JS (qui est chronologique si les ventes sont fetchées chronologiquement, mais Prisma ne le garantit pas sans orderBy)
    // On va trier par la date brute
    const caData: { mois: string; ca: number; benefice: number; }[] = [];
    if (groupByMonth) {
      // Regroupons dynamiquement selon la date
      const sortedKeys = Array.from(caMap.keys()); // Simplification pour le dashboard
      for (const k of sortedKeys) {
        caData.push({ mois: k, ca: Math.round(caMap.get(k)!.ca), benefice: Math.round(caMap.get(k)!.benefice) });
      }
    } else {
      const sortedKeys = Array.from(caMap.keys());
      for (const k of sortedKeys) {
        caData.push({ mois: k, ca: Math.round(caMap.get(k)!.ca), benefice: Math.round(caMap.get(k)!.benefice) });
      }
    }

    // 3. Catégories & Top Produits & Ventes par jour
    const catMap = new Map<string, number>();
    const productMap = new Map<number, { nom: string; categorie: string; ventes: number; ca: number }>();
    const dayMap = new Map<number, number>();

    ventes.forEach(v => {
      const day = v.date_vente.getDay();
      dayMap.set(day, (dayMap.get(day) || 0) + 1);

      v.lignes.forEach(ligne => {
        // Estimation du TTC de la ligne
        const lineTotal = Number(ligne.total_ligne_ht) * (1 + Number(ligne.taux_tva_snapshot) / 100);
        const catName = ligne.produit.categories[0]?.categorie?.nom || 'Autre';
        
        catMap.set(catName, (catMap.get(catName) || 0) + lineTotal);

        if (!productMap.has(ligne.id_produit)) {
          productMap.set(ligne.id_produit, { nom: ligne.produit.libelle, categorie: catName, ventes: 0, ca: 0 });
        }
        const p = productMap.get(ligne.id_produit)!;
        p.ventes += ligne.quantite;
        p.ca += lineTotal;
      });
    });

    const colors = ['#2563eb', '#f97316', '#22c55e', '#eab308', '#ec4899', '#8b5cf6'];
    const categoryData = Array.from(catMap.entries())
      .map(([name, value], idx) => ({ name, value: Math.round(value), color: colors[idx % colors.length] }))
      .sort((a, b) => b.value - a.value);

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.ca - a.ca)
      .slice(0, 5)
      .map(p => ({ ...p, ca: Math.round(p.ca) }));

    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const ventesJour = dayNames.map((jour, idx) => ({ jour, ventes: dayMap.get(idx) || 0 }));

    return {
      chiffreAffaires: Math.round(chiffreAffaires),
      beneficeNet: Math.round(beneficeNet),
      ventesTotales,
      margeMoyenne,
      caData,
      categoryData,
      topProducts,
      ventesJour
    };
  }
}
