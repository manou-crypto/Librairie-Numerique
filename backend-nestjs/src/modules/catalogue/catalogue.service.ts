import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CatalogueService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { search?: string; categoryId?: string; status?: string; page?: number; pageSize?: number }) {
    const page = query?.page ? Number(query.page) : 1;
    const pageSize = query?.pageSize ? Number(query.pageSize) : 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (query?.search) {
      where.OR = [
        { libelle: { contains: query.search } },
        { reference: { contains: query.search } },
        { code_barre: { contains: query.search } },
      ];
    }

    if (query?.status === 'VISIBLE' || query?.status === 'MASQUE') {
      where.statut_visibilite = query.status;
    }

    if (query?.categoryId) {
      where.categories = {
        some: { id_categorie: Number(query.categoryId) },
      };
    }

    const [produits, total] = await Promise.all([
      this.prisma.produit.findMany({
        where,
        include: {
          categories: { include: { categorie: true } },
          stock: true,
          images: true,
        },
        skip,
        take: pageSize,
        orderBy: { id_produit: 'desc' },
      }),
      this.prisma.produit.count({ where }),
    ]);

    const formattedData = produits.map((p) => ({
      id: String(p.id_produit),
      reference: p.reference,
      codeBarre: p.code_barre || undefined,
      libelle: p.libelle,
      description: p.description || undefined,
      marque: p.marque || undefined,
      unite: p.unite,
      poids: p.poids ? Number(p.poids) : undefined,
      etat: p.etat,
      prixAchat: Number(p.prix_achat),
      prixVente: Number(p.prix_vente),
      tauxTva: Number(p.taux_tva),
      stock: p.stock?.quantite_en_stock || 0,
      seuilAlerte: p.stock?.seuil_alerte || 5,
      status: p.statut_visibilite,
      categoryId: p.categories[0]?.id_categorie ? String(p.categories[0].id_categorie) : '1',
      categoryName: p.categories[0]?.categorie?.nom || 'Général',
      imageUrl: p.images.find((i) => i.est_principale)?.url_image || p.images[0]?.url_image || undefined,
    }));

    return {
      data: formattedData,
      total,
      page,
      pageSize,
    };
  }

  async findByCodeBarre(code: string) {
    const p = await this.prisma.produit.findFirst({
      where: {
        OR: [
          { code_barre: code },
          { reference: code },
        ],
      },
      include: {
        categories: { include: { categorie: true } },
        stock: true,
        images: true,
      },
    });

    if (!p) {
      throw new NotFoundException(`Produit non trouvé avec le code-barres ou la référence : ${code}`);
    }

    return {
      id: String(p.id_produit),
      reference: p.reference,
      codeBarre: p.code_barre || undefined,
      libelle: p.libelle,
      description: p.description || undefined,
      marque: p.marque || undefined,
      unite: p.unite,
      prixAchat: Number(p.prix_achat),
      prixVente: Number(p.prix_vente),
      tauxTva: Number(p.taux_tva),
      stock: p.stock?.quantite_en_stock || 0,
      seuilAlerte: p.stock?.seuil_alerte || 5,
      status: p.statut_visibilite,
      categoryId: p.categories[0]?.id_categorie ? String(p.categories[0].id_categorie) : '1',
      categoryName: p.categories[0]?.categorie?.nom || 'Général',
      imageUrl: p.images[0]?.url_image || undefined,
    };
  }

  async findOne(id: number) {
    const p = await this.prisma.produit.findUnique({
      where: { id_produit: id },
      include: {
        categories: { include: { categorie: true } },
        stock: true,
        images: true,
        valeurs_attribut: { include: { attribut: true } },
      },
    });

    if (!p) throw new NotFoundException(`Produit #${id} introuvable`);

    return {
      id: String(p.id_produit),
      reference: p.reference,
      codeBarre: p.code_barre || undefined,
      libelle: p.libelle,
      description: p.description || undefined,
      marque: p.marque || undefined,
      unite: p.unite,
      prixAchat: Number(p.prix_achat),
      prixVente: Number(p.prix_vente),
      tauxTva: Number(p.taux_tva),
      stock: p.stock?.quantite_en_stock || 0,
      seuilAlerte: p.stock?.seuil_alerte || 5,
      status: p.statut_visibilite,
      categoryId: p.categories[0]?.id_categorie ? String(p.categories[0].id_categorie) : '1',
      categoryName: p.categories[0]?.categorie?.nom || 'Général',
      imageUrl: p.images[0]?.url_image || undefined,
      attributs: p.valeurs_attribut.map((v) => ({
        code: v.attribut.code_attribut,
        libelle: v.attribut.libelle,
        valeur: v.valeur,
      })),
    };
  }

  async create(data: any) {
    const existing = await this.prisma.produit.findFirst({
      where: { reference: data.reference },
    });
    if (existing) {
      throw new ConflictException(`La référence '${data.reference}' existe déjà`);
    }

    const produit = await this.prisma.produit.create({
      data: {
        reference: data.reference,
        code_barre: data.codeBarre || null,
        libelle: data.libelle || data.name,
        description: data.description || null,
        marque: data.marque || null,
        unite: data.unite || 'Pièce',
        prix_achat: data.prixAchat || 0,
        prix_vente: data.prixVente || 0,
        taux_tva: data.tauxTva || 20,
        statut_visibilite: data.status === 'MASQUE' ? 'MASQUE' : 'VISIBLE',
        stock: {
          create: {
            quantite_en_stock: data.stock || 0,
            seuil_alerte: data.seuilAlerte || 5,
          },
        },
        ...(data.categoryId
          ? {
              categories: {
                create: { id_categorie: Number(data.categoryId) },
              },
            }
          : {}),
      },
      include: { stock: true },
    });

    return this.findOne(produit.id_produit);
  }

  async update(id: number, data: any) {
    await this.findOne(id);

    await this.prisma.produit.update({
      where: { id_produit: id },
      data: {
        ...(data.libelle ? { libelle: data.libelle } : {}),
        ...(data.reference ? { reference: data.reference } : {}),
        ...(data.codeBarre !== undefined ? { code_barre: data.codeBarre } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.prixAchat !== undefined ? { prix_achat: data.prixAchat } : {}),
        ...(data.prixVente !== undefined ? { prix_vente: data.prixVente } : {}),
        ...(data.tauxTva !== undefined ? { taux_tva: data.tauxTva } : {}),
        ...(data.status ? { statut_visibilite: data.status } : {}),
        ...(data.stock !== undefined
          ? {
              stock: {
                update: { quantite_en_stock: data.stock },
              },
            }
          : {}),
      },
    });

    return this.findOne(id);
  }

  async masquer(id: number) {
    await this.findOne(id);
    await this.prisma.produit.update({
      where: { id_produit: id },
      data: { statut_visibilite: 'MASQUE' },
    });
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.produit.delete({ where: { id_produit: id } });
  }

  async getCategories() {
    const categories = await this.prisma.categorie.findMany({
      orderBy: { nom: 'asc' },
    });
    return categories.map((c) => ({
      id: String(c.id_categorie),
      nom: c.nom,
      slug: c.slug,
      parentId: c.id_categorie_parente ? String(c.id_categorie_parente) : null,
    }));
  }
}
