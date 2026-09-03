import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppGateway } from '../events/app.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class VentesService {
  constructor(
    private prisma: PrismaService,
    private readonly gateway: AppGateway,
    private notificationsService: NotificationsService,
  ) {}

  private generateTicketReference(): string {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `TCK-${today}-${rand}`;
  }

  async createVente(userId: number, payload: any) {
    const activeSession = await this.prisma.sessionCaisse.findFirst({
      where: { id_utilisateur: userId, statut_session: 'OUVERTE' },
    });

    if (!activeSession) {
      throw new BadRequestException("Aucune session de caisse ouverte pour votre compte. Veuillez d'abord ouvrir la caisse.");
    }

    const sessionIdNum = activeSession.id_session;

    let totalHt = 0;
    let totalTva = 0;
    let margeTotale = 0;

    payload.lignes.forEach((l: any) => {
      const prixVenteHt = l.prixVenteUnitaireHtSnapshot || l.prixVente;
      const tauxTva = l.tauxTvaSnapshot !== undefined ? l.tauxTvaSnapshot : 20;
      const prixAchat = l.prixAchatUnitaireSnapshot || 0;
      const qte = l.quantite || l.qty;

      const lineHt = qte * prixVenteHt;
      const lineTva = lineHt * (tauxTva / 100);
      const lineMarge = (prixVenteHt - prixAchat) * qte;

      totalHt += lineHt;
      totalTva += lineTva;
      margeTotale += lineMarge;
    });

    const totalTtc = totalHt + totalTva;
    const refTicket = this.generateTicketReference();

    const vente = await this.prisma.$transaction(async (tx) => {
      const v = await tx.vente.create({
        data: {
          reference_ticket: refTicket,
          id_session: sessionIdNum,
          total_ht: totalHt,
          total_tva: totalTva,
          total_ttc: totalTtc,
          marge_totale: margeTotale,
          statut_vente: 'VALIDEE',
          lignes: {
            create: payload.lignes.map((l: any) => {
              const prixVenteHt = l.prixVenteUnitaireHtSnapshot || l.prixVente;
              const tauxTva = l.tauxTvaSnapshot !== undefined ? l.tauxTvaSnapshot : 20;
              const prixAchat = l.prixAchatUnitaireSnapshot || 0;
              const qte = l.quantite || l.qty;
              return {
                id_produit: Number(l.produitId || l.id),
                quantite: qte,
                prix_achat_unitaire_snapshot: prixAchat,
                prix_vente_unitaire_ht_snapshot: prixVenteHt,
                taux_tva_snapshot: tauxTva,
                marge_unitaire: prixVenteHt - prixAchat,
                total_ligne_ht: qte * prixVenteHt,
              };
            }),
          },
          ...(payload.paiements
            ? {
                paiements: {
                  create: payload.paiements.map((p: any) => ({
                    mode_paiement: p.modePaiement || 'ESPECES',
                    montant: p.montant,
                    reference_transaction: p.referenceTransaction || null,
                  })),
                },
              }
            : {}),
        },
      });

      // Mise à jour du stock pour chaque ligne vendue
      const stockUpdates: Array<{
        produitId: string;
        produitLibelle: string;
        nouvelleQuantite: number;
        seuilAlerte: number;
      }> = [];

      for (const l of payload.lignes) {
        const pId = Number(l.produitId || l.id);
        const qte = l.quantite || l.qty;

        const updatedStock = await tx.stock.update({
          where: { id_produit: pId },
          data: {
            quantite_en_stock: { decrement: qte },
            date_derniere_sortie: new Date(),
          },
          include: { produit: true },
        });

        await tx.mouvementStock.create({
          data: {
            id_produit: pId,
            id_utilisateur: userId,
            type_mouvement: 'SORTIE_VENTE',
            quantite: qte,
          },
        });

        stockUpdates.push({
          produitId: String(pId),
          produitLibelle: updatedStock.produit.libelle,
          nouvelleQuantite: updatedStock.quantite_en_stock,
          seuilAlerte: updatedStock.seuil_alerte,
        });
      }

      await tx.sessionCaisse.update({
        where: { id_session: sessionIdNum },
        data: {
          total_encaisse_calcule: { increment: totalTtc },
        },
      });

      return { v, stockUpdates };
    });

    const result = {
      id: String(vente.v.id_vente),
      referenceTicket: vente.v.reference_ticket,
      dateVente: vente.v.date_vente.toISOString(),
      totalHt: Number(vente.v.total_ht),
      totalTva: Number(vente.v.total_tva),
      totalTtc: Number(vente.v.total_ttc),
      margeTotale: Number(vente.v.marge_totale),
      statutVente: vente.v.statut_vente,
      lignesCount: payload.lignes.length,
    };

    // 📡 Émettre l'événement de vente complétée en temps réel.
    // Tous les clients (Dashboard, page Ventes) recevront cette info instantanément.
    this.gateway.emitSaleCompleted(result);

    // 📡 Émettre les mises à jour de stock pour chaque produit vendu.
    // Les clients peuvent ainsi afficher des alertes de rupture en temps réel.
    for (const su of vente.stockUpdates) {
      const estEnRupture = su.nouvelleQuantite === 0;
      const estEnAlerte = su.nouvelleQuantite > 0 && su.nouvelleQuantite <= su.seuilAlerte;
      this.gateway.emitStockUpdated({
        ...su,
        estEnAlerte,
        estEnRupture,
      });

      // --- NOUVEAU : Création de la notification ---
      if (estEnRupture) {
        await this.notificationsService.createNotification(
          'alerte',
          'Rupture de Stock',
          `Le produit "${su.produitLibelle}" est complètement épuisé.`
        );
      } else if (estEnAlerte) {
        await this.notificationsService.createNotification(
          'alerte',
          'Stock Faible',
          `Attention, le produit "${su.produitLibelle}" a atteint son seuil critique (Reste : ${su.nouvelleQuantite}).`
        );
      }
    }

    // 📡 Calculer et émettre les KPI mis à jour pour le Dashboard.
    // On fait ce calcul en arrière-plan sans bloquer la réponse HTTP.
    this.emitFreshKpis().catch(() => {});

    return result;
  }

  /**
   * Calcule les KPI du tableau de bord et les émet en temps réel.
   * Méthode privée appelée après chaque vente ou annulation.
   */
  private async emitFreshKpis() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [ventesJour, rupturesCount, totalMonthSales] = await Promise.all([
      this.prisma.vente.findMany({
        where: { date_vente: { gte: today }, statut_vente: 'VALIDEE' },
      }),
      this.prisma.stock.count({ where: { quantite_en_stock: 0 } }),
      this.prisma.vente.aggregate({
        _sum: { total_ttc: true },
        where: { statut_vente: 'VALIDEE' },
      }),
    ]);

    let caJour = 0;
    let beneficeBrutJour = 0;
    ventesJour.forEach((v) => {
      caJour += Number(v.total_ttc);
      beneficeBrutJour += Number(v.marge_totale);
    });

    const ventesJourCount = ventesJour.length;
    const panierMoyen = ventesJourCount > 0 ? caJour / ventesJourCount : 0;

    this.gateway.emitKpiUpdate({
      caJour,
      beneficeBrutJour,
      ventesJourCount,
      panierMoyen: Number(panierMoyen.toFixed(2)),
      caMoisTotal: Number(totalMonthSales._sum.total_ttc || caJour),
      rupturesStockCount: rupturesCount,
    });
  }

  async getVentes(query?: { sessionId?: string; statut?: string; page?: number; pageSize?: number }) {
    const page = query?.page ? Number(query.page) : 1;
    const pageSize = query?.pageSize ? Number(query.pageSize) : 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query?.sessionId) where.id_session = Number(query.sessionId);
    if (query?.statut) where.statut_vente = query.statut;

    const [ventes, total] = await Promise.all([
      this.prisma.vente.findMany({
        where,
        include: { lignes: { include: { produit: true } }, paiements: true },
        skip,
        take: pageSize,
        orderBy: { date_vente: 'desc' },
      }),
      this.prisma.vente.count({ where }),
    ]);

    return {
      data: ventes.map((v) => ({
        id: String(v.id_vente),
        referenceTicket: v.reference_ticket,
        dateVente: v.date_vente.toISOString(),
        totalHt: Number(v.total_ht),
        totalTva: Number(v.total_tva),
        totalTtc: Number(v.total_ttc),
        margeTotale: Number(v.marge_totale),
        statutVente: v.statut_vente,
        lignesCount: v.lignes.length,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getVenteById(id: number) {
    const v = await this.prisma.vente.findUnique({
      where: { id_vente: id },
      include: { lignes: { include: { produit: true } }, paiements: true },
    });
    if (!v) throw new NotFoundException(`Vente #${id} introuvable`);
    return {
      id: String(v.id_vente),
      referenceTicket: v.reference_ticket,
      dateVente: v.date_vente.toISOString(),
      totalHt: Number(v.total_ht),
      totalTva: Number(v.total_tva),
      totalTtc: Number(v.total_ttc),
      margeTotale: Number(v.marge_totale),
      statutVente: v.statut_vente,
      lignes: v.lignes.map((l) => ({
        id: String(l.id_ligne_vente),
        produitId: String(l.id_produit),
        produitLibelle: l.produit.libelle,
        quantite: l.quantite,
        prixVenteUnitaireHt: Number(l.prix_vente_unitaire_ht_snapshot),
        tauxTva: Number(l.taux_tva_snapshot),
        totalLigneHt: Number(l.total_ligne_ht),
      })),
      paiements: v.paiements.map((p) => ({
        modePaiement: p.mode_paiement,
        montant: Number(p.montant),
      })),
    };
  }

  async annulerVente(id: number, userId: number, motif?: string) {
    const v = await this.prisma.vente.findUnique({
      where: { id_vente: id },
      include: { lignes: true },
    });
    if (!v) throw new NotFoundException(`Vente #${id} introuvable`);

    await this.prisma.$transaction(async (tx) => {
      await tx.vente.update({
        where: { id_vente: id },
        data: { statut_vente: 'ANNULEE' },
      });

      for (const l of v.lignes) {
        await tx.stock.update({
          where: { id_produit: l.id_produit },
          data: { quantite_en_stock: { increment: l.quantite } },
        });

        await tx.mouvementStock.create({
          data: {
            id_produit: l.id_produit,
            id_utilisateur: userId,
            type_mouvement: 'AJUSTEMENT_INVENTAIRE',
            quantite: l.quantite,
          },
        });
      }
    });

    // 📡 Signaler l'annulation et rafraîchir les KPI
    this.gateway.emitSaleCancelled(String(id));
    this.emitFreshKpis().catch(() => {});

    return this.getVenteById(id);
  }
}
