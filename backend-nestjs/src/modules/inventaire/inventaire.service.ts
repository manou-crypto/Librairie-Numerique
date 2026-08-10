import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventaireService {
  constructor(private prisma: PrismaService) {}

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
    });

    return {
      id: String(inv.id_inventaire),
      referenceInventaire: inv.reference_inventaire,
      statutInventaire: inv.statut_inventaire,
      dateInventaire: inv.date_inventaire.toISOString(),
    };
  }

  async valider(id: number, userId: number) {
    const inv = await this.prisma.inventaire.findUnique({
      where: { id_inventaire: id },
      include: { lignes: true },
    });

    if (!inv) throw new NotFoundException(`Inventaire #${id} introuvable`);

    await this.prisma.$transaction(async (tx) => {
      await tx.inventaire.update({
        where: { id_inventaire: id },
        data: { statut_inventaire: 'VALIDE' },
      });

      for (const l of inv.lignes) {
        await tx.stock.update({
          where: { id_produit: l.id_produit },
          data: { quantite_en_stock: l.quantite_reelle },
        });

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

    return {
      id: String(inv.id_inventaire),
      referenceInventaire: inv.reference_inventaire,
      statutInventaire: 'VALIDE',
    };
  }
}
