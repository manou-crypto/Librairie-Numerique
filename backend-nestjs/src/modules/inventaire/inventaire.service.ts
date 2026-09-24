import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InventaireService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll() {
    const list = await this.prisma.inventaire.findMany({
      include: { utilisateur: true },
      orderBy: { date_inventaire: 'desc' },
    });
    return list.map((i) => ({
      id: String(i.id_inventaire),
      referenceInventaire: i.reference_inventaire,
      utilisateurId: i.id_utilisateur,
      utilisateurNom: `${i.utilisateur.prenom} ${i.utilisateur.nom}`,
      dateInventaire: i.date_inventaire.toISOString(),
      statutInventaire: i.statut_inventaire,
      observations: i.observations || undefined,
      dateValidation: i.date_validation ? i.date_validation.toISOString() : undefined,
      validateurNom: i.validateur_nom || undefined,
      demandeInvalidation: i.demande_invalidation,
      motifInvalidation: i.motif_invalidation || undefined,
      dateDemandeInvalidation: i.date_demande_invalidation ? i.date_demande_invalidation.toISOString() : undefined,
      demandeurInvalidationNom: i.demandeur_invalidation_nom || undefined,
      dateInvalidation: i.date_invalidation ? i.date_invalidation.toISOString() : undefined,
      utilisateurInvalidationNom: i.utilisateur_invalidation_nom || undefined,
    }));
  }

  async create(userId: number, data: { referenceInventaire: string; observations?: string; lignes: { produitId: string; quantiteTheorique: number; quantiteReelle: number; motifAjustement?: string }[] }) {
    const inv = await this.prisma.inventaire.create({
      data: {
        reference_inventaire: data.referenceInventaire,
        id_utilisateur: userId,
        statut_inventaire: 'EN_COURS',
        observations: data.observations || null,
        lignes: {
          create: data.lignes.map((l) => ({
            id_produit: Number(l.produitId),
            quantite_theorique: l.quantiteTheorique,
            quantite_reelle: l.quantiteReelle,
            ecart: l.quantiteReelle - l.quantiteTheorique,
            motif_ajustement: l.motifAjustement || null,
          })),
        },
      },
      include: { utilisateur: true },
    });

    return {
      id: String(inv.id_inventaire),
      referenceInventaire: inv.reference_inventaire,
      utilisateurId: inv.id_utilisateur,
      utilisateurNom: `${inv.utilisateur.prenom} ${inv.utilisateur.nom}`,
      statutInventaire: inv.statut_inventaire,
      dateInventaire: inv.date_inventaire.toISOString(),
      demandeInvalidation: false,
    };
  }

  async findOne(id: number) {
    const i = await this.prisma.inventaire.findUnique({
      where: { id_inventaire: id },
      include: { 
        utilisateur: true,
        lignes: { include: { produit: true } }
      },
    });

    if (!i) throw new NotFoundException(`Inventaire #${id} introuvable`);

    return {
      id: String(i.id_inventaire),
      referenceInventaire: i.reference_inventaire,
      utilisateurId: i.id_utilisateur,
      utilisateurNom: `${i.utilisateur.prenom} ${i.utilisateur.nom}`,
      dateInventaire: i.date_inventaire.toISOString(),
      statutInventaire: i.statut_inventaire,
      observations: i.observations || undefined,
      dateValidation: i.date_validation ? i.date_validation.toISOString() : undefined,
      validateurNom: i.validateur_nom || undefined,
      demandeInvalidation: i.demande_invalidation,
      motifInvalidation: i.motif_invalidation || undefined,
      dateDemandeInvalidation: i.date_demande_invalidation ? i.date_demande_invalidation.toISOString() : undefined,
      demandeurInvalidationNom: i.demandeur_invalidation_nom || undefined,
      dateInvalidation: i.date_invalidation ? i.date_invalidation.toISOString() : undefined,
      utilisateurInvalidationNom: i.utilisateur_invalidation_nom || undefined,
      lignes: i.lignes.map((l) => ({
        id: String(l.id_ligne_inventaire),
        produitId: String(l.id_produit),
        produitLibelle: l.produit.libelle,
        quantiteTheorique: l.quantite_theorique,
        quantiteReelle: l.quantite_reelle,
        ecart: l.ecart,
        motifAjustement: l.motif_ajustement || undefined,
      })),
    };
  }

  async update(id: number, userId: number, data: { observations?: string; lignes: { produitId: string; quantiteTheorique: number; quantiteReelle: number; motifAjustement?: string }[] }) {
    const inv = await this.prisma.inventaire.findUnique({ where: { id_inventaire: id } });
    if (!inv) throw new NotFoundException(`Inventaire #${id} introuvable`);
    if (inv.statut_inventaire === 'VALIDE') throw new BadRequestException('Un inventaire validé ne peut pas être modifié');

    await this.prisma.$transaction(async (tx) => {
      await tx.inventaire.update({
        where: { id_inventaire: id },
        data: { observations: data.observations || null },
      });

      await tx.ligneInventaire.deleteMany({ where: { id_inventaire: id } });

      if (data.lignes && data.lignes.length > 0) {
        await tx.ligneInventaire.createMany({
          data: data.lignes.map((l) => ({
            id_inventaire: id,
            id_produit: Number(l.produitId),
            quantite_theorique: l.quantiteTheorique,
            quantite_reelle: l.quantiteReelle,
            ecart: l.quantiteReelle - l.quantiteTheorique,
            motif_ajustement: l.motifAjustement || null,
          })),
        });
      }
    });

    return this.findOne(id);
  }

  async valider(id: number, userId: number) {
    const inv = await this.prisma.inventaire.findUnique({
      where: { id_inventaire: id },
      include: { lignes: true },
    });

    if (!inv) throw new NotFoundException(`Inventaire #${id} introuvable`);
    if (inv.statut_inventaire === 'VALIDE') throw new BadRequestException('Cet inventaire est déjà validé');

    const user = await this.prisma.utilisateur.findUnique({ where: { id_utilisateur: userId } });
    const validateurNom = user ? `${user.prenom} ${user.nom}` : undefined;

    await this.prisma.$transaction(async (tx) => {
      await tx.inventaire.update({
        where: { id_inventaire: id },
        data: { 
          statut_inventaire: 'VALIDE',
          date_validation: new Date(),
          validateur_nom: validateurNom,
        },
      });

      for (const l of inv.lignes) {
        if (inv.reference_inventaire.includes('-VTE-')) {
          await tx.stock.update({
            where: { id_produit: l.id_produit },
            data: { quantite_etal: l.quantite_reelle },
          });
        } else if (inv.reference_inventaire.includes('-RES-')) {
          await tx.stock.update({
            where: { id_produit: l.id_produit },
            data: { quantite_en_stock: l.quantite_reelle },
          });
        } else {
          await tx.stock.update({
            where: { id_produit: l.id_produit },
            data: { quantite_en_stock: l.quantite_reelle, quantite_etal: 0 },
          });
        }

        if (l.ecart !== 0) {
          await tx.mouvementStock.create({
            data: {
              id_produit: l.id_produit,
              id_utilisateur: userId,
              type_mouvement: 'AJUSTEMENT_INVENTAIRE',
              quantite: l.ecart,
            },
          });
        }
      }
    });

    return this.findOne(id);
  }

  async demanderInvalidation(id: number, userId: number, motif: string) {
    const inv = await this.prisma.inventaire.findUnique({ where: { id_inventaire: id } });
    if (!inv) throw new NotFoundException(`Inventaire #${id} introuvable`);
    if (inv.statut_inventaire !== 'VALIDE') {
      throw new BadRequestException('Seul un inventaire validé peut faire l\'objet d\'une demande d\'invalidation');
    }
    if (!motif || !motif.trim()) {
      throw new BadRequestException('Le motif d\'invalidation est obligatoire');
    }

    const user = await this.prisma.utilisateur.findUnique({ where: { id_utilisateur: userId } });
    const demandeurNom = user ? `${user.prenom} ${user.nom}` : 'Utilisateur';

    await this.prisma.inventaire.update({
      where: { id_inventaire: id },
      data: {
        demande_invalidation: true,
        motif_invalidation: motif.trim(),
        date_demande_invalidation: new Date(),
        demandeur_invalidation_nom: demandeurNom,
      },
    });

    // Envoi de notification d'alerte pour les administrateurs
    await this.notificationsService.createNotification(
      'alerte',
      'Demande d\'invalidation d\'inventaire',
      `L'utilisateur ${demandeurNom} a demandé l'invalidation de l'inventaire ${inv.reference_inventaire}. Motif : ${motif.trim()}`,
    ).catch(() => {});

    return this.findOne(id);
  }

  async invalider(id: number, adminUser: { id: number; prenom: string; nom: string }) {
    const inv = await this.prisma.inventaire.findUnique({
      where: { id_inventaire: id },
      include: { lignes: true },
    });

    if (!inv) throw new NotFoundException(`Inventaire #${id} introuvable`);
    if (inv.statut_inventaire !== 'VALIDE') {
      throw new BadRequestException('Seul un inventaire validé peut être invalidé');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.inventaire.update({
        where: { id_inventaire: id },
        data: {
          statut_inventaire: 'ANNULE',
          demande_invalidation: false,
          date_invalidation: new Date(),
          utilisateur_invalidation_nom: `${adminUser.prenom} ${adminUser.nom}`,
        },
      });

      // Rétablissement des stocks : inversion des ajustements précédents
      for (const l of inv.lignes) {
        if (l.ecart !== 0) {
          if (inv.reference_inventaire.includes('-VTE-')) {
            await tx.stock.update({
              where: { id_produit: l.id_produit },
              data: { quantite_etal: { decrement: l.ecart } },
            });
          } else if (inv.reference_inventaire.includes('-RES-')) {
            await tx.stock.update({
              where: { id_produit: l.id_produit },
              data: { quantite_en_stock: { decrement: l.ecart } },
            });
          } else {
            await tx.stock.update({
              where: { id_produit: l.id_produit },
              data: { quantite_en_stock: { decrement: l.ecart } },
            });
          }

          await tx.mouvementStock.create({
            data: {
              id_produit: l.id_produit,
              id_utilisateur: adminUser.id,
              type_mouvement: 'AJUSTEMENT_INVENTAIRE',
              quantite: -l.ecart,
            },
          });
        }
      }
    });

    // Notification info
    await this.notificationsService.createNotification(
      'info',
      'Inventaire invalidé',
      `L'inventaire ${inv.reference_inventaire} a été invalidé par l'administrateur ${adminUser.prenom} ${adminUser.nom}. Les stocks ont été rétablis.`,
    ).catch(() => {});

    return this.findOne(id);
  }

  async rejeterDemandeInvalidation(id: number, adminUser: { id: number; prenom: string; nom: string }) {
    const inv = await this.prisma.inventaire.findUnique({ where: { id_inventaire: id } });
    if (!inv) throw new NotFoundException(`Inventaire #${id} introuvable`);

    await this.prisma.inventaire.update({
      where: { id_inventaire: id },
      data: {
        demande_invalidation: false,
      },
    });

    await this.notificationsService.createNotification(
      'info',
      'Demande d\'invalidation rejetée',
      `La demande d'invalidation pour l'inventaire ${inv.reference_inventaire} a été rejetée par l'administrateur ${adminUser.prenom} ${adminUser.nom}.`,
    ).catch(() => {});

    return this.findOne(id);
  }
}
