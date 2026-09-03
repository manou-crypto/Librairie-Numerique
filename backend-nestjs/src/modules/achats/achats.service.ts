import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AchatsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const list = await this.prisma.achat.findMany({
      include: { fournisseur: true, utilisateur: true },
      orderBy: { date_achat: 'desc' },
    });
    return list.map((a) => ({
      id: String(a.id_achat),
      numeroFactureFournisseur: a.numero_facture_fournisseur,
      fournisseurId: String(a.id_fournisseur),
      fournisseurNom: a.fournisseur.nom_entreprise,
      utilisateurId: a.id_utilisateur,
      dateAchat: a.date_achat.toISOString(),
      dateReception: a.date_reception ? a.date_reception.toISOString() : undefined,
      montantTotalHt: Number(a.montant_total_ht),
      montantTotalTtc: Number(a.montant_total_ttc),
      statutAchat: a.statut_achat,
    }));
  }

  async findOne(id: number) {
    const a = await this.prisma.achat.findUnique({
      where: { id_achat: id },
      include: {
        fournisseur: true,
        utilisateur: true,
        lignes: { include: { produit: true } },
      },
    });
    if (!a) throw new NotFoundException(`Achat #${id} introuvable`);
    return {
      id: String(a.id_achat),
      numeroFactureFournisseur: a.numero_facture_fournisseur,
      fournisseurId: String(a.id_fournisseur),
      fournisseurNom: a.fournisseur.nom_entreprise,
      utilisateurId: a.id_utilisateur,
      dateAchat: a.date_achat.toISOString(),
      dateReception: a.date_reception ? a.date_reception.toISOString() : undefined,
      montantTotalHt: Number(a.montant_total_ht),
      montantTotalTtc: Number(a.montant_total_ttc),
      statutAchat: a.statut_achat,
      lignes: a.lignes.map((l) => ({
        id: String(l.id_ligne_achat),
        produitId: String(l.id_produit),
        produitLibelle: l.produit.libelle,
        quantiteCommandee: l.quantite_commandee,
        quantiteRecue: l.quantite_recue,
        prixAchatUnitaireHt: Number(l.prix_achat_unitaire_ht),
      })),
    };
  }

  async create(userId: number, data: { fournisseurId: string; lignes: { produitId: string; quantiteCommandee: number; prixAchatUnitaireHt: number }[] }) {
    const config = await this.prisma.configuration.findUnique({ where: { id_configuration: 1 } });
    const tauxTva = config ? Number(config.tva) / 100 : 0;

    // Génération automatique du numéro de bon
    const now = new Date();
    const prefix = `BON-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastAchat = await this.prisma.achat.findFirst({
      where: { numero_facture_fournisseur: { startsWith: prefix } },
      orderBy: { date_achat: 'desc' },
    });
    let seq = 1;
    if (lastAchat) {
      const parts = lastAchat.numero_facture_fournisseur.split('-');
      const lastSeq = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    const numeroAuto = `${prefix}-${String(seq).padStart(4, '0')}`;

    let totalHt = 0;
    data.lignes.forEach((l) => {
      totalHt += l.quantiteCommandee * l.prixAchatUnitaireHt;
    });
    const totalTtc = totalHt * (1 + tauxTva);

    const achat = await this.prisma.achat.create({
      data: {
        numero_facture_fournisseur: numeroAuto,
        id_fournisseur: Number(data.fournisseurId),
        id_utilisateur: userId,
        montant_total_ht: totalHt,
        montant_total_ttc: totalTtc,
        statut_achat: 'EN_ATTENTE',
        lignes: {
          create: data.lignes.map((l) => ({
            id_produit: Number(l.produitId),
            quantite_commandee: l.quantiteCommandee,
            quantite_recue: 0,
            prix_achat_unitaire_ht: l.prixAchatUnitaireHt,
          })),
        },
      },
      include: { fournisseur: true },
    });

    return {
      id: String(achat.id_achat),
      numeroFactureFournisseur: achat.numero_facture_fournisseur,
      fournisseurId: String(achat.id_fournisseur),
      fournisseurNom: achat.fournisseur.nom_entreprise,
      utilisateurId: achat.id_utilisateur,
      dateAchat: achat.date_achat.toISOString(),
      montantTotalHt: Number(achat.montant_total_ht),
      montantTotalTtc: Number(achat.montant_total_ttc),
      statutAchat: achat.statut_achat,
    };
  }

  async validerReception(id: number, userId: number, data: { lignesRecues: { produitId: string; quantiteRecue: number }[] }) {
    const achat = await this.prisma.achat.findUnique({
      where: { id_achat: id },
      include: { lignes: true },
    });
    if (!achat) throw new NotFoundException(`Achat #${id} introuvable`);

    await this.prisma.$transaction(async (tx) => {
      await tx.achat.update({
        where: { id_achat: id },
        data: { statut_achat: 'RECU', date_reception: new Date() },
      });

      for (const item of data.lignesRecues) {
        const pId = Number(item.produitId);
        const qte = item.quantiteRecue;

        await tx.stock.update({
          where: { id_produit: pId },
          data: {
            quantite_en_stock: { increment: qte },
            date_derniere_entree: new Date(),
          },
        });

        await tx.mouvementStock.create({
          data: {
            id_produit: pId,
            id_utilisateur: userId,
            id_achat: id,
            type_mouvement: 'ENTREE_ACHAT',
            quantite: qte,
          },
        });
      }
    });

    const updated = await this.prisma.achat.findUnique({
      where: { id_achat: id },
      include: { fournisseur: true },
    });

    if (!updated) throw new NotFoundException(`Achat #${id} introuvable`);

    return {
      id: String(updated.id_achat),
      numeroFactureFournisseur: updated.numero_facture_fournisseur,
      fournisseurNom: updated.fournisseur.nom_entreprise,
      statutAchat: updated.statut_achat,
      dateReception: updated.date_reception?.toISOString(),
    };
  }
}
