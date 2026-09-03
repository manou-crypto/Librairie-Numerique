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

export const rapportsService = {
  async getStats(period: 'semaine' | 'mois' | 'trimestre' | 'annee' = 'semaine'): Promise<RapportsStats> {
    const res = await fetch(`${API_BASE_URL}/v1/rapports/stats?period=${period}`, {
      headers: getAuthHeaders(),
    });
    
    if (!res.ok) {
      throw new Error('Erreur lors du chargement des statistiques des rapports');
    }
    
    return res.json();
  }
};
