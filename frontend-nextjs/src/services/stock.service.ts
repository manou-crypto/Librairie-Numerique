// stock.service.ts — Client API pour la gestion du stock et des mouvements
// Alignés sur la table stock et mouvement_stock de la BD

import { API_BASE_URL, getAuthHeaders } from '@/lib';

export interface StockItem {
  id: string;
  produitId: string;
  produitReference: string;
  produitLibelle: string;
  categoryName: string;
  quantiteEnStock: number;
  seuilAlerte: number;
  dateDerniereEntree?: string;
  dateDerniereSortie?: string;
  estEnAlerte: boolean;
  estEnRupture: boolean;
}

export interface MouvementStockPayload {
  produitId: string;
  typeMouvement: 'ENTREE_ACHAT' | 'SORTIE_VENTE' | 'AJUSTEMENT_INVENTAIRE';
  quantite: number;
  achatId?: string;
}

export interface MouvementStockResponse {
  id: string;
  produitId: string;
  utilisateurId: number;
  typeMouvement: string;
  quantite: number;
  dateMouvement: string;
}

export const stockService = {
  /**
   * Consulter l'état des stocks
   * GET /api/v1/stock
   */
  async getStocks(filters?: { search?: string; status?: 'all' | 'ok' | 'alerte' | 'rupture' }): Promise<StockItem[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);

    const response = await fetch(`${API_BASE_URL}/v1/stock?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des stocks');
    return response.json();
  },

  /**
   * Ajuster le stock manuellement
   * POST /api/v1/stock/mouvements
   */
  async ajusterStock(payload: MouvementStockPayload): Promise<MouvementStockResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/stock/mouvements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Échec du mouvement de stock');
    return response.json();
  },

  /**
   * Consulter l'historique des mouvements de stock
   * GET /api/v1/stock/mouvements
   */
  async getMouvements(produitId?: string): Promise<MouvementStockResponse[]> {
    const url = produitId
      ? `${API_BASE_URL}/v1/stock/mouvements?produitId=${produitId}`
      : `${API_BASE_URL}/v1/stock/mouvements`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec de la récupération des mouvements');
    return response.json();
  },
};
