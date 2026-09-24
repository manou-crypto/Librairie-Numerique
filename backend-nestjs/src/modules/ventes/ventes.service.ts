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

  private generateRetourReference(): string {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `RET-${today}-${rand}`;
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
                quantite_retournee: 0,
                nom_kit: l.nomKit || null,
                id_kit_groupe: l.idKitGroupe || null,
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
        nouvelleQuantiteEtal: number;
      }> = [];

      for (const l of payload.lignes) {
        const pId = Number(l.produitId || l.id);
        const qte = l.quantite || l.qty;

        const stockActuel = await tx.stock.findUnique({
          where: { id_produit: pId },
          include: { produit: true },
        });

        if (stockActuel) {
          let resteASoustraire = qte;
          let nouvelleQteEtal = stockActuel.quantite_etal;
          let nouvelleQteReserve = stockActuel.quantite_en_stock;

          if (nouvelleQteEtal >= resteASoustraire) {
            nouvelleQteEtal -= resteASoustraire;
            resteASoustraire = 0;
          } else {
            resteASoustraire -= nouvelleQteEtal;
            nouvelleQteEtal = 0;
            nouvelleQteReserve = Math.max(0, nouvelleQteReserve - resteASoustraire);
          }

          const updatedStock = await tx.stock.update({
            where: { id_produit: pId },
            data: {
              quantite_etal: nouvelleQteEtal,
              quantite_en_stock: nouvelleQteReserve,
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
            nouvelleQuantite: updatedStock.quantite_en_stock + updatedStock.quantite_etal,
            nouvelleQuantiteEtal: updatedStock.quantite_etal,
            seuilAlerte: updatedStock.seuil_alerte,
          });
        }
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
      } else if (su.nouvelleQuantiteEtal === 0 && su.nouvelleQuantite > 0) {
        await this.notificationsService.createNotification(
          'info',
          'Étagère Vide',
          `L'étagère du produit "${su.produitLibelle}" est vide. Pensez à le réapprovisionner depuis la réserve.`
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
        include: {
          lignes: { include: { produit: true } },
          paiements: true,
          retours: true,
        },
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
        retoursCount: v.retours.length,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getVenteById(id: number) {
    const v = await this.prisma.vente.findUnique({
      where: { id_vente: id },
      include: {
        lignes: { include: { produit: true } },
        paiements: true,
        retours: {
          include: {
            lignes: { include: { produit: true } },
            utilisateur: true,
          },
          orderBy: { date_retour: 'desc' },
        },
      },
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
        quantiteRetournee: l.quantite_retournee,
        quantiteRestante: l.quantite - l.quantite_retournee,
        nomKit: l.nom_kit || undefined,
        idKitGroupe: l.id_kit_groupe || undefined,
        prixVenteUnitaireHt: Number(l.prix_vente_unitaire_ht_snapshot),
        tauxTva: Number(l.taux_tva_snapshot),
        totalLigneHt: Number(l.total_ligne_ht),
      })),
      paiements: v.paiements.map((p) => ({
        modePaiement: p.mode_paiement,
        montant: Number(p.montant),
      })),
      retours: v.retours.map((r) => ({
        id: String(r.id_retour_vente),
        referenceRetour: r.reference_retour,
        dateRetour: r.date_retour.toISOString(),
        typeRetour: r.type_retour,
        motif: r.motif,
        montantRembourse: Number(r.montant_rembourse),
        modeRemboursement: r.mode_remboursement,
        utilisateurNom: `${r.utilisateur.prenom} ${r.utilisateur.nom}`,
        lignes: r.lignes.map((lr) => ({
          id: String(lr.id_ligne_retour),
          produitId: String(lr.id_produit),
          produitLibelle: lr.produit.libelle,
          quantiteRetournee: lr.quantite_retournee,
          prixUnitaireRembourse: Number(lr.prix_unitaire_rembourse),
          totalLigne: Number(lr.total_ligne),
        })),
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

  /**
   * Retour d'articles partiel
   */
  async retourArticles(
    venteId: number,
    userId: number,
    payload: {
      lignes: Array<{ ligneVenteId: number; quantite: number }>;
      motif: string;
      modeRemboursement?: any;
    },
  ) {
    const v = await this.prisma.vente.findUnique({
      where: { id_vente: venteId },
      include: {
        lignes: { include: { produit: true } },
      },
    });

    if (!v) throw new NotFoundException(`Vente #${venteId} introuvable`);
    if (v.statut_vente === 'ANNULEE' || v.statut_vente === 'REMBOURSEE') {
      throw new BadRequestException('Cette vente est déjà clôturée ou totalement remboursée');
    }
    if (!payload.lignes || payload.lignes.length === 0) {
      throw new BadRequestException('Veuillez sélectionner au moins un article à retourner');
    }
    if (!payload.motif || !payload.motif.trim()) {
      throw new BadRequestException('Le motif du retour est obligatoire');
    }

    const activeSession = await this.prisma.sessionCaisse.findFirst({
      where: { id_utilisateur: userId, statut_session: 'OUVERTE' },
    });

    const refRetour = this.generateRetourReference();
    const modeRemboursement = payload.modeRemboursement || 'ESPECES';

    let totalRembourse = 0;
    const itemsToProcess: Array<{
      ligneVenteId: number;
      produitId: number;
      produitLibelle: string;
      quantite: number;
      prixUnitaireTtc: number;
      totalLigneTtc: number;
    }> = [];

    for (const reqLine of payload.lignes) {
      if (reqLine.quantite <= 0) continue;

      const ligne = v.lignes.find((l) => l.id_ligne_vente === Number(reqLine.ligneVenteId));
      if (!ligne) {
        throw new BadRequestException(`Ligne de vente #${reqLine.ligneVenteId} introuvable`);
      }

      const qteRestante = ligne.quantite - ligne.quantite_retournee;
      if (reqLine.quantite > qteRestante) {
        throw new BadRequestException(
          `Impossible de retourner ${reqLine.quantite} unité(s) pour "${ligne.produit.libelle}". Quantité restante retournable : ${qteRestante}`,
        );
      }

      const puHt = Number(ligne.prix_vente_unitaire_ht_snapshot);
      const tauxTva = Number(ligne.taux_tva_snapshot);
      const puTtc = puHt * (1 + tauxTva / 100);
      const totalLigne = puTtc * reqLine.quantite;

      totalRembourse += totalLigne;
      itemsToProcess.push({
        ligneVenteId: ligne.id_ligne_vente,
        produitId: ligne.id_produit,
        produitLibelle: ligne.produit.libelle,
        quantite: reqLine.quantite,
        prixUnitaireTtc: puTtc,
        totalLigneTtc: totalLigne,
      });
    }

    if (itemsToProcess.length === 0) {
      throw new BadRequestException('Aucune quantité valide à retourner');
    }

    const retourResult = await this.prisma.$transaction(async (tx) => {
      const ret = await tx.retourVente.create({
        data: {
          reference_retour: refRetour,
          id_vente: venteId,
          id_utilisateur: userId,
          id_session_caisse: activeSession ? activeSession.id_session : null,
          type_retour: 'ARTICLE',
          motif: payload.motif.trim(),
          montant_rembourse: totalRembourse,
          mode_remboursement: modeRemboursement,
          lignes: {
            create: itemsToProcess.map((item) => ({
              id_ligne_vente: item.ligneVenteId,
              id_produit: item.produitId,
              quantite_retournee: item.quantite,
              prix_unitaire_rembourse: item.prixUnitaireTtc,
              total_ligne: item.totalLigneTtc,
            })),
          },
        },
        include: {
          lignes: { include: { produit: true } },
          utilisateur: true,
        },
      });

      for (const item of itemsToProcess) {
        await tx.stock.update({
          where: { id_produit: item.produitId },
          data: {
            quantite_en_stock: { increment: item.quantite },
          },
        });

        await tx.mouvementStock.create({
          data: {
            id_produit: item.produitId,
            id_utilisateur: userId,
            type_mouvement: 'AJUSTEMENT_INVENTAIRE',
            quantite: item.quantite,
          },
        });

        await tx.ligneVente.update({
          where: { id_ligne_vente: item.ligneVenteId },
          data: {
            quantite_retournee: { increment: item.quantite },
          },
        });
      }

      const allLines = await tx.ligneVente.findMany({ where: { id_vente: venteId } });
      const allReturned = allLines.every((l) => l.quantite_retournee >= l.quantite);
      const newStatus = allReturned ? 'REMBOURSEE' : 'PARTIELLEMENT_REMBOURSEE';

      await tx.vente.update({
        where: { id_vente: venteId },
        data: { statut_vente: newStatus },
      });

      if (activeSession && modeRemboursement === 'ESPECES') {
        await tx.sessionCaisse.update({
          where: { id_session: activeSession.id_session },
          data: {
            total_encaisse_calcule: { decrement: totalRembourse },
          },
        });
      }

      return ret;
    });

    await this.notificationsService
      .createNotification(
        'info',
        'Retour d\'article effectué',
        `Retour d'article (${refRetour}) sur le ticket ${v.reference_ticket} : ${totalRembourse.toLocaleString('fr-FR')} FCFA remboursé(s). Motif : ${payload.motif.trim()}`,
      )
      .catch(() => {});

    this.emitFreshKpis().catch(() => {});

    return {
      id: String(retourResult.id_retour_vente),
      referenceRetour: retourResult.reference_retour,
      referenceTicketVente: v.reference_ticket,
      dateRetour: retourResult.date_retour.toISOString(),
      typeRetour: retourResult.type_retour,
      motif: retourResult.motif,
      montantRembourse: Number(retourResult.montant_rembourse),
      modeRemboursement: retourResult.mode_remboursement,
      utilisateurNom: `${retourResult.utilisateur.prenom} ${retourResult.utilisateur.nom}`,
      lignes: retourResult.lignes.map((l) => ({
        id: String(l.id_ligne_retour),
        produitId: String(l.id_produit),
        produitLibelle: l.produit.libelle,
        quantiteRetournee: l.quantite_retournee,
        prixUnitaireRembourse: Number(l.prix_unitaire_rembourse),
        totalLigne: Number(l.total_ligne),
      })),
    };
  }

  /**
   * Retour de vente complet
   */
  async retourVenteComplete(
    venteId: number,
    userId: number,
    payload: { motif: string; modeRemboursement?: any },
  ) {
    const v = await this.prisma.vente.findUnique({
      where: { id_vente: venteId },
      include: { lignes: true },
    });
    if (!v) throw new NotFoundException(`Vente #${venteId} introuvable`);
    if (v.statut_vente === 'ANNULEE' || v.statut_vente === 'REMBOURSEE') {
      throw new BadRequestException('Cette vente est déjà clôturée ou totalement remboursée');
    }

    const lignesToReturn = v.lignes
      .filter((l) => l.quantite - l.quantite_retournee > 0)
      .map((l) => ({
        ligneVenteId: l.id_ligne_vente,
        quantite: l.quantite - l.quantite_retournee,
      }));

    if (lignesToReturn.length === 0) {
      throw new BadRequestException('Tous les articles de cette vente ont déjà été retournés');
    }

    const res = await this.retourArticles(venteId, userId, {
      lignes: lignesToReturn,
      motif: payload.motif,
      modeRemboursement: payload.modeRemboursement,
    });

    await this.prisma.retourVente.update({
      where: { reference_retour: res.referenceRetour },
      data: { type_retour: 'VENTE' },
    });

    res.typeRetour = 'VENTE';
    return res;
  }

  /**
   * Historique de tous les retours
   */
  async getRetours(query: any = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const [retours, total] = await Promise.all([
      this.prisma.retourVente.findMany({
        include: {
          vente: true,
          utilisateur: true,
          lignes: { include: { produit: true } },
        },
        skip,
        take: pageSize,
        orderBy: { date_retour: 'desc' },
      }),
      this.prisma.retourVente.count(),
    ]);

    return {
      data: retours.map((r) => ({
        id: String(r.id_retour_vente),
        referenceRetour: r.reference_retour,
        venteId: String(r.id_vente),
        referenceTicketVente: r.vente.reference_ticket,
        dateRetour: r.date_retour.toISOString(),
        typeRetour: r.type_retour,
        motif: r.motif,
        montantRembourse: Number(r.montant_rembourse),
        modeRemboursement: r.mode_remboursement,
        utilisateurNom: `${r.utilisateur.prenom} ${r.utilisateur.nom}`,
        lignesCount: r.lignes.length,
        lignes: r.lignes.map((l) => ({
          id: String(l.id_ligne_retour),
          produitId: String(l.id_produit),
          produitLibelle: l.produit.libelle,
          quantiteRetournee: l.quantite_retournee,
          prixUnitaireRembourse: Number(l.prix_unitaire_rembourse),
          totalLigne: Number(l.total_ligne),
        })),
      })),
      total,
      page,
      pageSize,
    };
  }

  async getRetourById(id: number) {
    const r = await this.prisma.retourVente.findUnique({
      where: { id_retour_vente: id },
      include: {
        vente: true,
        utilisateur: true,
        lignes: { include: { produit: true } },
      },
    });
    if (!r) throw new NotFoundException(`Retour #${id} introuvable`);
    return {
      id: String(r.id_retour_vente),
      referenceRetour: r.reference_retour,
      venteId: String(r.id_vente),
      referenceTicketVente: r.vente.reference_ticket,
      dateRetour: r.date_retour.toISOString(),
      typeRetour: r.type_retour,
      motif: r.motif,
      montantRembourse: Number(r.montant_rembourse),
      modeRemboursement: r.mode_remboursement,
      utilisateurNom: `${r.utilisateur.prenom} ${r.utilisateur.nom}`,
      lignes: r.lignes.map((l) => ({
        id: String(l.id_ligne_retour),
        produitId: String(l.id_produit),
        produitLibelle: l.produit.libelle,
        quantiteRetournee: l.quantite_retournee,
        prixUnitaireRembourse: Number(l.prix_unitaire_rembourse),
        totalLigne: Number(l.total_ligne),
      })),
    };
  }

  /**
   * Modèles de kits réutilisables
   */
  async getKits() {
    const kits = await this.prisma.modeleKit.findMany({
      where: { est_actif: true },
      include: {
        lignes: {
          include: {
            produit: {
              include: { stock: true },
            },
          },
        },
      },
      orderBy: { date_creation: 'desc' },
    });

    return kits.map((k) => ({
      id: String(k.id_modele_kit),
      nomKit: k.nom_kit,
      description: k.description || undefined,
      prixForfaitaire: Number(k.prix_forfaitaire),
      dateCreation: k.date_creation.toISOString(),
      lignes: k.lignes.map((l) => ({
        id: String(l.id_ligne_modele_kit),
        produitId: String(l.id_produit),
        produitLibelle: l.produit.libelle,
        produitReference: l.produit.reference,
        prixUnitaireCatalogue: Number(l.produit.prix_vente),
        stockActuel: l.produit.stock?.quantite_en_stock || 0,
        quantite: l.quantite,
      })),
    }));
  }

  async createKit(data: {
    nomKit: string;
    description?: string;
    prixForfaitaire: number;
    lignes: Array<{ produitId: number; quantite: number }>;
  }) {
    if (!data.nomKit || !data.nomKit.trim()) {
      throw new BadRequestException('Le nom du kit est obligatoire');
    }
    if (data.prixForfaitaire <= 0) {
      throw new BadRequestException('Le prix du kit doit être supérieur à zéro');
    }
    if (!data.lignes || data.lignes.length === 0) {
      throw new BadRequestException('Le kit doit contenir au moins un produit');
    }

    const kit = await this.prisma.modeleKit.create({
      data: {
        nom_kit: data.nomKit.trim(),
        description: data.description ? data.description.trim() : null,
        prix_forfaitaire: data.prixForfaitaire,
        lignes: {
          create: data.lignes.map((l) => ({
            id_produit: Number(l.produitId),
            quantite: Math.max(1, Number(l.quantite) || 1),
          })),
        },
      },
      include: {
        lignes: {
          include: {
            produit: {
              include: { stock: true },
            },
          },
        },
      },
    });

    return {
      id: String(kit.id_modele_kit),
      nomKit: kit.nom_kit,
      description: kit.description || undefined,
      prixForfaitaire: Number(kit.prix_forfaitaire),
      lignes: kit.lignes.map((l) => ({
        id: String(l.id_ligne_modele_kit),
        produitId: String(l.id_produit),
        produitLibelle: l.produit.libelle,
        quantite: l.quantite,
      })),
    };
  }

  async deleteKit(id: number) {
    const kit = await this.prisma.modeleKit.findUnique({ where: { id_modele_kit: id } });
    if (!kit) throw new NotFoundException(`Kit #${id} introuvable`);
    await this.prisma.modeleKit.update({
      where: { id_modele_kit: id },
      data: { est_actif: false },
    });
    return { success: true, message: `Kit ${kit.nom_kit} désactivé` };
  }
}
