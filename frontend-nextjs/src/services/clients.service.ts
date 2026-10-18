// clients.service.ts — Service API pour la gestion des clients
import { API_BASE_URL, getAuthHeaders } from '@/lib';

export interface Client {
  id: number;
  codeClient: string;
  nom: string;
  prenom?: string;
  nomComplet: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  typeClient: 'PARTICULIER' | 'ENTREPRISE' | 'ECOLE' | 'REVENDEUR' | string;
  notes?: string;
  dateCreation: string;
  nombreVentes?: number;
  totalAchats?: number;
  derniereVisite?: string | null;
  ventes?: Array<{
    id: number;
    referenceTicket: string;
    numeroFacture?: string;
    dateVente: string;
    totalTtc: number;
    totalRemise: number;
    statutVente: string;
    nbArticles: number;
    paiements: Array<{
      modePaiement: string;
      montant: number;
      datePaiement: string;
    }>;
  }>;
}

export const clientsService = {
  /**
   * Lister tous les clients avec filtre optionnel
   * GET /api/v1/clients
   */
  async getAll(params?: { search?: string; typeClient?: string }): Promise<Client[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.typeClient) query.append('typeClient', params.typeClient);

    const url = `${API_BASE_URL}/v1/clients${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Échec du chargement des clients');
    }
    return response.json();
  },

  /**
   * Obtenir un client par son ID avec historique des ventes
   * GET /api/v1/clients/:id
   */
  async getById(id: string | number): Promise<Client> {
    const response = await fetch(`${API_BASE_URL}/v1/clients/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Client #${id} introuvable`);
    }
    return response.json();
  },

  /**
   * Créer un nouveau client
   * POST /api/v1/clients
   */
  async create(data: {
    nom: string;
    prenom?: string;
    telephone?: string;
    email?: string;
    adresse?: string;
    typeClient?: string;
    notes?: string;
  }): Promise<Client> {
    const response = await fetch(`${API_BASE_URL}/v1/clients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la création du client');
    }
    return response.json();
  },

  /**
   * Mettre à jour un client
   * PUT /api/v1/clients/:id
   */
  async update(
    id: string | number,
    data: Partial<{
      nom: string;
      prenom?: string;
      telephone?: string;
      email?: string;
      adresse?: string;
      typeClient?: string;
      notes?: string;
    }>
  ): Promise<Client> {
    const response = await fetch(`${API_BASE_URL}/v1/clients/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la mise à jour du client');
    }
    return response.json();
  },

  /**
   * Supprimer un client
   * DELETE /api/v1/clients/:id
   */
  async delete(id: string | number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/v1/clients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la suppression du client');
    }
    return response.json();
  },
};
