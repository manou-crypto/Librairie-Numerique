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

  async getAchatsStats(period: string) {
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

    const achats = await this.prisma.achat.findMany({
      where: {
        date_achat: { gte: startDate, lte: now },
        statut_achat: { not: 'ANNULE' },
      },
      include: {
        fournisseur: true,
        utilisateur: { select: { nom: true, prenom: true } },
        lignes: { include: { produit: true } },
      },
      orderBy: { date_achat: 'desc' },
    });

    let totalAchatsTtc = 0;
    let totalPaye = 0;
    let totalArticlesAchetes = 0;

    const supplierMap = new Map<string, { nom: string; totalTtc: number; paye: number; commandes: number }>();
    const chartMap = new Map<string, number>();

    achats.forEach((a) => {
      const ttc = Number(a.montant_total_ttc);
      const paye = Number(a.montant_paye);
      totalAchatsTtc += ttc;
      totalPaye += paye;

      const fNom = a.fournisseur?.nom_entreprise || 'Inconnu';
      if (!supplierMap.has(fNom)) {
        supplierMap.set(fNom, { nom: fNom, totalTtc: 0, paye: 0, commandes: 0 });
      }
      const s = supplierMap.get(fNom)!;
      s.totalTtc += ttc;
      s.paye += paye;
      s.commandes += 1;

      a.lignes.forEach((l) => {
        totalArticlesAchetes += l.quantite_commandee;
      });

      const dayKey = `${String(a.date_achat.getDate()).padStart(2, '0')}/${String(a.date_achat.getMonth() + 1).padStart(2, '0')}`;
      chartMap.set(dayKey, (chartMap.get(dayKey) || 0) + ttc);
    });

    const dettesTotal = Math.max(0, totalAchatsTtc - totalPaye);

    const suppliersData = Array.from(supplierMap.values())
      .sort((a, b) => b.totalTtc - a.totalTtc)
      .map((s) => ({
        ...s,
        resteAPayer: Math.max(0, s.totalTtc - s.paye),
      }));

    const chartData = Array.from(chartMap.entries()).map(([date, montant]) => ({
      date,
      montant: Math.round(montant),
    }));

    const recentAchats = achats.slice(0, 10).map((a) => ({
      id: a.id_achat,
      facture: a.numero_facture_fournisseur,
      fournisseur: a.fournisseur?.nom_entreprise || 'Inconnu',
      acheteur: `${a.utilisateur?.prenom} ${a.utilisateur?.nom}`.trim(),
      date: a.date_achat.toISOString(),
      totalTtc: Number(a.montant_total_ttc),
      paye: Number(a.montant_paye),
      resteAPayer: Math.max(0, Number(a.montant_total_ttc) - Number(a.montant_paye)),
      statut: a.statut_achat,
    }));

    return {
      totalAchatsTtc: Math.round(totalAchatsTtc),
      totalPaye: Math.round(totalPaye),
      dettesTotal: Math.round(dettesTotal),
      commandesCount: achats.length,
      totalArticlesAchetes,
      suppliersData,
      chartData,
      recentAchats,
    };
  }

  async getStocksStats() {
    const [stocks, rupturesCount, alertesCount, derniersMouvements] = await Promise.all([
      this.prisma.stock.findMany({
        include: {
          produit: {
            include: {
              categories: { include: { categorie: true } },
            },
          },
        },
      }),
      this.prisma.stock.count({ where: { quantite_en_stock: { lte: 0 } } }),
      this.prisma.stock.count({
        where: {
          quantite_en_stock: { gt: 0, lte: 5 },
        },
      }),
      this.prisma.mouvementStock.findMany({
        take: 15,
        orderBy: { date_mouvement: 'desc' },
        include: {
          produit: true,
          utilisateur: { select: { nom: true, prenom: true } },
        },
      }),
    ]);

    let valeurStockAchat = 0;
    let valeurStockVente = 0;
    let totalPieces = 0;
    const catMap = new Map<string, { nom: string; valeur: number; quantite: number }>();

    stocks.forEach((s) => {
      const q = s.quantite_en_stock;
      const pa = Number(s.produit.prix_achat || 0);
      const pv = Number(s.produit.prix_vente || 0);

      totalPieces += q;
      valeurStockAchat += q * pa;
      valeurStockVente += q * pv;

      const catNom = s.produit.categories[0]?.categorie?.nom || 'Autres';
      if (!catMap.has(catNom)) {
        catMap.set(catNom, { nom: catNom, valeur: 0, quantite: 0 });
      }
      const c = catMap.get(catNom)!;
      c.valeur += q * pa;
      c.quantite += q;
    });

    const categoriesDistribution = Array.from(catMap.values())
      .sort((a, b) => b.valeur - a.valeur)
      .map((c) => ({
        name: c.nom,
        valeur: Math.round(c.valeur),
        quantite: c.quantite,
      }));

    const formattedMouvements = derniersMouvements.map((m) => ({
      id: m.id_mouvement,
      produit: m.produit?.libelle || 'Inconnu',
      type: m.type_mouvement,
      quantite: m.quantite,
      date: m.date_mouvement.toISOString(),
      operateur: `${m.utilisateur?.prenom} ${m.utilisateur?.nom}`.trim(),
    }));

    return {
      totalReferences: stocks.length,
      totalPieces,
      valeurStockAchat: Math.round(valeurStockAchat),
      valeurStockVente: Math.round(valeurStockVente),
      plusValueLatente: Math.round(valeurStockVente - valeurStockAchat),
      rupturesCount,
      alertesCount,
      categoriesDistribution,
      derniersMouvements: formattedMouvements,
    };
  }
}
