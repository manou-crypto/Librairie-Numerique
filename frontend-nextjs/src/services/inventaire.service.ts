// inventaire.service.ts — Client API pour les inventaires physiques et ajustements de stock
// Alignés sur les tables inventaire et ligne_inventaire de la BD

import { API_BASE_URL, getAuthHeaders } from '@/lib';

export interface LigneInventairePayload {
  produitId: string;
  quantiteTheorique: number;
  quantiteReelle: number;
  motifAjustement?: string;
}

export interface InventairePayload {
  referenceInventaire: string;
  observations?: string;
  lignes: LigneInventairePayload[];
}

export interface InventaireItem {
  id: string;
  referenceInventaire: string;
  utilisateurId: number;
  dateInventaire: string;
  statutInventaire: 'EN_COURS' | 'VALIDE' | 'ANNULE';
  observations?: string;
}

export const inventaireService = {
  /**
   * Démarrer ou enregistrer un inventaire physique
   * POST /api/v1/inventaires
   */
  async create(payload: InventairePayload): Promise<InventaireItem> {
    const response = await fetch(`${API_BASE_URL}/v1/inventaires`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Échec de la création de l'inventaire");
    return response.json();
  },

  /**
   * Lister tous les inventaires
   * GET /api/v1/inventaires
   */
  async getAll(): Promise<InventaireItem[]> {
    const response = await fetch(`${API_BASE_URL}/v1/inventaires`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des inventaires');
    return response.json();
  },

  /**
   * Valider un inventaire et appliquer les ajustements de stock automatiquement
   * POST /api/v1/inventaires/:id/valider
   */
  async valider(id: string): Promise<InventaireItem> {
    const response = await fetch(`${API_BASE_URL}/v1/inventaires/${id}/valider`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Échec de la validation de l'inventaire");
    return response.json();
  },
};
