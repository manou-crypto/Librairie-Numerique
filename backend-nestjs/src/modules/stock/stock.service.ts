import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { search?: string; status?: string }) {
    const stocks = await this.prisma.stock.findMany({
      include: {
        produit: {
          include: {
            categories: { include: { categorie: true } },
          },
        },
      },
      orderBy: { id_stock: 'asc' },
    });

    let result = stocks.map((s) => {
      const qte = s.quantite_en_stock;
      const seuil = s.seuil_alerte;
      return {
        id: String(s.id_stock),
        produitId: String(s.id_produit),
        produitReference: s.produit.reference,
        produitLibelle: s.produit.libelle,
        categoryName: s.produit.categories[0]?.categorie?.nom || 'Général',
        quantiteEnStock: qte,
        quantiteEtal: s.quantite_etal,
        seuilAlerte: seuil,
        dateDerniereEntree: s.date_derniere_entree ? s.date_derniere_entree.toISOString() : undefined,
        dateDerniereSortie: s.date_derniere_sortie ? s.date_derniere_sortie.toISOString() : undefined,
        estEnAlerte: qte > 0 && qte <= seuil,
        estEnRupture: qte === 0,
      };
    });

    if (query?.search) {
      const q = query.search.toLowerCase();
      result = result.filter(
        (r) => r.produitLibelle.toLowerCase().includes(q) || r.produitReference.toLowerCase().includes(q)
      );
    }

    if (query?.status === 'rupture') {
      result = result.filter((r) => r.estEnRupture);
    } else if (query?.status === 'alerte') {
      result = result.filter((r) => r.estEnAlerte);
    } else if (query?.status === 'ok') {
      result = result.filter((r) => !r.estEnAlerte && !r.estEnRupture);
    }

    return result;
  }

  async ajusterStock(userId: number, data: { produitId: string; typeMouvement: 'ENTREE_ACHAT' | 'SORTIE_VENTE' | 'AJUSTEMENT_INVENTAIRE'; quantite: number; achatId?: string; seuilAlerte?: number }) {
    const produitIdNum = Number(data.produitId);
    const currentStock = await this.prisma.stock.findUnique({
      where: { id_produit: produitIdNum },
    });

    const nouvelleQte = currentStock
      ? data.typeMouvement === 'ENTREE_ACHAT'
        ? currentStock.quantite_en_stock + data.quantite
        : data.typeMouvement === 'SORTIE_VENTE'
        ? Math.max(0, currentStock.quantite_en_stock - data.quantite)
        : data.quantite // AJUSTEMENT_INVENTAIRE
      : data.quantite;

    const [updatedStock, mouvement] = await this.prisma.$transaction([
      this.prisma.stock.upsert({
        where: { id_produit: produitIdNum },
        update: {
          quantite_en_stock: nouvelleQte,
          ...(data.typeMouvement === 'ENTREE_ACHAT' || data.typeMouvement === 'AJUSTEMENT_INVENTAIRE'
            ? { date_derniere_entree: new Date() }
            : { date_derniere_sortie: new Date() }),
        },
        create: {
          id_produit: produitIdNum,
          quantite_en_stock: nouvelleQte,
          quantite_etal: 0,
          seuil_alerte: data.seuilAlerte || 5,
          date_derniere_entree: new Date(),
        }
      }),
      this.prisma.mouvementStock.create({
        data: {
          id_produit: produitIdNum,
          id_utilisateur: userId,
          type_mouvement: data.typeMouvement,
          quantite: data.quantite,
          ...(data.achatId ? { id_achat: Number(data.achatId) } : {}),
        },
      }),
    ]);

    return {
      id: String(mouvement.id_mouvement),
      produitId: String(mouvement.id_produit),
      utilisateurId: mouvement.id_utilisateur,
      typeMouvement: mouvement.type_mouvement,
      quantite: mouvement.quantite,
      dateMouvement: mouvement.date_mouvement.toISOString(),
      nouvelleQuantiteEnStock: updatedStock.quantite_en_stock,
    };
  }

  async transfererEtal(userId: number, data: { produitId: string; typeMouvement: 'TRANSFERT_ETAL' | 'RETOUR_RESERVE'; quantite: number }) {
    const produitIdNum = Number(data.produitId);
    const stock = await this.prisma.stock.findUnique({
      where: { id_produit: produitIdNum },
    });

    if (!stock) {
      throw new NotFoundException(`Stock introuvable pour le produit #${data.produitId}`);
    }

    if (data.typeMouvement === 'TRANSFERT_ETAL' && stock.quantite_en_stock < data.quantite) {
      throw new BadRequestException("Quantité en réserve insuffisante.");
    }
    if (data.typeMouvement === 'RETOUR_RESERVE' && stock.quantite_etal < data.quantite) {
      throw new BadRequestException("Quantité en étal insuffisante.");
    }

    const nouvelleQteReserve =
      data.typeMouvement === 'TRANSFERT_ETAL'
        ? stock.quantite_en_stock - data.quantite
        : stock.quantite_en_stock + data.quantite;

    const nouvelleQteEtal =
      data.typeMouvement === 'TRANSFERT_ETAL'
        ? stock.quantite_etal + data.quantite
        : stock.quantite_etal - data.quantite;

    const [updatedStock, mouvement] = await this.prisma.$transaction([
      this.prisma.stock.update({
        where: { id_produit: produitIdNum },
        data: {
          quantite_en_stock: nouvelleQteReserve,
          quantite_etal: nouvelleQteEtal,
        },
      }),
      this.prisma.mouvementStock.create({
        data: {
          id_produit: produitIdNum,
          id_utilisateur: userId,
          type_mouvement: data.typeMouvement,
          quantite: data.quantite,
        },
      }),
    ]);

    return {
      id: String(mouvement.id_mouvement),
      produitId: String(mouvement.id_produit),
      utilisateurId: mouvement.id_utilisateur,
      typeMouvement: mouvement.type_mouvement,
      quantite: mouvement.quantite,
      dateMouvement: mouvement.date_mouvement.toISOString(),
      nouvelleQuantiteEnStock: updatedStock.quantite_en_stock,
      nouvelleQuantiteEtal: updatedStock.quantite_etal,
    };
  }

  async getMouvements(produitId?: string) {
    const where = produitId ? { id_produit: Number(produitId) } : {};
    const mouvements = await this.prisma.mouvementStock.findMany({
      where,
      include: { produit: true, utilisateur: true },
      orderBy: { date_mouvement: 'desc' },
      take: 100,
    });

    return mouvements.map((m) => ({
      id: String(m.id_mouvement),
      produitId: String(m.id_produit),
      produitLibelle: m.produit.libelle,
      utilisateurNom: `${m.utilisateur.prenom} ${m.utilisateur.nom}`,
      typeMouvement: m.type_mouvement,
      quantite: m.quantite,
      dateMouvement: m.date_mouvement.toISOString(),
    }));
  }
}
