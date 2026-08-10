import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VentesService {
  constructor(private prisma: PrismaService) {}

  private generateTicketReference(): string {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `TCK-${today}-${rand}`;
  }

  async createVente(userId: number, payload: any) {
    let sessionIdNum = payload.sessionId ? Number(payload.sessionId) : null;

    if (!sessionIdNum) {
      const activeSession = await this.prisma.sessionCaisse.findFirst({
        where: { id_utilisateur: userId, statut_session: 'OUVERTE' },
      });
      if (!activeSession) {
        const anyActive = await this.prisma.sessionCaisse.findFirst({
          where: { statut_session: 'OUVERTE' },
        });
        if (!anyActive) {
          throw new BadRequestException('Aucune session de caisse ouverte. Veuillez d\'abord ouvrir la caisse.');
        }
        sessionIdNum = anyActive.id_session;
      } else {
        sessionIdNum = activeSession.id_session;
      }
    }

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

      for (const l of payload.lignes) {
        const pId = Number(l.produitId || l.id);
        const qte = l.quantite || l.qty;

        await tx.stock.update({
          where: { id_produit: pId },
          data: {
            quantite_en_stock: { decrement: qte },
            date_derniere_sortie: new Date(),
          },
        });

        await tx.mouvementStock.create({
          data: {
            id_produit: pId,
            id_utilisateur: userId,
            type_mouvement: 'SORTIE_VENTE',
            quantite: qte,
          },
        });
      }

      await tx.sessionCaisse.update({
        where: { id_session: sessionIdNum },
        data: {
          total_encaisse_calcule: { increment: totalTtc },
        },
      });

      return v;
    });

    return {
      id: String(vente.id_vente),
      referenceTicket: vente.reference_ticket,
      dateVente: vente.date_vente.toISOString(),
      totalHt: Number(vente.total_ht),
      totalTva: Number(vente.total_tva),
      totalTtc: Number(vente.total_ttc),
      margeTotale: Number(vente.marge_totale),
      statutVente: vente.statut_vente,
    };
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

    return this.getVenteById(id);
  }
}
