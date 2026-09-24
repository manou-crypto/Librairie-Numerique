import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AchatsService {
  constructor(private prisma: PrismaService) {}

  private checkOwnership(achat: any, user: any) {
    if (user.role !== 'ADMIN' && achat.id_utilisateur !== user.id) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à modifier ce bon d'achat.");
    }
  }

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
      utilisateurNom: `${a.utilisateur.nom} ${a.utilisateur.prenom}`,
      dateAchat: a.date_achat.toISOString(),
      datePrevueReception: a.date_prevue_reception ? a.date_prevue_reception.toISOString() : undefined,
      dateReception: a.date_reception ? a.date_reception.toISOString() : undefined,
      montantTotalHt: Number(a.montant_total_ht),
      montantTotalTtc: Number(a.montant_total_ttc),
      montantPaye: Number(a.montant_paye),
      modePaiement: a.mode_paiement,
      statutAchat: a.statut_achat,
      createdAt: a.created_at.toISOString(),
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
      utilisateurNom: `${a.utilisateur.nom} ${a.utilisateur.prenom}`,
      dateAchat: a.date_achat.toISOString(),
      datePrevueReception: a.date_prevue_reception ? a.date_prevue_reception.toISOString() : undefined,
      dateReception: a.date_reception ? a.date_reception.toISOString() : undefined,
      montantTotalHt: Number(a.montant_total_ht),
      montantTotalTtc: Number(a.montant_total_ttc),
      montantPaye: Number(a.montant_paye),
      modePaiement: a.mode_paiement,
      statutAchat: a.statut_achat,
      createdAt: a.created_at.toISOString(),
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

  async create(user: any, data: { fournisseurId: string; datePrevueReception?: string; montantPaye?: number; modePaiement?: any; lignes: { produitId: string; quantiteCommandee: number; prixAchatUnitaireHt: number }[] }) {
    if (data.datePrevueReception) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(data.datePrevueReception) < today) {
        throw new BadRequestException('La date prévue de réception ne peut pas être dans le passé');
      }
    }

    const config = await this.prisma.configuration.findUnique({ where: { id_configuration: 1 } });
    const tauxTva = config ? Number(config.tva) / 100 : 0;

    const prefix = `BON-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const lastAchat = await this.prisma.achat.findFirst({
      where: { numero_facture_fournisseur: { startsWith: prefix } },
      orderBy: { date_achat: 'desc' },
    });
    let seq = 1;
    if (lastAchat) {
      const parts = lastAchat.numero_facture_fournisseur.split('-');
      seq = parseInt(parts[parts.length - 1]) + 1 || 1;
    }
    const numeroAuto = `${prefix}-${String(seq).padStart(4, '0')}`;

    let totalHt = 0;
    data.lignes.forEach((l) => totalHt += l.quantiteCommandee * l.prixAchatUnitaireHt);

    const achat = await this.prisma.achat.create({
      data: {
        numero_facture_fournisseur: numeroAuto,
        id_fournisseur: Number(data.fournisseurId),
        id_utilisateur: user.id,
        montant_total_ht: totalHt,
        montant_total_ttc: totalHt * (1 + tauxTva),
        montant_paye: data.montantPaye || 0,
        mode_paiement: data.modePaiement || null,
        statut_achat: 'EN_ATTENTE',
        date_prevue_reception: data.datePrevueReception ? new Date(data.datePrevueReception) : null,
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

    return { id: String(achat.id_achat) };
  }

  async createRetroactif(user: any, data: { fournisseurId: string; dateAchat: string; montantPaye?: number; modePaiement?: any; lignes: { produitId: string; quantiteCommandee: number; prixAchatUnitaireHt: number }[] }) {
    if (new Date(data.dateAchat) > new Date()) {
      throw new BadRequestException("Un achat rétroactif ne peut pas être dans le futur.");
    }

    const config = await this.prisma.configuration.findUnique({ where: { id_configuration: 1 } });
    const tauxTva = config ? Number(config.tva) / 100 : 0;

    const prefix = `BON-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const lastAchat = await this.prisma.achat.findFirst({
      where: { numero_facture_fournisseur: { startsWith: prefix } },
      orderBy: { date_achat: 'desc' },
    });
    let seq = 1;
    if (lastAchat) {
      const parts = lastAchat.numero_facture_fournisseur.split('-');
      seq = parseInt(parts[parts.length - 1]) + 1 || 1;
    }
    const numeroAuto = `${prefix}-${String(seq).padStart(4, '0')}`;

    let totalHt = 0;
    data.lignes.forEach((l) => totalHt += l.quantiteCommandee * l.prixAchatUnitaireHt);

    return this.prisma.$transaction(async (tx) => {
      const achat = await tx.achat.create({
        data: {
          numero_facture_fournisseur: numeroAuto,
          id_fournisseur: Number(data.fournisseurId),
          id_utilisateur: user.id,
          montant_total_ht: totalHt,
          montant_total_ttc: totalHt * (1 + tauxTva),
          montant_paye: data.montantPaye || 0,
          mode_paiement: data.modePaiement || null,
          statut_achat: 'RECU',
          date_achat: new Date(data.dateAchat),
          date_reception: new Date(data.dateAchat),
          lignes: {
            create: data.lignes.map((l) => ({
              id_produit: Number(l.produitId),
              quantite_commandee: l.quantiteCommandee,
              quantite_recue: l.quantiteCommandee, // fully received directly
              prix_achat_unitaire_ht: l.prixAchatUnitaireHt,
            })),
          },
        },
      });

      for (const item of data.lignes) {
        if (item.quantiteCommandee > 0) {
          await tx.stock.update({
            where: { id_produit: Number(item.produitId) },
            data: { quantite_en_stock: { increment: item.quantiteCommandee }, date_derniere_entree: new Date() },
          });
          await tx.mouvementStock.create({
            data: {
              id_produit: Number(item.produitId),
              id_utilisateur: user.id,
              id_achat: achat.id_achat,
              type_mouvement: 'ENTREE_ACHAT',
              quantite: item.quantiteCommandee,
            },
          });
        }
      }
      return { id: String(achat.id_achat) };
    });
  }

  async validerReception(id: number, user: any, data: { lignesRecues: { produitId: string; quantiteRecue: number; prixAchatUnitaireHt: number }[] }) {
    const achat = await this.prisma.achat.findUnique({ where: { id_achat: id }, include: { lignes: true } });
    if (!achat) throw new NotFoundException(`Achat #${id} introuvable`);
    if (achat.statut_achat !== 'EN_ATTENTE') throw new BadRequestException('Seuls les bons en attente peuvent être réceptionnés');
    
    this.checkOwnership(achat, user);

    const config = await this.prisma.configuration.findUnique({ where: { id_configuration: 1 } });
    const tauxTva = config ? Number(config.tva) / 100 : 0;

    await this.prisma.$transaction(async (tx) => {
      let newTotalHt = 0;
      for (const item of data.lignesRecues) {
        const pId = Number(item.produitId);
        const qte = item.quantiteRecue;
        const prix = item.prixAchatUnitaireHt;

        newTotalHt += qte * prix;

        const ligne = achat.lignes.find((l) => l.id_produit === pId);
        if (ligne) {
          await tx.ligneAchat.update({
            where: { id_ligne_achat: ligne.id_ligne_achat },
            data: { quantite_recue: qte, prix_achat_unitaire_ht: prix },
          });
        }

        if (qte > 0) {
          await tx.stock.update({
            where: { id_produit: pId },
            data: { quantite_en_stock: { increment: qte }, date_derniere_entree: new Date() },
          });
          await tx.mouvementStock.create({
            data: {
              id_produit: pId,
              id_utilisateur: user.id,
              id_achat: id,
              type_mouvement: 'ENTREE_ACHAT',
              quantite: qte,
            },
          });
        }
      }

      await tx.achat.update({
        where: { id_achat: id },
        data: {
          statut_achat: 'RECU',
          date_reception: new Date(),
          montant_total_ht: newTotalHt,
          montant_total_ttc: newTotalHt * (1 + tauxTva),
        },
      });
    });

    return { success: true };
  }

  async annuler(id: number, user: any) {
    const achat = await this.prisma.achat.findUnique({ where: { id_achat: id } });
    if (!achat) throw new NotFoundException(`Achat #${id} introuvable`);
    if (achat.statut_achat !== 'EN_ATTENTE') throw new BadRequestException('Seuls les bons en attente peuvent être annulés');
    
    this.checkOwnership(achat, user);

    await this.prisma.achat.update({ where: { id_achat: id }, data: { statut_achat: 'ANNULE' } });
    return { success: true };
  }

  async remove(id: number, user: any) {
    const achat = await this.prisma.achat.findUnique({ where: { id_achat: id }, include: { lignes: true } });
    if (!achat) throw new NotFoundException(`Achat #${id} introuvable`);
    
    // Vérification de la permission de suppression
    if (user.role !== 'ADMIN') {
      const userWithPerms = await this.prisma.utilisateur.findUnique({
        where: { id_utilisateur: user.id },
        include: { role: { include: { permissions: { include: { permission: true } } } } }
      });
      const hasPermission = userWithPerms?.role?.permissions?.some(p => p.permission.code_permission === 'SUPPRESSION_ACHAT');
      
      if (!hasPermission) {
        throw new ForbiddenException("Vous n'avez pas la permission de supprimer des bons d'achat.");
      }
      this.checkOwnership(achat, user);
    }

    if (achat.statut_achat === 'RECU') {
      await this.prisma.$transaction(async (tx) => {
        // Stock reversal
        for (const ligne of achat.lignes) {
          if (ligne.quantite_recue > 0) {
            const stock = await tx.stock.findUnique({ where: { id_produit: ligne.id_produit } });
            if (!stock || stock.quantite_en_stock < ligne.quantite_recue) {
              throw new BadRequestException(`Impossible de supprimer ce bon : le stock du produit #${ligne.id_produit} deviendrait négatif.`);
            }
            await tx.stock.update({
              where: { id_produit: ligne.id_produit },
              data: { quantite_en_stock: { decrement: ligne.quantite_recue } }
            });
            await tx.mouvementStock.create({
              data: {
                id_produit: ligne.id_produit,
                id_utilisateur: user.id,
                id_achat: id,
                type_mouvement: 'AJUSTEMENT_INVENTAIRE', // or negative ENTREE_ACHAT
                quantite: -ligne.quantite_recue,
              }
            });
          }
        }
        await tx.achat.delete({ where: { id_achat: id } });
      });
    } else {
      await this.prisma.achat.delete({ where: { id_achat: id } });
    }
    return { success: true };
  }

  async update(id: number, user: any, data: any) {
    // Basic update that doesn't touch stock if it's RECU for simplicity of this implementation.
    // If they want full editable lines, we can add it, but it requires deep line-by-line diffs.
    // Let's implement full line replacement:
    const achat = await this.prisma.achat.findUnique({ where: { id_achat: id }, include: { lignes: true } });
    if (!achat) throw new NotFoundException(`Achat #${id} introuvable`);
    
    this.checkOwnership(achat, user);

    if (achat.statut_achat === 'RECU') {
       throw new BadRequestException("La modification d'achats déjà reçus n'est pas encore supportée en détail (seulement suppression).");
    }

    // Just throw for now if they try to update, to keep scope reasonable unless explicitly asked.
    throw new BadRequestException("Update method not fully implemented.");
  }

  async findEnRetard(seuilJours: number = 0) {
    const today = new Date();
    today.setDate(today.getDate() - seuilJours);
    const list = await this.prisma.achat.findMany({
      where: { statut_achat: 'EN_ATTENTE', date_prevue_reception: { lt: today } },
      include: { fournisseur: true },
      orderBy: { date_prevue_reception: 'asc' },
    });
    return list.map((a) => ({
      id: String(a.id_achat),
      numeroFactureFournisseur: a.numero_facture_fournisseur,
      fournisseurId: String(a.id_fournisseur),
      fournisseurNom: a.fournisseur.nom_entreprise,
      dateAchat: a.date_achat.toISOString(),
      datePrevueReception: a.date_prevue_reception?.toISOString(),
      montantTotalHt: Number(a.montant_total_ht),
      joursRetard: Math.floor((Date.now() - a.date_prevue_reception!.getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  async enregistrerPaiement(id: number, user: any, body: { montantVerse: number; modePaiement?: any }) {
    const achat = await this.prisma.achat.findUnique({ where: { id_achat: id } });
    if (!achat) throw new NotFoundException(`Achat #${id} introuvable`);

    const montantVerse = Number(body.montantVerse);
    if (isNaN(montantVerse) || montantVerse <= 0) {
      throw new BadRequestException('Le montant versé doit être supérieur à zéro.');
    }

    const ancienMontantPaye = Number(achat.montant_paye || 0);
    const totalTtc = Number(achat.montant_total_ttc);
    const resteAPayer = Math.max(0, totalTtc - ancienMontantPaye);

    if (montantVerse > resteAPayer + 0.01) {
      throw new BadRequestException(`Le montant versé (${montantVerse.toFixed(2)}) dépasse le reste à payer (${resteAPayer.toFixed(2)}).`);
    }

    const nouveauMontantPaye = Math.min(totalTtc, ancienMontantPaye + montantVerse);

    const updated = await this.prisma.achat.update({
      where: { id_achat: id },
      data: {
        montant_paye: nouveauMontantPaye,
        ...(body.modePaiement ? { mode_paiement: body.modePaiement } : {}),
      },
    });

    return {
      id: String(updated.id_achat),
      montantTotalTtc: Number(updated.montant_total_ttc),
      montantPaye: Number(updated.montant_paye),
      resteAPayer: Math.max(0, Number(updated.montant_total_ttc) - Number(updated.montant_paye)),
      message: 'Paiement enregistré avec succès',
    };
  }
}
