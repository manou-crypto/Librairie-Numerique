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
  utilisateurValidationId?: number;
  utilisateurValidationNom?: string;
  utilisateurValidationRole?: string;
  dateValidation: string;
  typeCloture?: 'MANUELLE' | 'AUTOMATIQUE';
}

export interface KpiDataResponse {
  period?: 'jour' | 'semaine' | 'mois' | 'annee';
  caPeriode?: number;
  beneficeBrutPeriode?: number;
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
  dettesFournisseurs?: number;
}
export interface DashboardChartsResponse {
  categoriesDistribution: { name: string; value: number }[];
  weeklyTrends: { jour: string; semaine: number; precedente: number }[];
  caTrends: { mois: string; ca: number; benefice: number }[];
}

export interface RecentSaleItem {
  id: string;
  caissier: string;
  caisse: string;
  montant: number;
  time: string;
  items: number;
  mode: string;
}

export interface TopProductItem {
  rank: number;
  id: number;
  name: string;
  category: string;
  vendu: number;
  ca: number;
  marge: number;
  stock: number;
}

export interface DashboardFeedResponse {
  recentSales: RecentSaleItem[];
  topProducts: TopProductItem[];
}

export const financesService = {
  /**
   * Obtenir les graphiques du Dashboard (Répartition et Tendances)
   * GET /api/v1/dashboard/charts
   */
  async getDashboardCharts(
    period: 'jour' | 'semaine' | 'mois' | 'annee' = 'mois',
    days: number = 7,
  ): Promise<DashboardChartsResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/dashboard/charts?period=${period}&days=${days}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des graphiques');
    return response.json();
  },

  /**
   * Obtenir le flux de la journée (Top 5 produits et Dernières ventes)
   * GET /api/v1/dashboard/feed
   */
  async getDashboardFeed(): Promise<DashboardFeedResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/dashboard/feed`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement du flux d’activité');
    return response.json();
  },
  /**
   * Obtenir les KPIs financiers en temps réel pour le Dashboard Super Admin
   * GET /api/v1/dashboard/kpi
   */
  async getDashboardKpis(period: 'jour' | 'semaine' | 'mois' | 'annee' = 'mois'): Promise<KpiDataResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/dashboard/kpi?period=${period}`, {
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
