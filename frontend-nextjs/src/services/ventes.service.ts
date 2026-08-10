// ventes.service.ts — Client API pour le module Ventes & POS Ticket
// Conforme à l'architecture logicielle Phase 2.2

import { API_BASE_URL, getAuthHeaders } from '@/lib';

export interface LigneVentePayload {
  produitId: string;
  quantite: number;
  prixAchatUnitaireSnapshot: number;
  prixVenteUnitaireHtSnapshot: number;
  tauxTvaSnapshot: number;
  margeUnitaire: number;
  totalLigneHt: number;
}

export interface PaiementPayload {
  modePaiement: 'ESPECES' | 'CARTE_BANCAIRE' | 'MOBILE_MONEY' | 'CHEQUE';
  montant: number;
  referenceTransaction?: string;
}

export interface VentePayload {
  sessionId: string;
  lignes: LigneVentePayload[];
  paiements: PaiementPayload[];
}

export interface VenteResponse {
  id: string;
  referenceTicket: string;
  dateVente: string;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  margeTotale: number;
  statutVente: 'VALIDEE' | 'ANNULEE' | 'REMBOURSEE';
}

export interface VentesFilters {
  sessionId?: string;
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
  page?: number;
  pageSize?: number;
}

export const ventesService = {
  /**
   * Enregistrer une nouvelle vente POS en caisse (Multi-règlements, snapshots, décrémentation stock)
   * POST /api/v1/ventes
   */
  async createVente(payload: VentePayload): Promise<VenteResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/ventes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Échec de la validation de la vente');
    return response.json();
  },

  /**
   * Consulter l'historique des ventes
   * GET /api/v1/ventes
   */
  async getVentes(filters?: VentesFilters): Promise<{ data: VenteResponse[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.sessionId) params.set('sessionId', filters.sessionId);
    if (filters?.dateDebut) params.set('dateDebut', filters.dateDebut);
    if (filters?.dateFin) params.set('dateFin', filters.dateFin);
    if (filters?.statut) params.set('statut', filters.statut);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));

    const response = await fetch(`${API_BASE_URL}/v1/ventes?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Échec du chargement de l'historique des ventes");
    return response.json();
  },

  /**
   * Obtenir une vente par ID ou par référence de ticket
   * GET /api/v1/ventes/:id
   */
  async getVenteById(id: string): Promise<VenteResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/ventes/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Vente #${id} non trouvée`);
    return response.json();
  },

  /**
   * Annuler ou rembourser une vente (Réservé Super Admin)
   * PATCH /api/v1/ventes/:id/annuler
   */
  async annulerVente(id: string, motif?: string): Promise<VenteResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/ventes/${id}/annuler`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ motif }),
    });
    if (!response.ok) throw new Error(`Échec de l'annulation de la vente #${id}`);
    return response.json();
  },
};
