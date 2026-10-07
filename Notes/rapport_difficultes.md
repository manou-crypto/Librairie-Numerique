# 📋 Rapport des Difficultés Techniques — Librairie Numérique ERP/POS

> **Date :** 19 août 2026
> **Projet :** Librairie Numérique — Système ERP + Point de Vente
> **Stack :** NestJS · Next.js 14 · MySQL · Prisma · Docker · Nginx

---

## 🔴 Difficultés Critiques (Bloquantes en production)

### 1. RolesGuard non fonctionnel — RBAC complètement désactivé

**Fichier :** [`roles.guard.ts`](file:///c:/dev/librairienumerique/backend-nestjs/src/modules/auth/guards/roles.guard.ts)

```typescript
// PROBLÈME : Le guard retourne toujours true, ignorant les rôles
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true; // N'importe quel utilisateur authentifié peut tout faire
  }
}
```

**Impact :** Un `CAISSIER` peut appeler les endpoints réservés à l'`ADMIN`
(création d'utilisateurs, clôtures journalières, suppression de produits).
La protection par rôle n'existe que côté UI, pas côté API.

**Correction requise :** Implémenter la logique via le `Reflector` de NestJS.

---

### 2. Secret JWT du Refresh Token codé en dur

**Fichier :** [`auth.service.ts`](file:///c:/dev/librairienumerique/backend-nestjs/src/modules/auth/auth.service.ts) — ligne 115

```typescript
const payload = this.jwtService.verify(refreshToken, {
  secret: process.env.JWT_SECRET || 'librairie_numerique_super_secret_jwt_key_2026_x89f',
  // La variable JWT_REFRESH_SECRET est ignorée ! On utilise JWT_SECRET a la place,
  // et une valeur par defaut hardcodee dans le code source.
});
```

**Double impact :**
- Le refreshToken est signé avec `JWT_REFRESH_SECRET` mais vérifié avec `JWT_SECRET` → les refreshes **échoueront** si les deux secrets diffèrent.
- La valeur de fallback exposée dans le code source est un risque de sécurité grave.

---

### 3. TVA des achats codée en dur à 20 %

**Fichier :** [`achats.service.ts`](file:///c:/dev/librairienumerique/backend-nestjs/src/modules/achats/achats.service.ts) — ligne 32

```typescript
const totalTtc = totalHt * 1.20; // TVA toujours 20%, jamais lue depuis la Configuration
```

**Impact :** Le module Configuration permet de paramétrer le taux de TVA, mais le module Achats l'ignore complètement. Incompatibilité fonctionnelle majeure.

---

### 4. Cookie `auth_user` sans flag `HttpOnly` — Vulnérabilité XSS

**Fichier :** [`auth.service.ts` frontend](file:///c:/dev/librairienumerique/frontend-nextjs/src/services/auth.service.ts) — ligne 69

```typescript
document.cookie = `auth_user=${encodeURIComponent(JSON.stringify(user))}; path=/; SameSite=Strict`;
// Accessible via JavaScript -> vulnerable au vol de donnees par XSS
```

**Impact :** Un script malveillant peut lire l'email et le rôle de l'utilisateur.

---

## 🟠 Difficultés Importantes (Dégradent la qualité ou la fiabilité)

### 5. Absence totale de tests automatisés

- Aucun test unitaire sur les services critiques (VentesService, CaissesService, FinancesService).
- Aucun test d'intégration sur les endpoints API.
- Seul `app.controller.spec.ts` (généré par NestJS) est présent.
- **Risque :** Une régression sur le calcul des marges ou des écarts de caisse est indétectable automatiquement.

---

### 6. Annulation de vente : type de mouvement de stock incorrect

**Fichier :** [`ventes.service.ts`](file:///c:/dev/librairienumerique/backend-nestjs/src/modules/ventes/ventes.service.ts) — ligne 315

```typescript
type_mouvement: 'AJUSTEMENT_INVENTAIRE', // Devrait être 'RETOUR_VENTE'
```

**Impact :** Une annulation de vente est enregistrée comme un ajustement d'inventaire, faussant les rapports de stock.

---

### 7. KPI Dashboard avec valeurs hardcodées (objectifs fictifs)

**Fichier :** [`finances.service.ts`](file:///c:/dev/librairienumerique/backend-nestjs/src/modules/finances/finances.service.ts) — lignes 41–47

```typescript
return {
  caJourObjectif: 500000,  // Hardcode, non paramétrable
  caJourTrend: 12.4,        // Toujours +12.4%, jamais calcule
  caMoisObjectif: 10000000, // Hardcode
};
```

**Impact :** Les tendances et objectifs du Dashboard sont **fictifs**, quelle que soit la réalité de la librairie.

---

### 8. Route `/catalogue` publique mais API sous-jacente est privée

**Fichier :** [`middleware.ts`](file:///c:/dev/librairienumerique/frontend-nextjs/src/middleware.ts) — ligne 14

```typescript
const PUBLIC_PATHS = ['/', '/login', '/catalogue'];
// /catalogue est public côté routing, mais l'API retourne 401 sans token
```

**Impact :** Un visiteur non connecté accède à `/catalogue` qui s'affiche vide sans message d'erreur explicatif.

---

### 9. Pas de pagination côté frontend sur les listes

Le backend implémente `page` et `pageSize` sur Catalogue et Ventes, mais la plupart des pages frontend chargent toutes les données en une seule requête.

**Risque :** Dégradation des performances avec un catalogue de plusieurs centaines de livres.

---

### 10. CORS WebSocket trop permissif en production

**Fichier :** [`app.gateway.ts`](file:///c:/dev/librairienumerique/backend-nestjs/src/modules/events/app.gateway.ts) — ligne 27

```typescript
cors: {
  origin: '*', // Accepte les connexions WebSocket depuis n'importe quel domaine
  credentials: true,
},
```

**Impact :** Expose le serveur WebSocket à des connexions extérieures non autorisées.

---

### 11. Pas de reconnexion automatique WebSocket

Le frontend se connecte au WebSocket au démarrage mais sans mécanisme de reconnexion automatique ni nettoyage des listeners.

**Risque :** Après une coupure réseau, les mises à jour temps réel (stock, ventes) s'arrêtent silencieusement.

---

## 🟡 Difficultés Mineures (Améliorations souhaitables)

### 12. Gestion des images produits non implémentée

La table `ImageProduit` existe dans Prisma, mais aucun endpoint d'upload n'est défini et aucun service de stockage de fichiers n'est configuré. Les images sont toujours vides dans l'UI.

---

### 13. Refresh token non stocké côté frontend

**Fichier :** [`auth.service.ts` frontend](file:///c:/dev/librairienumerique/frontend-nextjs/src/services/auth.service.ts) — ligne 65

```typescript
setTokenCookie(data.tokens.accessToken, 1); // Seul l'access token est stocké
// data.tokens.refreshToken est ignoré
```

**Impact :** Après 1 jour, l'utilisateur est déconnecté de force au lieu d'un renouvellement silencieux.

---

### 14. Seed de données insuffisant pour les tests

L'`onModuleInit` crée 4 rôles et 1 compte admin, mais aucun produit de démo ni catégorie. Le fichier `seed_categories.sql` à la racine suggère une insertion manuelle en SQL. L'application est entièrement vide après installation.

---

### 15. DTO manquants sur plusieurs endpoints (pas de validation)

```typescript
// ventes.controller.ts
@Post()
create(@Request() req, @Body() payload: any) { // "any" = 0 validation
```

**Impact :** Des données malformées (montants négatifs, IDs inexistants) peuvent atteindre la base de données.

---

### 16. Devise de configuration non appliquée sur le POS

Le module Configuration permet de changer la devise (FCFA, DZD, EUR…), mais l'interface POS et les tickets affichent probablement une devise codée en dur.

---

## 📊 Tableau de synthèse

| # | Catégorie | Difficulté | Sévérité | Effort |
|---|-----------|------------|----------|--------|
| 1 | Sécurité | RolesGuard désactivé | 🔴 Critique | 2–3h |
| 2 | Sécurité | Secret JWT hardcodé + mauvaise variable | 🔴 Critique | 30min |
| 3 | Fonctionnel | TVA achats hardcodée à 20% | 🔴 Critique | 1h |
| 4 | Sécurité | Cookie user sans HttpOnly | 🔴 Critique | 30min |
| 5 | Qualité | Absence de tests automatisés | 🟠 Important | Élevé |
| 6 | Données | Mauvais type_mouvement à l'annulation | 🟠 Important | 30min |
| 7 | Fonctionnel | KPI Dashboard avec données fictives | 🟠 Important | 2h |
| 8 | UX | Route `/catalogue` publique / API privée | 🟠 Important | 30min |
| 9 | Performance | Pas de pagination frontend | 🟠 Important | 2–4h |
| 10 | Sécurité | CORS WebSocket `*` en production | 🟠 Important | 15min |
| 11 | Fiabilité | Pas de reconnexion WebSocket | 🟠 Important | 2h |
| 12 | Fonctionnel | Upload images non implémenté | 🟡 Mineur | Élevé |
| 13 | UX | Refresh token ignoré côté frontend | 🟡 Mineur | 1–2h |
| 14 | Dev | Seed données insuffisant | 🟡 Mineur | 1h |
| 15 | Qualité | DTO `any` sans validation | 🟡 Mineur | 2–3h |
| 16 | Cohérence | Devise non appliquée sur POS | 🟡 Mineur | 2h |

---

## 🛣️ Recommandations par priorité

### ① Avant tout déploiement en production
1. Implémenter le `RolesGuard` avec `Reflector` de NestJS
2. Corriger la variable `JWT_REFRESH_SECRET` dans `auth.service.ts`
3. Ajouter `HttpOnly` sur le cookie `auth_user`
4. Restreindre le CORS WebSocket au domaine de production

### ② Court terme (sprint suivant)
5. Lire la TVA depuis la Configuration dans les achats
6. Corriger le `type_mouvement` lors des annulations de ventes
7. Rendre les objectifs/tendances KPI paramétrables
8. Clarifier la route `/catalogue` (publique ou protégée)
9. Stocker et utiliser le refresh token côté frontend

### ③ Moyen terme (avant mise en production client)
10. Ajouter des tests unitaires sur les services critiques
11. Ajouter la reconnexion WebSocket automatique
12. Remplacer les `any` par des DTO avec validation
13. Implémenter la gestion des images produits
14. Enrichir le seed avec des données de démonstration

---

*Rapport généré par analyse statique du code source — août 2026*
