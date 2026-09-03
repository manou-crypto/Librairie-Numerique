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
  unite?: string;
  poids?: number;
  etat?: 'NEUF' | 'OCCASION' | 'RECONDITIONNE';
  prixAchat: number;
  prixVente: number;
  tauxTva: number;
  stock: number;
  seuilAlerte: number;
  status: 'VISIBLE' | 'MASQUE';
  categoryId: string;
  categoryName: string;
  categoryIds?: string[];
  imageUrl?: string;
}

export interface CategorieItem {
  id: string;
  nom: string;
  slug: string;
  parentId: string | null;
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
    const response = await fetch(`${API_BASE_URL}/v1/produits/code-barre/${encodeURIComponent(code)}`, {
      headers: getAuthHeaders(),
    });
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
    if (!response.ok) throw new Error(`Échec de la mise à jour du produit #${id}`);
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
