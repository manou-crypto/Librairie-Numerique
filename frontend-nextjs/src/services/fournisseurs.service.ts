// fournisseurs.service.ts — Client API pour le répertoire des fournisseurs
// Alignés sur la table fournisseur de la BD

import { API_BASE_URL, getAuthHeaders } from '@/lib';

export interface Fournisseur {
  id: string;
  nomEntreprise: string;
  contactNom?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  numeroContribuable?: string;
  observations?: string;
}

export const fournisseursService = {
  /**
   * Lister tous les fournisseurs
   * GET /api/v1/fournisseurs
   */
  async getAll(): Promise<Fournisseur[]> {
    const response = await fetch(`${API_BASE_URL}/v1/fournisseurs`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des fournisseurs');
    return response.json();
  },

  /**
   * Obtenir un fournisseur par ID
   * GET /api/v1/fournisseurs/:id
   */
  async getById(id: string): Promise<Fournisseur> {
    const response = await fetch(`${API_BASE_URL}/v1/fournisseurs/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Fournisseur #${id} non trouvé`);
    return response.json();
  },

  /**
   * Créer un nouveau fournisseur
   * POST /api/v1/fournisseurs
   */
  async create(fournisseur: Omit<Fournisseur, 'id'>): Promise<Fournisseur> {
    const response = await fetch(`${API_BASE_URL}/v1/fournisseurs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(fournisseur),
    });
    if (!response.ok) throw new Error('Échec de la création du fournisseur');
    return response.json();
  },

  /**
   * Mettre à jour un fournisseur
   * PUT /api/v1/fournisseurs/:id
   */
  async update(id: string, fournisseur: Partial<Fournisseur>): Promise<Fournisseur> {
    const response = await fetch(`${API_BASE_URL}/v1/fournisseurs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(fournisseur),
    });
    if (!response.ok) throw new Error(`Échec de la mise à jour du fournisseur #${id}`);
    return response.json();
  },

  /**
   * Supprimer un fournisseur
   * DELETE /api/v1/fournisseurs/:id
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/fournisseurs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Échec de la suppression du fournisseur #${id}`);
  },
};
