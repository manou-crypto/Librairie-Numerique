// caisses.service.ts — Client API pour les caisses et les sessions de caisse
// Alignés sur les tables caisse et session_caisse de la BD

import { API_BASE_URL, getAuthHeaders } from '@/lib';

export interface CaisseItem {
  id: string;
  codeCaisse: string;
  emplacement?: string;
  statutCaisse: 'OUVERTE' | 'FERMEE';
  caissier?: string;
  utilisateurId?: string;
  totalVentes?: number;
  nbTransactions?: number;
  heureOuverture?: string;
  sessionId?: string;
}

export interface SessionCaisseItem {
  id: string;
  caisseId: string;
  codeCaisse: string;
  utilisateurId: number;
  utilisateurNom: string;
  dateOuverture: string;
  dateCloture?: string;
  fondDeCaisseInitial: number;
  totalEncaisseCalcule: number;
  totalEncaisseReel: number;
  ecartCaisse: number;
  motifEcart?: string;
  statutSession: 'OUVERTE' | 'CLOTUREE';
}

export interface UserItem {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  codeRole: string;
  libelleRole: string;
  statut: string;
}

export const caissesService = {
  /**
   * Lister toutes les caisses
   * GET /api/v1/caisses
   */
  async getCaisses(): Promise<CaisseItem[]> {
    const response = await fetch(`${API_BASE_URL}/v1/caisses`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des caisses');
    return response.json();
  },

  /**
   * Créer une nouvelle caisse
   * POST /api/v1/caisses
   */
  async createCaisse(data: {
    codeCaisse: string;
    emplacement?: string;
    utilisateurId: number;
  }): Promise<CaisseItem> {
    const response = await fetch(`${API_BASE_URL}/v1/caisses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la création de la caisse');
    }
    return response.json();
  },

  /**
   * Supprimer une caisse
   * DELETE /api/v1/caisses/:id
   */
  async deleteCaisse(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/v1/caisses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la suppression de la caisse');
    }
    return response.json();
  },

  /**
   * Modifier une caisse (nom, emplacement, utilisateur assigné)
   * PATCH /api/v1/caisses/:id
   */
  async updateCaisse(
    id: string,
    data: { codeCaisse?: string; emplacement?: string; utilisateurId?: number | null }
  ): Promise<CaisseItem> {
    const response = await fetch(`${API_BASE_URL}/v1/caisses/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la modification de la caisse');
    }
    return response.json();
  },

  /**
   * Lister tous les utilisateurs (pour l'assignation caissier)
   * GET /api/v1/users
   */
  async getUtilisateurs(): Promise<UserItem[]> {
    const response = await fetch(`${API_BASE_URL}/v1/users`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des utilisateurs');
    return response.json();
  },

  /**
   * Ouvrir une session de caisse avec un fond de caisse initial
   * POST /api/v1/sessions-caisse/ouvrir
   */
  async ouvrirSession(caisseId: string, fondDeCaisseInitial: number): Promise<SessionCaisseItem> {
    const response = await fetch(`${API_BASE_URL}/v1/sessions-caisse/ouvrir`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ caisseId, fondDeCaisseInitial }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Échec de l'ouverture de la session de caisse");
    }
    return response.json();
  },

  /**
   * Clôturer la session de caisse (le montant réel est maintenant égal au calculé automatiquement)
   * POST /api/v1/sessions-caisse/:id/cloturer
   */
  async cloturerSession(
    sessionId: string
  ): Promise<SessionCaisseItem> {
    const response = await fetch(`${API_BASE_URL}/v1/sessions-caisse/${sessionId}/cloturer`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la clôture de la session de caisse');
    }
    return response.json();
  },

  /**
   * Obtenir le rapport détaillé d'une session de caisse
   * GET /api/v1/sessions-caisse/:id/rapport
   */
  async getRapportSession(sessionId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/v1/sessions-caisse/${sessionId}/rapport`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la récupération du rapport de caisse');
    }
    return response.json();
  },

  /**
   * Obtenir la session courante de l'utilisateur connecté
   * GET /api/v1/sessions-caisse/active
   */
  async getActiveSession(): Promise<SessionCaisseItem | null> {
    const response = await fetch(`${API_BASE_URL}/v1/sessions-caisse/active`, {
      headers: getAuthHeaders(),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Échec de la vérification de la session active');
    const text = await response.text();
    if (!text || text === 'null') return null;
    return JSON.parse(text);
  },

  /**
   * Obtenir la caisse assignée à l'utilisateur connecté
   * GET /api/v1/caisses/ma-caisse
   */
  async getMyCaisse(): Promise<CaisseItem | null> {
    const response = await fetch(`${API_BASE_URL}/v1/caisses/ma-caisse`, {
      headers: getAuthHeaders(),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Échec de la récupération de la caisse assignée');
    const text = await response.text();
    if (!text || text === 'null') return null;
    return JSON.parse(text);
  },
};
