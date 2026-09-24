import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ClotureResult {
  id: string;
  dateCloture: string;
  chiffreAffairesHt: number;
  chiffreAffairesTtc: number;
  tvaCollectee: number;
  beneficeBrutTotal: number;
  nombreVentes: number;
  nombreArticlesVendus: number;
  utilisateurValidationNom: string;
  utilisateurValidationRole: string;
  dateValidation: string;
  typeCloture: 'MANUELLE' | 'AUTOMATIQUE';
}

@Injectable()
export class FinancesService {
  constructor(private prisma: PrismaService) {}

  async getDashboardKpis(period?: 'jour' | 'semaine' | 'mois' | 'annee') {
    const today = new Date();
    const startDate = new Date(today);
    
    if (period === 'semaine') {
      startDate.setDate(today.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'mois') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'annee') {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // 'jour' par défaut
      startDate.setHours(0, 0, 0, 0);
    }

    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);

    const [ventesPeriode, ventesAujourdhui, rupturesCount, totalMonthSales, achats] = await Promise.all([
      this.prisma.vente.findMany({
        where: {
          date_vente: { gte: startDate },
          statut_vente: 'VALIDEE',
        },
      }),
      this.prisma.vente.findMany({
        where: {
          date_vente: { gte: startOfToday },
          statut_vente: 'VALIDEE',
        },
      }),
      this.prisma.stock.count({ where: { quantite_en_stock: { lte: 0 } } }),
      this.prisma.vente.aggregate({
        _sum: { total_ttc: true },
        where: {
          date_vente: { gte: startOfMonth },
          statut_vente: 'VALIDEE',
        },
      }),
      this.prisma.achat.findMany({
        where: { statut_achat: { not: 'ANNULE' } },
        select: { montant_total_ttc: true, montant_paye: true },
      }),
    ]);

    let caPeriode = 0;
    let beneficeBrutPeriode = 0;
    const ventesPeriodeCount = ventesPeriode.length;

    ventesPeriode.forEach((v) => {
      caPeriode += Number(v.total_ttc);
      beneficeBrutPeriode += Number(v.marge_totale);
    });

    let caJour = 0;
    let beneficeBrutJour = 0;
    ventesAujourdhui.forEach((v) => {
      caJour += Number(v.total_ttc);
      beneficeBrutJour += Number(v.marge_totale);
    });

    const dettesFournisseurs = achats.reduce((acc, a) => {
      const reste = Number(a.montant_total_ttc) - Number(a.montant_paye);
      return acc + (reste > 0 ? reste : 0);
    }, 0);

    const panierMoyen = ventesPeriodeCount > 0 ? caPeriode / ventesPeriodeCount : 0;
    const margeMoyennePourcent = caPeriode > 0 ? (beneficeBrutPeriode / caPeriode) * 100 : 0;

