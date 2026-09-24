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
          marque_rel: true,
          tarifs: { include: { type_vente: true } },
          conditionnements: { include: { unite: true } },
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
      marque: p.marque_rel?.nom || undefined,
      marqueId: p.id_marque ? String(p.id_marque) : undefined,
      unite: p.unite,
      poids: p.poids ? Number(p.poids) : undefined,
      etat: p.etat,
      prixAchat: Number(p.prix_achat),
      prixVente: Number(p.prix_vente),
      tauxTva: Number(p.taux_tva),
      stock: (p.stock?.quantite_en_stock || 0) + (p.stock?.quantite_etal || 0),
      quantiteEnStock: p.stock?.quantite_en_stock || 0,
      quantiteEtal: p.stock?.quantite_etal || 0,
      seuilAlerte: p.stock?.seuil_alerte || 5,
      status: p.statut_visibilite,
      categoryId: p.categories[0]?.id_categorie ? String(p.categories[0].id_categorie) : '1',
      categoryName: p.categories[0]?.categorie?.nom || 'Général',
      categoryIds: p.categories.map((c) => String(c.id_categorie)),
      imageUrl: p.images.find((i) => i.est_principale)?.url_image || p.images[0]?.url_image || undefined,
      tarifs: p.tarifs.map((t) => ({
        typeVenteId: String(t.id_type_vente),
        libelle: t.type_vente.libelle,
        prix: Number(t.prix),
      })),
      conditionnements: p.conditionnements.map((c) => ({
        id: String(c.id_conditionnement),
        uniteId: String(c.id_unite),
        nom: c.unite?.nom,
        quantiteUnitaire: c.unite?.multiple || 1,
        codeBarre: c.code_barre,
        prixVente: Number(c.prix_vente),
      })),
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
          { conditionnements: { some: { code_barre: code } } },
        ],
      },
      include: {
        categories: { include: { categorie: true } },
        stock: true,
        images: true,
        marque_rel: true,
        tarifs: { include: { type_vente: true } },
        conditionnements: { include: { unite: true } },
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
      marque: p.marque_rel?.nom || undefined,
      marqueId: p.id_marque ? String(p.id_marque) : undefined,
      unite: p.unite,
      prixAchat: Number(p.prix_achat),
      prixVente: Number(p.prix_vente),
      tauxTva: Number(p.taux_tva),
      stock: (p.stock?.quantite_en_stock || 0) + (p.stock?.quantite_etal || 0),
      quantiteEnStock: p.stock?.quantite_en_stock || 0,
      quantiteEtal: p.stock?.quantite_etal || 0,
      seuilAlerte: p.stock?.seuil_alerte || 5,
      status: p.statut_visibilite,
      categoryId: p.categories[0]?.id_categorie ? String(p.categories[0].id_categorie) : '1',
      categoryName: p.categories[0]?.categorie?.nom || 'Général',
      categoryIds: p.categories.map((c) => String(c.id_categorie)),
      imageUrl: p.images[0]?.url_image || undefined,
      tarifs: p.tarifs.map((t) => ({
        typeVenteId: String(t.id_type_vente),
        libelle: t.type_vente.libelle,
        prix: Number(t.prix),
      })),
      conditionnements: p.conditionnements.map((c) => ({
        id: String(c.id_conditionnement),
        uniteId: String(c.id_unite),
        nom: c.unite?.nom,
        quantiteUnitaire: c.unite?.multiple || 1,
        codeBarre: c.code_barre,
        prixVente: Number(c.prix_vente),
      })),
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
        marque_rel: true,
        tarifs: { include: { type_vente: true } },
        conditionnements: { include: { unite: true } },
      },
    });

    if (!p) throw new NotFoundException(`Produit #${id} introuvable`);

    return {
      id: String(p.id_produit),
      reference: p.reference,
      codeBarre: p.code_barre || undefined,
      libelle: p.libelle,
      description: p.description || undefined,
      marque: p.marque_rel?.nom || undefined,
      marqueId: p.id_marque ? String(p.id_marque) : undefined,
      unite: p.unite,
      prixAchat: Number(p.prix_achat),
      prixVente: Number(p.prix_vente),
      tauxTva: Number(p.taux_tva),
      stock: (p.stock?.quantite_en_stock || 0) + (p.stock?.quantite_etal || 0),
      quantiteEnStock: p.stock?.quantite_en_stock || 0,
      quantiteEtal: p.stock?.quantite_etal || 0,
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
      tarifs: p.tarifs.map((t) => ({
        typeVenteId: String(t.id_type_vente),
        libelle: t.type_vente.libelle,
        prix: Number(t.prix),
      })),
      conditionnements: p.conditionnements.map((c) => ({
        id: String(c.id_conditionnement),
        uniteId: String(c.id_unite),
        nom: c.unite?.nom,
        quantiteUnitaire: c.unite?.multiple || 1,
        codeBarre: c.code_barre,
        prixVente: Number(c.prix_vente),
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
        id_marque: data.marqueId ? Number(data.marqueId) : null,
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

    if (data.tarifs && Array.isArray(data.tarifs)) {
      for (const tarif of data.tarifs) {
        if (tarif.typeVenteId && tarif.prix !== undefined) {
          await this.prisma.tarifArticle.create({
            data: {
              id_produit: produit.id_produit,
              id_type_vente: Number(tarif.typeVenteId),
              prix: Number(tarif.prix),
            },
          });
        }
      }
    }

    if (data.conditionnements && Array.isArray(data.conditionnements)) {
      for (const cond of data.conditionnements) {
        if (cond.uniteId) {
          await this.prisma.conditionnement.create({
            data: {
              id_produit: produit.id_produit,
              id_unite: Number(cond.uniteId),
              code_barre: cond.codeBarre || null,
              prix_vente: Number(cond.prixVente) || 0,
            },
          });
        }
      }
    }

    return this.findOne(produit.id_produit);
  }

  async update(id: number, data: any) {
    await this.findOne(id);

    const updateData: any = {
      ...(data.libelle ? { libelle: data.libelle } : data.name ? { libelle: data.name } : {}),
      ...(data.reference ? { reference: data.reference } : {}),
      ...(data.codeBarre !== undefined ? { code_barre: data.codeBarre } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.marqueId !== undefined ? { id_marque: data.marqueId ? Number(data.marqueId) : null } : {}),
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

    if (data.tarifs !== undefined) {
      // Pour faire simple, on supprime tout et on recrée
      await this.prisma.tarifArticle.deleteMany({ where: { id_produit: id } });
      if (Array.isArray(data.tarifs)) {
        for (const tarif of data.tarifs) {
          if (tarif.typeVenteId && tarif.prix !== undefined) {
            await this.prisma.tarifArticle.create({
              data: {
                id_produit: id,
                id_type_vente: Number(tarif.typeVenteId),
                prix: Number(tarif.prix),
              },
            });
          }
        }
      }
    }

    if (data.conditionnements !== undefined) {
      await this.prisma.conditionnement.deleteMany({ where: { id_produit: id } });
      if (Array.isArray(data.conditionnements)) {
        for (const cond of data.conditionnements) {
          if (cond.uniteId) {
            await this.prisma.conditionnement.create({
              data: {
                id_produit: id,
                id_unite: Number(cond.uniteId),
                code_barre: cond.codeBarre || null,
                prix_vente: Number(cond.prixVente) || 0,
              },
            });
          }
        }
      }
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

  async updateCategory(id: number, data: any) {
    const slug = data.nom ? data.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : undefined;
    
    if (slug) {
      const existing = await this.prisma.categorie.findFirst({ where: { slug, id_categorie: { not: id } } });
      if (existing) throw new ConflictException(`La catégorie '${data.nom}' existe déjà`);
    }

    const cat = await this.prisma.categorie.update({
      where: { id_categorie: id },
      data: {
        ...(data.nom ? { nom: data.nom, slug } : {}),
        ...(data.parentId !== undefined ? { id_categorie_parente: data.parentId ? Number(data.parentId) : null } : {}),
      },
    });
    
    return { id: String(cat.id_categorie), nom: cat.nom, slug: cat.slug, parentId: cat.id_categorie_parente ? String(cat.id_categorie_parente) : null };
  }

  async deleteCategory(id: number) {
    await this.prisma.categorie.delete({ where: { id_categorie: id } });
  }

  // --- Marques ---
  async getMarques() {
    const marques = await this.prisma.marque.findMany({ orderBy: { nom: 'asc' } });
    return marques.map((m) => ({ id: String(m.id_marque), nom: m.nom }));
  }

  async createMarque(data: { nom: string }) {
    const existing = await this.prisma.marque.findUnique({ where: { nom: data.nom } });
    if (existing) throw new ConflictException(`La marque '${data.nom}' existe déjà`);
    
    const m = await this.prisma.marque.create({ data: { nom: data.nom } });
    return { id: String(m.id_marque), nom: m.nom };
  }

  async updateMarque(id: number, data: { nom: string }) {
    if (data.nom) {
      const existing = await this.prisma.marque.findFirst({ where: { nom: data.nom, id_marque: { not: id } } });
      if (existing) throw new ConflictException(`La marque '${data.nom}' existe déjà`);
    }
    
    const m = await this.prisma.marque.update({
      where: { id_marque: id },
      data: { ...(data.nom ? { nom: data.nom } : {}) },
    });
    return { id: String(m.id_marque), nom: m.nom };
  }

  async deleteMarque(id: number) {
    await this.prisma.marque.delete({ where: { id_marque: id } });
  }

  // --- Types de Vente ---
  async getTypesVente() {
    const types = await this.prisma.typeVente.findMany({ orderBy: { libelle: 'asc' } });
    return types.map((t) => ({ id: String(t.id_type_vente), libelle: t.libelle }));
  }

  async createTypeVente(data: { libelle: string }) {
    const existing = await this.prisma.typeVente.findUnique({ where: { libelle: data.libelle } });
    if (existing) throw new ConflictException(`Le type de vente '${data.libelle}' existe déjà`);
    
    const t = await this.prisma.typeVente.create({ data: { libelle: data.libelle } });
    return { id: String(t.id_type_vente), libelle: t.libelle };
  }

  async updateTypeVente(id: number, data: { libelle: string }) {
    if (data.libelle) {
      const existing = await this.prisma.typeVente.findFirst({ where: { libelle: data.libelle, id_type_vente: { not: id } } });
      if (existing) throw new ConflictException(`Le type de vente '${data.libelle}' existe déjà`);
    }
    
    const t = await this.prisma.typeVente.update({
      where: { id_type_vente: id },
      data: { ...(data.libelle ? { libelle: data.libelle } : {}) },
    });
    return { id: String(t.id_type_vente), libelle: t.libelle };
  }

  async deleteTypeVente(id: number) {
    await this.prisma.typeVente.delete({ where: { id_type_vente: id } });
  }
}

