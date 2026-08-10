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

export interface RoleItem {
  id: number;
  codeRole: string;
  libelle: string;
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
  async create(user: Omit<UserAccount, 'id' | 'libelleRole'> & { password: string }): Promise<UserAccount> {
    const response = await fetch(`${API_BASE_URL}/v1/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error("Échec de la création du compte utilisateur");
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
    if (!response.ok) throw new Error(`Échec de la mise à jour de l'utilisateur #${id}`);
    return response.json();
  },

  /**
   * Obtenir la liste de tous les rôles et leurs libellés
   * GET /api/v1/roles
   */
  async getRoles(): Promise<RoleItem[]> {
    const response = await fetch(`${API_BASE_URL}/v1/roles`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Échec du chargement des rôles');
    return response.json();
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
};
