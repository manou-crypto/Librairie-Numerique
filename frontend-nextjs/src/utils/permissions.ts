import { AuthUser } from '@/services/auth.service';

/**
 * Constantes des codes de permissions du système
 */
export const PERMISSIONS = {
  // Pages & Onglets Catalogue
  VIEW_CATALOGUE: 'VIEW_CATALOGUE',
  VIEW_CATEGORIES: 'VIEW_CATEGORIES',
  VIEW_MARQUES: 'VIEW_MARQUES',
  VIEW_UNITES: 'VIEW_UNITES',
  VIEW_TARIFICATION: 'VIEW_TARIFICATION',
  VIEW_CONDITIONNEMENTS: 'VIEW_CONDITIONNEMENTS',

  // Actions Produits
  CREATE_PRODUCT: 'CREATE_PRODUCT',
  EDIT_PRODUCT: 'EDIT_PRODUCT',
  ACTION_TARIFIER_PRODUIT: 'ACTION_TARIFIER_PRODUIT',
  ACTION_RECHARGER_STOCK: 'ACTION_RECHARGER_STOCK',
  DELETE_PRODUCT: 'DELETE_PRODUCT',

  // Page & Actions Stock
  VIEW_STOCK: 'VIEW_STOCK',
  ACTION_AJOUTER_STOCK: 'ACTION_AJOUTER_STOCK',
  ACTION_TRANSFERT_ETAGERE: 'ACTION_TRANSFERT_ETAGERE',
  ACTION_RETOUR_RESERVE: 'ACTION_RETOUR_RESERVE',

  // Page & Actions Inventaire
  VIEW_INVENTAIRE: 'VIEW_INVENTAIRE',
  ACTION_INVENTAIRE_GLOBAL: 'ACTION_INVENTAIRE_GLOBAL',
  ACTION_INVENTAIRE_VENTE: 'ACTION_INVENTAIRE_VENTE',
  ACTION_INVENTAIRE_RESERVE: 'ACTION_INVENTAIRE_RESERVE',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | string;

/**
 * Vérifie si l'utilisateur possède une permission spécifique.
 * Le rôle ADMIN ou super_admin a un accès total et inconditionnel à toutes les rubriques et actions.
 */
export function hasPermission(
  user: AuthUser | null | undefined,
  permissionCode: PermissionCode
): boolean {
  if (!user) return false;

  // L'administrateur a toujours un accès complet
  if (user.role === 'ADMIN' || user.roleUi === 'super_admin') {
    return true;
  }

  if (!user.permissions || !Array.isArray(user.permissions)) {
    return false;
  }

  return user.permissions.includes(permissionCode);
}
