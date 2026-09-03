import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FinancesService {
  constructor(private prisma: PrismaService) {}

  async getDashboardKpis() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [ventesJour, rupturesCount, totalMonthSales] = await Promise.all([
      this.prisma.vente.findMany({
        where: {
          date_vente: { gte: today },
          statut_vente: 'VALIDEE',
        },
      }),
      this.prisma.stock.count({ where: { quantite_en_stock: 0 } }),
      this.prisma.vente.aggregate({
        _sum: { total_ttc: true },
        where: { statut_vente: 'VALIDEE' },
      }),
    ]);

    let caJour = 0;
    let beneficeBrutJour = 0;
    let ventesJourCount = ventesJour.length;

    ventesJour.forEach((v) => {
      caJour += Number(v.total_ttc);
      beneficeBrutJour += Number(v.marge_totale);
    });

    const panierMoyen = ventesJourCount > 0 ? caJour / ventesJourCount : 0;
    const margeMoyennePourcent = caJour > 0 ? (beneficeBrutJour / caJour) * 100 : 0;

    return {
      caJour,
      caJourObjectif: 500000,
      caJourTrend: 12.4,
      beneficeBrutJour,
      margeMoyennePourcent: Number(margeMoyennePourcent.toFixed(1)),
      ventesJourCount,
      panierMoyen: Number(panierMoyen.toFixed(2)),
      caMoisTotal: Number(totalMonthSales._sum.total_ttc || caJour),
      caMoisObjectif: 10000000,
      rupturesStockCount: rupturesCount,
    };
  }

  async getDashboardCharts() {
    // 1. Categories Distribution (Current Month)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const ventesMois = await this.prisma.vente.findMany({
      where: { date_vente: { gte: firstDayOfMonth }, statut_vente: 'VALIDEE' },
      include: { lignes: { include: { produit: { include: { categories: { include: { categorie: true } } } } } } }
    });

    const catMap = new Map<string, number>();
    ventesMois.forEach(v => {
      v.lignes.forEach(l => {
        let catName = 'Divers';
        if (l.produit?.categories && l.produit.categories.length > 0) {
           catName = l.produit.categories[0].categorie.nom;
        }
        const amount = Number(l.total_ligne_ht || 0);
        catMap.set(catName, (catMap.get(catName) || 0) + amount);
      });
    });

    const categoriesDistribution = Array.from(catMap.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(0))
    }));

    if (categoriesDistribution.length === 0) {
      categoriesDistribution.push({ name: 'Aucune donnée', value: 100 });
    }

    // 2. Weekly Trends & Daily CA/Benefice (Last 7 days)
    const weeklyTrends: { jour: string; semaine: number; precedente: number }[] = [];
    const caTrends: { mois: string; ca: number; benefice: number }[] = [];
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dNext = new Date(d);
      dNext.setDate(dNext.getDate() + 1);

      const dPrev = new Date(d);
      dPrev.setDate(dPrev.getDate() - 7);
      const dPrevNext = new Date(dPrev);
      dPrevNext.setDate(dPrevNext.getDate() + 1);

      const currentSales = await this.prisma.vente.aggregate({
        _sum: { total_ttc: true, marge_totale: true },
        where: { date_vente: { gte: d, lt: dNext }, statut_vente: 'VALIDEE' }
      });

      const prevSales = await this.prisma.vente.aggregate({
        _sum: { total_ttc: true },
        where: { date_vente: { gte: dPrev, lt: dPrevNext }, statut_vente: 'VALIDEE' }
      });

      const ca = Number(currentSales._sum.total_ttc || 0);
      const benefice = Number(currentSales._sum.marge_totale || 0);
      const prevCa = Number(prevSales._sum.total_ttc || 0);
      const label = days[d.getDay()];

      weeklyTrends.push({ jour: label, semaine: ca, precedente: prevCa });
      caTrends.push({ mois: label, ca: ca, benefice: benefice });
    }

    return {
      categoriesDistribution,
      weeklyTrends,
      caTrends
    };
  }

  async getDashboardFeed() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const ventesJour = await this.prisma.vente.findMany({
      where: { date_vente: { gte: startOfDay }, statut_vente: 'VALIDEE' },
      include: { 
        lignes: { include: { produit: { include: { stock: true, categories: { include: { categorie: true } } } } } },
        paiements: true,
        session: { include: { utilisateur: true, caisse: true } }
      },
      orderBy: { date_vente: 'desc' }
    });

    const recentSales = ventesJour.slice(0, 10).map(v => {
      let mode = 'especes';
      const firstPayment = v.paiements[0]?.mode_paiement;
      if (firstPayment === 'CARTE_BANCAIRE') mode = 'carte';
      if (firstPayment === 'CHEQUE') mode = 'cheque';
      if (firstPayment === 'MOBILE_MONEY') mode = 'carte'; // fallback

      return {
        id: v.reference_ticket,
        caissier: (v.session?.utilisateur?.nom + ' ' + v.session?.utilisateur?.prenom).trim() || 'Inconnu',
        caisse: v.session?.caisse?.code_caisse || 'Inconnue',
        montant: Number(v.total_ttc),
        time: v.date_vente.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        items: v.lignes.reduce((sum, l) => sum + l.quantite, 0),
        mode
      };
    });

    const productMap = new Map<number, any>();
    ventesJour.forEach(v => {
      v.lignes.forEach(l => {
        const pid = l.id_produit;
        if (!productMap.has(pid)) {
          productMap.set(pid, {
            id: pid,
            name: l.produit?.libelle || 'Inconnu',
            category: l.produit?.categories?.[0]?.categorie?.nom || 'Divers',
            vendu: 0,
            ca: 0,
            margeTotal: 0,
            stock: l.produit?.stock?.quantite_en_stock || 0
          });
        }
        const p = productMap.get(pid);
        p.vendu += l.quantite;
        p.ca += Number(l.total_ligne_ht);
        p.margeTotal += Number(l.marge_unitaire) * l.quantite;
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.vendu - a.vendu)
      .slice(0, 5)
      .map((p, index) => ({
        rank: index + 1,
        id: p.id,
        name: p.name,
        category: p.category,
        vendu: p.vendu,
        ca: p.ca,
        marge: p.ca > 0 ? (p.margeTotal / p.ca) * 100 : 0,
        stock: p.stock
      }));

    return { recentSales, topProducts };
  }

  async effectuerClotureJournaliere(userId: number, dateClotureStr: string) {
    const dateCloture = new Date(dateClotureStr);
    dateCloture.setHours(0, 0, 0, 0);

    const existing = await this.prisma.clotureJournaliere.findFirst({
      where: { date_cloture: dateCloture },
    });

    if (existing) {
      throw new BadRequestException(`La clôture du ${dateClotureStr} a déjà été effectuée.`);
    }

    const nextDay = new Date(dateCloture);
    nextDay.setDate(nextDay.getDate() + 1);

    const ventes = await this.prisma.vente.findMany({
      where: {
        date_vente: { gte: dateCloture, lt: nextDay },
        statut_vente: 'VALIDEE',
      },
      include: { lignes: true },
    });

    let caHt = 0;
    let caTtc = 0;
    let tva = 0;
    let benefice = 0;
    let articlesVendus = 0;

    ventes.forEach((v) => {
      caHt += Number(v.total_ht);
      caTtc += Number(v.total_ttc);
      tva += Number(v.total_tva);
      benefice += Number(v.marge_totale);
      v.lignes.forEach((l) => {
        articlesVendus += l.quantite;
      });
    });

    const cloture = await this.prisma.clotureJournaliere.create({
      data: {
        date_cloture: dateCloture,
        chiffre_affaires_ht: caHt,
        chiffre_affaires_ttc: caTtc,
        tva_collectee: tva,
        benefice_brut_total: benefice,
        nombre_ventes: ventes.length,
        nombre_articles_vendus: articlesVendus,
        id_utilisateur_validation: userId,
      },
    });

    return {
      id: String(cloture.id_cloture),
      dateCloture: cloture.date_cloture.toISOString(),
      chiffreAffairesHt: Number(cloture.chiffre_affaires_ht),
      chiffreAffairesTtc: Number(cloture.chiffre_affaires_ttc),
      tvaCollectee: Number(cloture.tva_collectee),
      beneficeBrutTotal: Number(cloture.benefice_brut_total),
      nombreVentes: cloture.nombre_ventes,
      nombreArticlesVendus: cloture.nombre_articles_vendus,
      dateValidation: cloture.date_validation.toISOString(),
    };
  }

  async getHistoriqueClotures() {
    const list = await this.prisma.clotureJournaliere.findMany({
      include: { utilisateur_validation: true },
      orderBy: { date_cloture: 'desc' },
    });

    return list.map((c) => ({
      id: String(c.id_cloture),
      dateCloture: c.date_cloture.toISOString(),
      chiffreAffairesHt: Number(c.chiffre_affaires_ht),
      chiffreAffairesTtc: Number(c.chiffre_affaires_ttc),
      tvaCollectee: Number(c.tva_collectee),
      beneficeBrutTotal: Number(c.benefice_brut_total),
      nombreVentes: c.nombre_ventes,
      nombreArticlesVendus: c.nombre_articles_vendus,
      utilisateurValidationNom: `${c.utilisateur_validation.prenom} ${c.utilisateur_validation.nom}`,
      dateValidation: c.date_validation.toISOString(),
    }));
  }
}
