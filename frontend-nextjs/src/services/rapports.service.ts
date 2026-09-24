import { API_BASE_URL, getAuthHeaders } from '@/lib';

export interface RapportsStats {
  chiffreAffaires: number;
  beneficeNet: number;
  ventesTotales: number;
  margeMoyenne: number;
  caData: { mois: string; ca: number; benefice: number }[];
  categoryData: { name: string; value: number; color: string }[];
  topProducts: { nom: string; categorie: string; ventes: number; ca: number }[];
  ventesJour: { jour: string; ventes: number }[];
}

export interface AchatsStats {
  totalAchatsTtc: number;
  totalPaye: number;
  dettesTotal: number;
  commandesCount: number;
  totalArticlesAchetes: number;
  suppliersData: { nom: string; totalTtc: number; paye: number; commandes: number; resteAPayer: number }[];
  chartData: { date: string; montant: number }[];
  recentAchats: {
    id: number;
    facture: string;
    fournisseur: string;
    acheteur: string;
    date: string;
    totalTtc: number;
    paye: number;
    resteAPayer: number;
    statut: string;
  }[];
}

export interface StocksStats {
  totalReferences: number;
  totalPieces: number;
  valeurStockAchat: number;
  valeurStockVente: number;
  plusValueLatente: number;
  rupturesCount: number;
  alertesCount: number;
  categoriesDistribution: { name: string; valeur: number; quantite: number }[];
  derniersMouvements: {
    id: number;
    produit: string;
    type: string;
    quantite: number;
    date: string;
    operateur: string;
  }[];
}

export const rapportsService = {
  async getStats(
    period: 'semaine' | 'mois' | 'trimestre' | 'annee' = 'semaine'
  ): Promise<RapportsStats> {
    const res = await fetch(`${API_BASE_URL}/v1/rapports/stats?period=${period}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error('Erreur lors du chargement des statistiques des rapports');
    }

    return res.json();
  },

  async getAchatsStats(
    period: 'semaine' | 'mois' | 'trimestre' | 'annee' = 'semaine'
  ): Promise<AchatsStats> {
    const res = await fetch(`${API_BASE_URL}/v1/rapports/achats?period=${period}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error('Erreur lors du chargement des rapports achats');
    }

    return res.json();
  },

  async getStocksStats(): Promise<StocksStats> {
    const res = await fetch(`${API_BASE_URL}/v1/rapports/stocks`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error('Erreur lors du chargement des rapports stocks');
    }

    return res.json();
  },
};
