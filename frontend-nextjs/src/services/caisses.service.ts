// caisses.service.ts — Client API pour les caisses et les sessions de caisse
// Alignés sur les tables caisse et session_caisse de la BD

import { API_BASE_URL, getAuthHeaders } from '@/lib';

export interface CaisseItem {
  id: string;
  codeCaisse: string;
  emplacement?: string;
  statutCaisse: 'OUVERTE' | 'FERMEE';
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
   * Ouvrir une session de caisse avec un fond de caisse initial
   * POST /api/v1/sessions-caisse/ouvrir
   */
  async ouvrirSession(caisseId: string, fondDeCaisseInitial: number): Promise<SessionCaisseItem> {
    const response = await fetch(`${API_BASE_URL}/v1/sessions-caisse/ouvrir`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ caisseId, fondDeCaisseInitial }),
    });
    if (!response.ok) throw new Error("Échec de l'ouverture de la session de caisse");
    return response.json();
  },

  /**
   * Clôturer la session de caisse avec saisie du montant réel et détection d'écart
   * POST /api/v1/sessions-caisse/:id/cloturer
   */
  async cloturerSession(sessionId: string, totalEncaisseReel: number, motifEcart?: string): Promise<SessionCaisseItem> {
    const response = await fetch(`${API_BASE_URL}/v1/sessions-caisse/${sessionId}/cloturer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ totalEncaisseReel, motifEcart }),
    });
    if (!response.ok) throw new Error('Échec de la clôture de la session de caisse');
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
    return response.json();
  },
};
