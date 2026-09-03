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
      categoryIds: p.categories.map((c) => String(c.id_categorie)),
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
      categoryIds: p.categories.map((c) => String(c.id_categorie)),
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
      categoryIds: p.categories.map((c) => String(c.id_categorie)),
      imageUrl: p.images[0]?.url_image || undefined,
      attributs: p.valeurs_attribut.map((v) => ({
        code: v.attribut.code_attribut,
        libelle: v.attribut.libelle,
        valeur: v.valeur,
      })),
    };
  }

  async create(data: any) {
    let catExists: any = null;
    if (data.categoryId && !isNaN(Number(data.categoryId))) {
      const catId = Number(data.categoryId);
      catExists = await this.prisma.categorie.findUnique({
        where: { id_categorie: catId },
      });
    }

    let reference = data.reference;
    if (!reference || reference.trim() === '') {
      let prefix = 'PRD';
      if (catExists && catExists.nom) {
        prefix = catExists.nom
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9]/g, '')
          .substring(0, 3).toUpperCase();
        if (prefix.length < 3) {
          prefix = prefix.padEnd(3, 'X');
        }
      }
      
      const lastProd = await this.prisma.produit.findFirst({
        where: { reference: { startsWith: `${prefix}-` } },
        orderBy: { id_produit: 'desc' },
      });

      let nextNum = 1;
      if (lastProd) {
        const parts = lastProd.reference.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) nextNum = lastSeq + 1;
      }
      reference = `${prefix}-${String(nextNum).padStart(4, '0')}`;
    }

    const existing = await this.prisma.produit.findFirst({
      where: { reference },
    });
    if (existing) {
      throw new ConflictException(`La référence '${reference}' existe déjà`);
    }

    let categoryConnect: any = {};
    if (catExists) {
      categoryConnect = {
        categories: {
          create: { id_categorie: catExists.id_categorie },
        },
      };
    }

    const produit = await this.prisma.produit.create({
      data: {
        reference,
        code_barre: data.codeBarre || null,
        libelle: data.libelle || data.name,
        description: data.description || null,
        marque: data.marque || null,
        unite: data.unite || 'Pièce',
        prix_achat: Number(data.prixAchat) || 0,
        prix_vente: Number(data.prixVente) || 0,
        taux_tva: Number(data.tauxTva) || 0,
        statut_visibilite: data.status === 'MASQUE' || data.visible === false ? 'MASQUE' : 'VISIBLE',
        stock: {
          create: {
            quantite_en_stock: Number(data.stock) || 0,
            seuil_alerte: Number(data.seuilAlerte) || 5,
          },
        },
        ...categoryConnect,
      },
      include: { stock: true },
    });

    return this.findOne(produit.id_produit);
  }

  async update(id: number, data: any) {
    await this.findOne(id);

    const updateData: any = {
      ...(data.libelle ? { libelle: data.libelle } : data.name ? { libelle: data.name } : {}),
      ...(data.reference ? { reference: data.reference } : {}),
      ...(data.codeBarre !== undefined ? { code_barre: data.codeBarre } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.marque !== undefined ? { marque: data.marque } : {}),
      ...(data.prixAchat !== undefined ? { prix_achat: Number(data.prixAchat) } : {}),
      ...(data.prixVente !== undefined ? { prix_vente: Number(data.prixVente) } : {}),
      ...(data.tauxTva !== undefined ? { taux_tva: Number(data.tauxTva) } : {}),
      ...(data.status ? { statut_visibilite: data.status === 'MASQUE' || data.visible === false ? 'MASQUE' : 'VISIBLE' } : {}),
    };

    if (data.stock !== undefined || data.seuilAlerte !== undefined) {
      updateData.stock = {
        upsert: {
          create: {
            quantite_en_stock: data.stock !== undefined ? Number(data.stock) : 0,
            seuil_alerte: data.seuilAlerte !== undefined ? Number(data.seuilAlerte) : 5,
          },
          update: {
            ...(data.stock !== undefined ? { quantite_en_stock: Number(data.stock) } : {}),
            ...(data.seuilAlerte !== undefined ? { seuil_alerte: Number(data.seuilAlerte) } : {}),
          },
        },
      };
    }

    await this.prisma.produit.update({
      where: { id_produit: id },
      data: updateData,
    });

    if (data.categoryId && !isNaN(Number(data.categoryId))) {
      const catId = Number(data.categoryId);
      await this.prisma.categorieProduit.deleteMany({ where: { id_produit: id } });
      await this.prisma.categorieProduit.create({
        data: { id_produit: id, id_categorie: catId },
      });
    }

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

  async addImage(produitId: number, url: string, estPrincipale: boolean = false) {
    await this.findOne(produitId);
    
    if (estPrincipale) {
      await this.prisma.imageProduit.updateMany({
        where: { id_produit: produitId },
        data: { est_principale: false },
      });
    }

    return this.prisma.imageProduit.create({
      data: {
        id_produit: produitId,
        url_image: url,
        est_principale: estPrincipale,
      },
    });
  }

  async removeImage(imageId: number) {
    return this.prisma.imageProduit.delete({
      where: { id_image: imageId },
    });
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

  async createCategory(data: any) {
    const slug = data.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    const existing = await this.prisma.categorie.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException(`La catégorie '${data.nom}' existe déjà`);
    }

    const parentId = data.parentId && !isNaN(Number(data.parentId)) ? Number(data.parentId) : null;
    
    const cat = await this.prisma.categorie.create({
      data: {
        nom: data.nom,
        slug,
        id_categorie_parente: parentId,
      },
    });
    
    return {
      id: String(cat.id_categorie),
      nom: cat.nom,
      slug: cat.slug,
      parentId: cat.id_categorie_parente ? String(cat.id_categorie_parente) : null,
    };
  }
}
