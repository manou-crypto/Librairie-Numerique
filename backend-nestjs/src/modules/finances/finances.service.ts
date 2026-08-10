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
