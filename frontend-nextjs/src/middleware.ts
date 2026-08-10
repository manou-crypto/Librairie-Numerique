// middleware.ts — Protection des routes privées (ERP + POS)
// Toutes les routes sous /dashboard, /produits, /stock, /achats,
// /caisses, /ventes, /finances, /fournisseurs, /inventaire,
// /utilisateurs, /rapports, /parametres, /profil, /notifications
// et /caisse nécessitent un token JWT valide.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes accessibles sans authentification
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/catalogue',
];

// Préfixes des routes publiques (vitrine)
const PUBLIC_PREFIXES = [
  '/produits/', // fiche produit publique /produits/[slug]
  '/_next/',
  '/favicon',
  '/api/auth/', // les endpoints de login eux-mêmes sont publics
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Laisser passer les routes publiques
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Vérifier la présence du token JWT dans les cookies
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Rediriger vers la page de connexion en conservant l'URL de destination
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token présent — laisser passer la requête
  // La vérification de signature JWT sera faite par NestJS lors des appels API
  return NextResponse.next();
}

// Appliquer le middleware sur toutes les routes sauf les assets statiques
export const config = {
  matcher: [
    /*
     * Appliquer sur toutes les routes SAUF :
     * - _next/static (fichiers statiques Next.js)
     * - _next/image (optimisation d'images)
     * - favicon.ico
     * - fichiers publics (.png, .jpg, .svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
