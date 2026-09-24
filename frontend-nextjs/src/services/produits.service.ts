// produits.service.ts — Client API du catalogue produits
// Alignés sur les données Prisma et l'architecture logicielle

import { API_BASE_URL, getAuthHeaders } from '@/lib';

export interface Produit {
  id: string;
  reference: string;
  codeBarre?: string;
  libelle: string;
  description?: string;
  marque?: string;
  marqueId?: string;
  unite?: string;
  poids?: number;
  etat?: 'NEUF' | 'OCCASION' | 'RECONDITIONNE';
  prixAchat: number;
  prixVente: number;
  tauxTva: number;
  stock: number;
  quantiteEnStock?: number;
  quantiteEtal?: number;
  seuilAlerte: number;
  status: 'VISIBLE' | 'MASQUE';
  categoryId: string;
  categoryName: string;
  categoryIds?: string[];
  imageUrl?: string;
  tarifs?: { typeVenteId: string; libelle: string; prix: number }[];
  conditionnements?: ConditionnementItem[];
}

export interface ConditionnementItem {
  id?: string;
  uniteId?: string;
  nom: string;
  quantiteUnitaire: number;
  codeBarre?: string;
  prixVente?: number;
}

export interface TypeVenteItem {
  id: string;
  libelle: string;
}

export interface CategorieItem {
  id: string;
  nom: string;
  slug: string;
  parentId: string | null;
}

export interface MarqueItem {
  id: string;
  nom: string;
}

export interface ProduitsFilters {
  search?: string;
  categoryId?: string;
  status?: string;
  stockFilter?: 'ok' | 'alerte' | 'rupture';
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const produitsService = {
  /**
   * Récupérer toutes les catégories
   * GET /api/v1/categories
   */
  async getCategories(): Promise<CategorieItem[]> {
    const response = await fetch(`${API_BASE_URL}/v1/categories`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des catégories');
    return response.json();
  },

  /**
   * Créer une nouvelle catégorie
   * POST /api/v1/categories
   */
  async createCategory(data: { nom: string; parentId?: string | null }): Promise<CategorieItem> {
    const response = await fetch(`${API_BASE_URL}/v1/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Échec de la création de la catégorie');
    return response.json();
  },

  /**
   * Modifier une catégorie
   * PUT /api/v1/categories/:id
   */
  async updateCategory(id: string, data: { nom: string; parentId?: string | null }): Promise<CategorieItem> {
    const response = await fetch(`${API_BASE_URL}/v1/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Échec de la modification de la catégorie');
    return response.json();
  },

  /**
   * Supprimer une catégorie
   * DELETE /api/v1/categories/:id
   */
  async deleteCategory(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec de la suppression de la catégorie');
  },

  // ================= MARQUES ================= //

  async getMarques(): Promise<MarqueItem[]> {
    const response = await fetch(`${API_BASE_URL}/v1/marques`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des marques');
    return response.json();
  },

  async createMarque(data: { nom: string }): Promise<MarqueItem> {
    const response = await fetch(`${API_BASE_URL}/v1/marques`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Échec de la création de la marque');
    return response.json();
  },

  async updateMarque(id: string, data: { nom: string }): Promise<MarqueItem> {
    const response = await fetch(`${API_BASE_URL}/v1/marques/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Échec de la modification de la marque');
    return response.json();
  },

  async deleteMarque(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/marques/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec de la suppression de la marque');
  },

  // ================= TYPES DE VENTE ================= //
  async getTypesVente(): Promise<TypeVenteItem[]> {
    const response = await fetch(`${API_BASE_URL}/v1/types-vente`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des types de vente');
    return response.json();
  },

  async createTypeVente(data: { libelle: string }): Promise<TypeVenteItem> {
    const response = await fetch(`${API_BASE_URL}/v1/types-vente`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Échec de la création du type de vente');
    return response.json();
  },

  async updateTypeVente(id: string, data: { libelle: string }): Promise<TypeVenteItem> {
    const response = await fetch(`${API_BASE_URL}/v1/types-vente/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Échec de la modification du type de vente');
    return response.json();
  },

  async deleteTypeVente(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/types-vente/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec de la suppression du type de vente');
  },

  // =========================================== //

  /**
   * Liste paginée des produits avec filtres
   * GET /api/v1/produits
   */
  async getAll(filters?: ProduitsFilters): Promise<PaginatedResponse<Produit>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.categoryId) params.set('categoryId', filters.categoryId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.stockFilter) params.set('stockFilter', filters.stockFilter);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));

    const response = await fetch(`${API_BASE_URL}/v1/produits?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des produits');
    return response.json();
  },

  /**
   * Recherche instantanée par code-barres (Scanner POS)
   * GET /api/v1/produits/code-barre/:code
   */
  async getByCodeBarre(code: string): Promise<Produit> {
    const response = await fetch(
      `${API_BASE_URL}/v1/produits/code-barre/${encodeURIComponent(code)}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error(`Produit non trouvé pour le code-barres : ${code}`);
    return response.json();
  },

  /**
   * Obtenir un produit par ID
   * GET /api/v1/produits/:id
   */
  async getById(id: string): Promise<Produit> {
    const response = await fetch(`${API_BASE_URL}/v1/produits/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Produit #${id} non trouvé`);
    return response.json();
  },

  /**
   * Créer un nouveau produit
   * POST /api/v1/produits
   */
  async create(produit: Omit<Produit, 'id'>): Promise<Produit> {
    const response = await fetch(`${API_BASE_URL}/v1/produits`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(produit),
    });
    if (!response.ok) throw new Error('Échec de la création du produit');
    return response.json();
  },

  /**
   * Mettre à jour un produit
   * PUT /api/v1/produits/:id
   */
  async update(id: string, produit: Partial<Produit>): Promise<Produit> {
    const response = await fetch(`${API_BASE_URL}/v1/produits/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(produit),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.message || 'Échec de la mise à jour du produit');
    }
    return response.json();
  },

  /**
   * Masquer un produit (RG-02 — Masquage au lieu de suppression)
   * PATCH /api/v1/produits/:id/masquer
   */
  async masquer(id: string): Promise<Produit> {
    const response = await fetch(`${API_BASE_URL}/v1/produits/${id}/masquer`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Échec du masquage du produit #${id}`);
    return response.json();
  },

  /**
   * Supprimer définitivement un produit
   * DELETE /api/v1/produits/:id
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/produits/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Échec de la suppression du produit #${id}`);
  },

  /**
   * Associer une image Cloudinary à un produit
   */
  async addImage(id: string, url: string, estPrincipale: boolean = false): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/v1/produits/${id}/images`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url, est_principale: estPrincipale }),
    });
    if (!response.ok) throw new Error(`Échec de l'ajout de l'image`);
    return response.json();
  },

  /**
   * Supprimer une image d'un produit
   */
  async removeImage(imageId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/produits/images/${imageId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Échec de la suppression de l'image`);
  },
};
