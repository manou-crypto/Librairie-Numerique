// ventes.service.ts — Client API pour le module Ventes, Kits & Retours
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
  nomKit?: string;
  idKitGroupe?: string;
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

export interface VenteLigneResponse {
  id: string;
  produitId: string;
  produitLibelle: string;
  quantite: number;
  quantiteRetournee?: number;
  quantiteRestante?: number;
  nomKit?: string;
  idKitGroupe?: string;
  prixVenteUnitaireHt: number;
  tauxTva: number;
  totalLigneHt: number;
}

export interface VentePaiementResponse {
  modePaiement: string;
  montant: number;
}

export interface LigneRetourItem {
  id: string;
  produitId: string;
  produitLibelle: string;
  quantiteRetournee: number;
  prixUnitaireRembourse: number;
  totalLigne: number;
}

export interface RetourVenteItem {
  id: string;
  referenceRetour: string;
  venteId?: string;
  referenceTicketVente: string;
  dateRetour: string;
  typeRetour: 'ARTICLE' | 'VENTE';
  motif: string;
  montantRembourse: number;
  modeRemboursement: string;
  utilisateurNom: string;
  lignesCount?: number;
  lignes?: LigneRetourItem[];
}

export interface LigneModeleKit {
  id: string;
  produitId: string;
  produitLibelle: string;
  produitReference?: string;
  prixUnitaireCatalogue: number;
  stockActuel?: number;
  quantite: number;
}

export interface ModeleKit {
  id: string;
  nomKit: string;
  description?: string;
  prixForfaitaire: number;
  dateCreation: string;
  lignes: LigneModeleKit[];
}

export interface VenteResponse {
  id: string;
  referenceTicket: string;
  dateVente: string;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  margeTotale: number;
  statutVente: 'VALIDEE' | 'ANNULEE' | 'REMBOURSEE' | 'PARTIELLEMENT_REMBOURSEE';
  lignes?: VenteLigneResponse[];
  paiements?: VentePaiementResponse[];
  retours?: RetourVenteItem[];
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
   * Enregistrer une nouvelle vente POS en caisse (avec support des kits)
   * POST /api/v1/ventes
   */
  async createVente(payload: VentePayload): Promise<VenteResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/ventes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la validation de la vente');
    }
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
   * Obtenir une vente par ID avec ses lignes et ses retours
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
   * Annuler une vente (Réservé Super Admin)
   * PATCH /api/v1/ventes/:id/annuler
   */
  async annulerVente(id: string, motif?: string): Promise<VenteResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/ventes/${id}/annuler`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ motif }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Échec de l'annulation de la vente #${id}`);
    }
    return response.json();
  },

  /**
   * Effectuer un retour partiel d'articles
   * POST /api/v1/ventes/:id/retour-articles
   */
  async retourArticles(
    venteId: string,
    payload: {
      lignes: Array<{ ligneVenteId: number; quantite: number }>;
      motif: string;
      modeRemboursement?: string;
    },
  ): Promise<RetourVenteItem> {
    const response = await fetch(`${API_BASE_URL}/v1/ventes/${venteId}/retour-articles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Échec de l'enregistrement du retour d'articles");
    }
    return response.json();
  },

  /**
   * Effectuer un retour complet de la vente
   * POST /api/v1/ventes/:id/retour-vente
   */
  async retourVente(
    venteId: string,
    payload: { motif: string; modeRemboursement?: string },
  ): Promise<RetourVenteItem> {
    const response = await fetch(`${API_BASE_URL}/v1/ventes/${venteId}/retour-vente`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Échec de l'enregistrement du retour de vente");
    }
    return response.json();
  },

  /**
   * Lister tous les retours d'achat / retours sur vente
   * GET /api/v1/ventes/retours
   */
  async getRetours(filters?: { page?: number; pageSize?: number }): Promise<{
    data: RetourVenteItem[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));

    const response = await fetch(`${API_BASE_URL}/v1/ventes/retours?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des retours');
    return response.json();
  },

  /**
   * Obtenir un reçu de retour par ID
   * GET /api/v1/ventes/retours/:id
   */
  async getRetourById(id: string): Promise<RetourVenteItem> {
    const response = await fetch(`${API_BASE_URL}/v1/ventes/retours/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Reçu de retour #${id} introuvable`);
    return response.json();
  },

  /**
   * Obtenir les modèles de kits réutilisables
   * GET /api/v1/ventes/kits
   */
  async getKits(): Promise<ModeleKit[]> {
    const response = await fetch(`${API_BASE_URL}/v1/ventes/kits`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des kits');
    return response.json();
  },

  /**
   * Créer et sauvegarder un modèle de kit réutilisable
   * POST /api/v1/ventes/kits
   */
  async createKit(payload: {
    nomKit: string;
    description?: string;
    prixForfaitaire: number;
    lignes: Array<{ produitId: number; quantite: number }>;
  }): Promise<ModeleKit> {
    const response = await fetch(`${API_BASE_URL}/v1/ventes/kits`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la création du kit');
    }
    return response.json();
  },

  /**
   * Supprimer / désactiver un modèle de kit
   * PATCH /api/v1/ventes/kits/:id/delete
   */
  async deleteKit(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/ventes/kits/${id}/delete`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec de la désactivation du kit');
  },
};

