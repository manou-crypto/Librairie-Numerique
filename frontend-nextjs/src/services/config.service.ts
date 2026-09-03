import { getTokenFromCookie, API_BASE_URL, getAuthHeaders } from '@/lib';

export interface AppConfiguration {
  nom_librairie: string;
  logo_url: string | null;
  devise: string;
  tva: number;
}

export const configService = {
  async getConfiguration(): Promise<AppConfiguration> {
    const res = await fetch(`${API_BASE_URL}/v1/configuration`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // always fresh on load
    });

    if (!res.ok) {
      throw new Error('Erreur lors de la récupération de la configuration');
    }

    return res.json();
  },

  async updateConfiguration(data: Partial<AppConfiguration>): Promise<AppConfiguration> {
    const token = getTokenFromCookie();
    
    const res = await fetch(`${API_BASE_URL}/v1/configuration`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Erreur lors de la mise à jour de la configuration');
    }

    return res.json();
  },
};
