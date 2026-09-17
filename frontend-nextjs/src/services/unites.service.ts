import { API_BASE_URL, getAuthHeaders } from '@/lib';

export interface UniteItem {
  id_unite: number;
  nom: string;
  description?: string;
  multiple: number;
  id_unite_base?: number | null;
}

export const unitesService = {
  getUnites: async (): Promise<UniteItem[]> => {
    const response = await fetch(`${API_BASE_URL}/v1/unites`, { headers: getAuthHeaders() });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Erreur de chargement');
    }
    return response.json();
  },

  createUnite: async (data: Partial<UniteItem>): Promise<UniteItem> => {
    const response = await fetch(`${API_BASE_URL}/v1/unites`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erreur de création');
    return response.json();
  },

  updateUnite: async (id: number, data: Partial<UniteItem>): Promise<UniteItem> => {
    const response = await fetch(`${API_BASE_URL}/v1/unites/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erreur de mise à jour');
    return response.json();
  },

  deleteUnite: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/v1/unites/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erreur de suppression');
  },
};
