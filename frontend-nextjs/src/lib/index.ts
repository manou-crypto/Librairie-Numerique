// lib/index.ts — Utilitaires partagés (Formatters, API Helpers)
// Source unique de vérité pour les fonctions communes à tous les services.

// ─── Monnaie & Nombres ───────────────────────────────────────────────────────

/**
 * Formate un montant en Franc CFA (XOF) — Côte d'Ivoire
 * @example formatXOF(12500) → "12 500 F CFA"
 */
export function formatXOF(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-CI')} F CFA`;
}

/**
 * Formate un pourcentage
 * @example formatPercent(34.2) → "34.2%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calcule et formate la marge d'un produit
 * @example formatMarge(8.50, 18.99) → "55.2%"
 */
export function formatMarge(prixAchat: number, prixVente: number): string {
  if (prixVente === 0) return '0.0%';
  return formatPercent(((prixVente - prixAchat) / prixVente) * 100);
}

// ─── Dates ───────────────────────────────────────────────────────────────────

/**
 * Formate une date ISO en format français
 * @example formatDate("2026-08-03") → "03/08/2026"
 */
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Formate une date+heure ISO en format français
 * @example formatDateTime("2026-08-03T14:32:00") → "03/08/2026 à 14:32"
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y} à ${h}:${min}`;
}

// ─── Chaînes ─────────────────────────────────────────────────────────────────

/**
 * Retourne les initiales d'un nom complet
 * @example getInitials("Ahmed Koné") → "AK"
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Tronque une chaîne à une longueur maximale
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}

// ─── Tokens & Cookies JWT ────────────────────────────────────────────────────

/**
 * Lit le token JWT depuis les cookies du navigateur
 */
export function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Stocke le token JWT comme cookie de session éphémère
 * (Détruit automatiquement par le navigateur dès sa fermeture)
 */
export function setTokenCookie(token: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; SameSite=Strict`;
}

/**
 * Supprime le cookie du token JWT
 */
export function clearTokenCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

/**
 * URL de base de l'API — source unique de vérité
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Construit les en-têtes HTTP d'autorisation avec le token JWT.
 * Fonction centralisée — à importer depuis lib/index.ts dans tous les services.
 */
export function getAuthHeaders(): HeadersInit {
  const token = getTokenFromCookie();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
