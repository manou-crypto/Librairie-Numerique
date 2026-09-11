// utilisateurs.service.ts — Client API pour la gestion des comptes utilisateurs internes et des rôles
// Alignés sur les tables utilisateur, role et log_audit de la BD (Réservé ADMIN)

import { API_BASE_URL, getAuthHeaders } from '@/lib';

export interface UserAccount {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  roleId: number;
  codeRole: 'ADMIN' | 'GESTIONNAIRE_CATALOGUE' | 'ACHETEUR_STOCK' | 'CAISSIER';
  libelleRole: string;
  statut: 'ACTIF' | 'INACTIF';
}

export interface PermissionItem {
  id: number;
  codePermission: string;
  module: string;
  libelle: string;
}

export interface RoleItem {
  id: number;
  codeRole: string;
  libelle: string;
  usersCount?: number;
  permissions?: string[];
}

export interface LogAuditItem {
  id: string;
  utilisateurId?: number;
  utilisateurNom?: string;
  action: string;
  entiteCible: string;
  detailsJson?: string;
  dateAction: string;
}

export const utilisateursService = {
  /**
   * Lister tous les comptes d'utilisateurs internes (Réservé Super Admin)
   * GET /api/v1/users
   */
  async getAll(): Promise<UserAccount[]> {
    const response = await fetch(`${API_BASE_URL}/v1/users`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des utilisateurs');
    return response.json();
  },

  /**
   * Créer un nouveau compte utilisateur interne avec attribution de rôle (RG-06)
   * POST /api/v1/users
   */
  async create(
    user: Omit<UserAccount, 'id' | 'libelleRole'> & { password: string }
  ): Promise<UserAccount> {
    const response = await fetch(`${API_BASE_URL}/v1/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la création du compte utilisateur');
    }
    return response.json();
  },

  /**
   * Modifier son propre profil
   * PUT /api/v1/users/me/profile
   */
  async updateMyProfile(data: { nom: string; prenom: string; email: string; telephone?: string }) {
    const response = await fetch(`${API_BASE_URL}/v1/users/me/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la mise à jour du profil');
    }
    return response.json();
  },

  /**
   * Modifier son propre mot de passe
   * PUT /api/v1/users/me/password
   */
  async updateMyPassword(data: { actuel: string; nouveau: string }) {
    const response = await fetch(`${API_BASE_URL}/v1/users/me/password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la mise à jour du mot de passe');
    }
    return response.json();
  },

  /**
   * Modifier le rôle ou le statut d'un utilisateur
   * PUT /api/v1/users/:id
   */
  async update(id: number, user: Partial<UserAccount>): Promise<UserAccount> {
    const response = await fetch(`${API_BASE_URL}/v1/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Échec de la mise à jour de l'utilisateur #${id}`);
    }
    return response.json();
  },

  /**
   * Obtenir la liste de tous les rôles avec leurs permissions
   * GET /api/v1/users/roles
   */
  async getRoles(): Promise<RoleItem[]> {
    const response = await fetch(`${API_BASE_URL}/v1/users/roles`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des rôles');
    return response.json();
  },

  /**
   * Obtenir toutes les permissions disponibles dans le système
   * GET /api/v1/users/permissions
   */
  async getPermissions(): Promise<PermissionItem[]> {
    const response = await fetch(`${API_BASE_URL}/v1/users/permissions`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des permissions');
    return response.json();
  },

  /**
   * Créer un nouveau rôle
   * POST /api/v1/users/roles
   */
  async createRole(data: {
    codeRole: string;
    libelle: string;
    permissions?: string[];
  }): Promise<RoleItem> {
    const response = await fetch(`${API_BASE_URL}/v1/users/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la création du rôle');
    }
    return response.json();
  },

  /**
   * Mettre à jour un rôle
   * PUT /api/v1/users/roles/:id
   */
  async updateRole(
    id: number,
    data: { libelle?: string; permissions?: string[] }
  ): Promise<RoleItem> {
    const response = await fetch(`${API_BASE_URL}/v1/users/roles/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Échec de la modification du rôle #${id}`);
    }
    return response.json();
  },

  /**
   * Supprimer un rôle
   * DELETE /api/v1/users/roles/:id
   */
  async deleteRole(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/users/roles/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Échec de la suppression du rôle #${id}`);
    }
  },

  /**
   * Consulter les logs d'audit d'imputabilité (Actions sensibles enregistrées)
   * GET /api/v1/audit/logs
   */
  async getAuditLogs(): Promise<LogAuditItem[]> {
    const response = await fetch(`${API_BASE_URL}/v1/audit/logs`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des logs d’audit');
    return response.json();
  },

  /**
   * Supprimer un compte utilisateur (Réservé Super Admin)
   * DELETE /api/v1/users/:id
   */
  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Échec de la suppression de l'utilisateur #${id}`);
    }
  },
};
