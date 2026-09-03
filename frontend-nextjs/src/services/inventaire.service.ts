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

export interface LigneInventaireItem {
  id: string;
  produitId: string;
  produitLibelle: string;
  quantiteTheorique: number;
  quantiteReelle: number;
  ecart: number;
  motifAjustement?: string;
}

export interface InventaireItem {
  id: string;
  referenceInventaire: string;
  utilisateurId: number;
  utilisateurNom?: string;
  dateInventaire: string;
  statutInventaire: 'EN_COURS' | 'VALIDE' | 'ANNULE';
  observations?: string;
  lignes?: LigneInventaireItem[];
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
   * Mettre à jour un inventaire en brouillon
   * POST /api/v1/inventaires/:id
   */
  async update(id: string, payload: { observations?: string; lignes: LigneInventairePayload[] }): Promise<InventaireItem> {
    const response = await fetch(`${API_BASE_URL}/v1/inventaires/${id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Échec de la sauvegarde de l'inventaire");
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
   * Obtenir les détails d'un inventaire
   * GET /api/v1/inventaires/:id
   */
  async getById(id: string): Promise<InventaireItem> {
    const response = await fetch(`${API_BASE_URL}/v1/inventaires/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Échec du chargement de l'inventaire");
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
