// auth.service.ts — Client API d'authentification avec gestion JWT par cookies
// Conforme à l'architecture logicielle Phase 2.2

import { API_BASE_URL, getAuthHeaders, setTokenCookie, clearTokenCookie } from '@/lib';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  // Aligné sur les codes de rôle de la base de données MySQL (table role.code_role)
  role: 'ADMIN' | 'GESTIONNAIRE_CATALOGUE' | 'ACHETEUR_STOCK' | 'CAISSIER';
  // Alias UI pour la Sidebar (mappé depuis le code_role BD)
  roleUi: 'super_admin' | 'manager' | 'cashier';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Mappe le code_role de la BD vers l'alias utilisé par la Sidebar UI
 */
function mapRoleToUi(codeRole: string): AuthUser['roleUi'] {
  switch (codeRole) {
    case 'ADMIN':                 return 'super_admin';
    case 'GESTIONNAIRE_CATALOGUE':
    case 'ACHETEUR_STOCK':        return 'manager';
    case 'CAISSIER':              return 'cashier';
    default:                      return 'cashier';
  }
}

export const authService = {
  /**
   * Authentifie l'utilisateur, stocke le JWT dans un cookie sécurisé
   * POST /api/v1/auth/login
   */
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Identifiants incorrects');
    }

    const data: { user: Omit<AuthUser, 'roleUi'>; tokens: AuthTokens } = await response.json();

    // Enrichir l'utilisateur avec l'alias UI du rôle
    const user: AuthUser = {
      ...data.user,
      roleUi: mapRoleToUi(data.user.role),
    };

    // Stocker le token JWT dans un cookie sécurisé (1 jour)
    setTokenCookie(data.tokens.accessToken, 1);

    // Stocker les infos utilisateur dans un cookie non sensible
    if (typeof document !== 'undefined') {
      document.cookie = `auth_user=${encodeURIComponent(JSON.stringify(user))}; path=/; SameSite=Strict`;
    }

    return { user, tokens: data.tokens };
  },

  /**
   * Déconnecte l'utilisateur et invalide le token côté serveur
   * POST /api/v1/auth/logout
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/v1/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {
      // Ignorer les erreurs réseau lors du logout
    } finally {
      this.clearSession();
    }
  },

  /**
   * Rafraîchit le token d'accès
   * POST /api/v1/auth/refresh
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) throw new Error('Impossible de rafraîchir la session');
    const tokens: AuthTokens = await response.json();
    setTokenCookie(tokens.accessToken, 1);
    return tokens;
  },

  /**
   * Retourne les informations de l'utilisateur connecté depuis le cookie
   */
  getUser(): AuthUser | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)auth_user=([^;]+)/);
    if (!match) return null;
    try {
      return JSON.parse(decodeURIComponent(match[1]));
    } catch {
      return null;
    }
  },

  /**
   * Vérifie si un token JWT est présent dans les cookies
   */
  isAuthenticated(): boolean {
    if (typeof document === 'undefined') return false;
    return document.cookie.includes('auth_token=');
  },

  /**
   * Supprime tous les cookies de session
   */
  clearSession(): void {
    clearTokenCookie();
    if (typeof document !== 'undefined') {
      document.cookie = 'auth_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  },
};
