// finances.service.ts — Client API pour le suivi financier et les clôtures journalières
// Alignés sur la table cloture_journaliere de la BD et le module Dashboard Admin

import { API_BASE_URL, getAuthHeaders } from '@/lib';

export interface ClotureJournaliereItem {
  id: string;
  dateCloture: string;
  chiffreAffairesHt: number;
  chiffreAffairesTtc: number;
  tvaCollectee: number;
  beneficeBrutTotal: number;
  nombreVentes: number;
  nombreArticlesVendus: number;
  utilisateurValidationId: number;
  dateValidation: string;
}

export interface KpiDataResponse {
  caJour: number;
  caJourObjectif: number;
  caJourTrend: number;
  beneficeBrutJour: number;
  margeMoyennePourcent: number;
  ventesJourCount: number;
  panierMoyen: number;
  caMoisTotal: number;
  caMoisObjectif: number;
  rupturesStockCount: number;
}

export const financesService = {
  /**
   * Obtenir les KPIs financiers en temps réel pour le Dashboard Super Admin
   * GET /api/v1/dashboard/kpi
   */
  async getDashboardKpis(): Promise<KpiDataResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/dashboard/kpi`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des KPIs financiers');
    return response.json();
  },

  /**
   * Effectuer et valider la clôture journalière immutabilisée
   * POST /api/v1/finances/cloture-journaliere
   */
  async effectuerClotureJournaliere(dateCloture: string): Promise<ClotureJournaliereItem> {
    const response = await fetch(`${API_BASE_URL}/v1/finances/cloture-journaliere`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ dateCloture }),
    });
    if (!response.ok) throw new Error('Échec de la validation de la clôture journalière');
    return response.json();
  },

  /**
   * Obtenir l'historique des clôtures journalières
   * GET /api/v1/finances/clotures
   */
  async getHistoriqueClotures(): Promise<ClotureJournaliereItem[]> {
    const response = await fetch(`${API_BASE_URL}/v1/finances/clotures`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement de l’historique des clôtures');
    return response.json();
  },
};
