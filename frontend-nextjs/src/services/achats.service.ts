// achats.service.ts — Client API pour la gestion de l'approvisionnement et des bons d'achat
// Alignés sur les tables achat et ligne_achat de la BD

import { API_BASE_URL, getAuthHeaders } from '@/lib';

export interface LigneAchatPayload {
  produitId: string;
  quantiteCommandee: number;
  prixAchatUnitaireHt: number;
}

export interface AchatPayload {
  fournisseurId: string;
  datePrevueReception?: string;
  lignes: LigneAchatPayload[];
}

export interface LigneAchatItem {
  id: string;
  produitId: string;
  produitLibelle: string;
  quantiteCommandee: number;
  quantiteRecue: number;
  prixAchatUnitaireHt: number;
}

export interface AchatItem {
  id: string;
  numeroFactureFournisseur: string;
  fournisseurId: string;
  fournisseurNom: string;
  utilisateurId: number;
  utilisateurNom?: string;
  dateAchat: string;
  datePrevueReception?: string;
  dateReception?: string;
  montantTotalHt: number;
  montantTotalTtc: number;
  statutAchat: 'EN_ATTENTE' | 'RECU' | 'ANNULE';
  createdAt?: string;
  lignes?: LigneAchatItem[];
}

export interface AchatEnRetardItem {
  id: string;
  numeroFactureFournisseur: string;
  fournisseurId: string;
  fournisseurNom: string;
  dateAchat: string;
  datePrevueReception?: string;
  montantTotalHt: number;
  joursRetard: number;
}

export const achatsService = {
  /**
   * Créer un nouveau bon d'achat fournisseur
   * POST /api/v1/achats
   */
  async create(payload: AchatPayload): Promise<AchatItem> {
    const response = await fetch(`${API_BASE_URL}/v1/achats`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Échec de la création du bon d'achat");
    return response.json();
  },

  async createRetroactif(payload: { fournisseurId: string; dateAchat: string; lignes: LigneAchatPayload[] }): Promise<AchatItem> {
    const response = await fetch(`${API_BASE_URL}/v1/achats/retroactif`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Échec de la création de l'achat rétroactif");
    return data;
  },

  async update(id: string, payload: any): Promise<AchatItem> {
    const response = await fetch(`${API_BASE_URL}/v1/achats/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Échec de la modification de l'achat");
    return data;
  },

  async remove(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/achats/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Échec de la suppression de l'achat");
  },

  /**
   * Lister tous les bons d'achat
   * GET /api/v1/achats
   */
  async getAll(): Promise<AchatItem[]> {
    const response = await fetch(`${API_BASE_URL}/v1/achats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Échec du chargement des bons d'achat");
    return response.json();
  },

  /**
   * Obtenir les détails d'un achat avec ses lignes
   * GET /api/v1/achats/:id
   */
  async getById(id: string): Promise<AchatItem> {
    const response = await fetch(`${API_BASE_URL}/v1/achats/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Échec du chargement du bon d'achat");
    return response.json();
  },

  /**
   * Enregistrer la réception d'une commande avec saisie interactive (qté + prix)
   * Recalcule les totaux monétaires côté backend
   * POST /api/v1/achats/:id/reception
   */
  async validerReception(
    id: string,
    lignesRecues: { produitId: string; quantiteRecue: number; prixAchatUnitaireHt: number }[]
  ): Promise<AchatItem> {
    const response = await fetch(`${API_BASE_URL}/v1/achats/${id}/reception`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ lignesRecues }),
    });
    if (!response.ok) throw new Error('Échec de la validation de la réception');
    return response.json();
  },

  /**
   * Annuler un bon d'achat en attente (« retour d'achat »)
   * PATCH /api/v1/achats/:id/annuler
   */
  async annuler(id: string): Promise<AchatItem> {
    const response = await fetch(`${API_BASE_URL}/v1/achats/${id}/annuler`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Échec de l'annulation du bon d'achat");
    return response.json();
  },

  /**
   * Récupérer les achats en retard de livraison
   * GET /api/v1/achats/en-retard
   */
  async getEnRetard(seuil?: number): Promise<AchatEnRetardItem[]> {
    const params = seuil ? `?seuil=${seuil}` : '';
    const response = await fetch(`${API_BASE_URL}/v1/achats/en-retard${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des achats en retard');
    return response.json();
  },
};