    return {
      period: period || 'jour',
      caPeriode,
      beneficeBrutPeriode,
      margeMoyennePourcent: Number(margeMoyennePourcent.toFixed(1)),
      ventesJourCount: ventesPeriodeCount,
      panierMoyen: Number(panierMoyen.toFixed(2)),
      caJour,
      beneficeBrutJour,
      caMoisTotal: Number(totalMonthSales._sum.total_ttc || 0),
      dettesFournisseurs: Math.round(dettesFournisseurs),
      rupturesStockCount: rupturesCount,
      // Compatibilité
      caJourTrend: 12.4,
      caJourObjectif: 500000,
      caMoisObjectif: 10000000,
    };
  }

  async getDashboardCharts(period?: 'jour' | 'mois' | 'annee', daysCount: number = 7) {
    const count = Number(daysCount) > 0 ? Number(daysCount) : 7;
    const today = new Date();
    const startFilterDate = new Date(today);
    startFilterDate.setDate(today.getDate() - count);
    startFilterDate.setHours(0, 0, 0, 0);

    // 1. Categories Distribution sur la période
    const ventesPeriode = await this.prisma.vente.findMany({
      where: { date_vente: { gte: startFilterDate }, statut_vente: 'VALIDEE' },
      include: { lignes: { include: { produit: { include: { categories: { include: { categorie: true } } } } } } },
    });

    const catMap = new Map<string, number>();
    ventesPeriode.forEach((v) => {
      v.lignes.forEach((l) => {
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
      value: Number(value.toFixed(0)),
    }));

    if (categoriesDistribution.length === 0) {
      categoriesDistribution.push({ name: 'Aucune donnée', value: 100 });
    }

    // 2. Daily Trends pour le nombre de jours demandé
    const weeklyTrends: { jour: string; semaine: number; precedente: number }[] = [];
    const caTrends: { mois: string; ca: number; benefice: number }[] = [];
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dNext = new Date(d);
      dNext.setDate(dNext.getDate() + 1);

      const dPrev = new Date(d);
      dPrev.setDate(dPrev.getDate() - count);
      const dPrevNext = new Date(dPrev);
      dPrevNext.setDate(dPrevNext.getDate() + 1);

      const currentSales = await this.prisma.vente.aggregate({
        _sum: { total_ttc: true, marge_totale: true },
        where: { date_vente: { gte: d, lt: dNext }, statut_vente: 'VALIDEE' },
      });

      const prevSales = await this.prisma.vente.aggregate({
        _sum: { total_ttc: true },
        where: { date_vente: { gte: dPrev, lt: dPrevNext }, statut_vente: 'VALIDEE' },
      });

      const ca = Number(currentSales._sum.total_ttc || 0);
      const benefice = Number(currentSales._sum.marge_totale || 0);
      const prevCa = Number(prevSales._sum.total_ttc || 0);

      const label =
        count <= 7
          ? dayNames[d.getDay()]
          : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

      weeklyTrends.push({ jour: label, semaine: ca, precedente: prevCa });
      caTrends.push({ mois: label, ca: ca, benefice: benefice });
    }

    return {
      categoriesDistribution,
      weeklyTrends,
      caTrends,
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
      include: {
        utilisateur_validation: {
          select: {
            id_utilisateur: true,
            nom: true,
            prenom: true,
            role: { select: { code_role: true } },
            email: true,
          },
        },
      },
      orderBy: { date_cloture: 'desc' },
    });

    const closedDatesSet = new Set(
      list.map((c) => c.date_cloture.toISOString().split('T')[0]),
    );

    // Récupérer les ventes des 60 derniers jours pour détecter les jours avec activité non clôturés manuellement
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    sixtyDaysAgo.setHours(0, 0, 0, 0);

    const todayStr = new Date().toISOString().split('T')[0];

    const pastSales = await this.prisma.vente.findMany({
      where: {
        date_vente: { gte: sixtyDaysAgo },
        statut_vente: 'VALIDEE',
      },
      include: { lignes: true },
      orderBy: { date_vente: 'desc' },
    });

    // Grouper par date YYYY-MM-DD
    const salesByDay = new Map<string, typeof pastSales>();
    pastSales.forEach((v) => {
      const dayStr = v.date_vente.toISOString().split('T')[0];
      if (dayStr < todayStr && !closedDatesSet.has(dayStr)) {
        if (!salesByDay.has(dayStr)) {
          salesByDay.set(dayStr, []);
        }
        salesByDay.get(dayStr)!.push(v);
      }
    });

    const manualItems: ClotureResult[] = list.map((c) => ({
      id: String(c.id_cloture),
      dateCloture: c.date_cloture.toISOString(),
      chiffreAffairesHt: Number(c.chiffre_affaires_ht),
      chiffreAffairesTtc: Number(c.chiffre_affaires_ttc),
      tvaCollectee: Number(c.tva_collectee),
      beneficeBrutTotal: Number(c.benefice_brut_total),
      nombreVentes: c.nombre_ventes,
      nombreArticlesVendus: c.nombre_articles_vendus,
      utilisateurValidationNom: `${c.utilisateur_validation.prenom} ${c.utilisateur_validation.nom}`.trim(),
      utilisateurValidationRole: c.utilisateur_validation.role?.code_role || 'ADMIN',
      dateValidation: c.date_validation.toISOString(),
      typeCloture: 'MANUELLE',
    }));

    const autoItems: ClotureResult[] = [];
    salesByDay.forEach((ventes, dayStr) => {
      let caHt = 0;
      let caTtc = 0;
      let tva = 0;
      let benefice = 0;
      let articles = 0;

      ventes.forEach((v) => {
        caHt += Number(v.total_ht);
        caTtc += Number(v.total_ttc);
        tva += Number(v.total_tva);
        benefice += Number(v.marge_totale);
        v.lignes.forEach((l) => {
          articles += l.quantite;
        });
      });

      autoItems.push({
        id: `auto-${dayStr}`,
        dateCloture: new Date(`${dayStr}T00:00:00.000Z`).toISOString(),
        chiffreAffairesHt: Math.round(caHt),
        chiffreAffairesTtc: Math.round(caTtc),
        tvaCollectee: Math.round(tva),
        beneficeBrutTotal: Math.round(benefice),
        nombreVentes: ventes.length,
        nombreArticlesVendus: articles,
        utilisateurValidationNom: 'Système Automatique (00:00)',
        utilisateurValidationRole: 'SYSTEME',
        dateValidation: `${dayStr}T00:00:00.000Z`,
        typeCloture: 'AUTOMATIQUE',
      });
    });

    const all = [...manualItems, ...autoItems];
    all.sort((a, b) => new Date(b.dateCloture).getTime() - new Date(a.dateCloture).getTime());
    return all;
  }
}
