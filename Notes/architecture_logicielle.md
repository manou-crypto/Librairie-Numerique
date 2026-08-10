# DOSSIER D'ARCHITECTURE LOGICIELLE
## Projet : Système Intégré de Gestion d'une Librairie Numérique
### Phase 2.2 — Conception Technique

---

> **Note de lecture** : Ce document constitue le livrable officiel de la phase de conception architecturale. Il est rédigé pour être compris par un jury de soutenance, un développeur rejoignant le projet, ou un chef de projet souhaitant valider les choix techniques. Chaque décision y est expliquée, pas seulement dessinée.

---

## 1. Vue d'Ensemble en 30 secondes

Avant d'entrer dans les détails, voici la photographie complète du système :

```
                        UTILISATEUR
                (Agent interne / Visiteur public)
                             │
                    Navigateur Web / Poste de Caisse
                             │
                        HTTP / HTTPS
                             │
                     ┌───────────────────┐
                     │   Nginx           │
                     │  (Reverse Proxy)  │
                     └────────┬──────────┘
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
    ┌───────────────┐                   ┌────────────────┐
    │  Frontend     │                   │  Backend       │
    │  Next.js      │ ←── REST/JSON ──→ │  NestJS        │
    │  (Interface)  │                   │  (API & Métier)│
    └───────────────┘                   └───────┬────────┘
                                                │
                                        ┌───────────────┐
                                        │  Prisma ORM   │
                                        │  (Mapping BD) │
                                        └───────┬───────┘
                                                │
                                        ┌───────────────┐
                                        │  MySQL 8.0    │
                                        │  (Données)    │
                                        └───────────────┘
                                                │
                                        ┌───────────────┐
                                        │  Stockage     │
                                        │  Médias       │
                                        │ (Images prod) │
                                        └───────────────┘
```

Cette architecture en **3 couches séparées** (Présentation → Traitement → Données) est le fondement sur lequel repose tout le projet.

---

## 2. Rôle et Responsabilités de Chaque Composant

### 2.1 — Nginx : La Porte d'Entrée

Nginx est le **seul point d'entrée** du système depuis Internet. Aucun accès direct au Frontend ou au Backend n'est possible sans passer par lui.

**Il est responsable de :**
- Recevoir toutes les requêtes HTTP/HTTPS entrantes.
- Rediriger les requêtes de pages vers le Frontend Next.js.
- Rediriger les appels d'API (`/api/*`) vers le Backend NestJS.
- Assurer la terminaison SSL/TLS (chiffrement HTTPS).
- Protéger le système des attaques basiques (Rate Limiting, headers de sécurité).

> C'est l'équivalent d'un réceptionniste dans un immeuble : il oriente chaque visiteur vers le bon service, sans jamais laisser entrer quelqu'un dans les parties réservées.

---

### 2.2 — Next.js : Le Visage de l'Application

Next.js est le framework **Frontend** qui gère tout ce que l'utilisateur voit et avec lequel il interagit.

**Il est responsable de :**
- L'affichage de la vitrine publique (catalogue, fiches produits, recherche).
- L'interface de gestion ERP réservée aux agents internes (tableau de bord, gestion produits, achats, stock).
- L'interface Point de Vente (POS) utilisée par le caissier au comptoir.
- La collecte et la validation des formulaires côté client.
- La communication avec le Backend via des appels REST/JSON.
- La protection des pages privées (redirection vers la connexion si non authentifié).

> Next.js n'effectue **aucun calcul métier** et n'accède **jamais directement** à la base de données. Son seul rôle est d'afficher et de transmettre.

---

### 2.3 — NestJS : Le Cerveau de l'Application

NestJS est le framework **Backend** qui concentre toute la logique métier et toute la sécurité du système.

**Il est responsable de :**
- L'authentification des utilisateurs (vérification des identifiants, génération du token JWT).
- Le contrôle des droits d'accès (un caissier ne peut pas créer un utilisateur — RBAC).
- L'exécution de toutes les règles métier (calcul de marges, décrémentation du stock, snapshots de prix lors d'une vente).
- L'exposition d'une API REST documentée à destination du Frontend.
- L'enregistrement des logs d'audit à chaque action sensible.
- La validation des données reçues avant tout traitement.

> NestJS est le garant de la cohérence et de la sécurité des données. Rien n'entre dans la base de données sans passer par ses règles.

---

### 2.4 — Prisma ORM : Le Pont vers la Base de Données

Prisma est la couche de communication entre le Backend NestJS et la base de données MySQL.

**Il est responsable de :**
- Traduire les instructions TypeScript en requêtes SQL optimisées.
- Gérer les relations entre les tables (jointures, cascades).
- Assurer un typage strict des données échangées avec la base.
- Protéger contre les injections SQL.
- Faciliter les migrations de la structure de la base lors des évolutions du projet.

> Grâce à Prisma, les développeurs écrivent du code TypeScript lisible, et Prisma génère automatiquement les requêtes SQL correctes et sécurisées.

---

### 2.5 — MySQL 8.0 : La Mémoire du Système

MySQL est le Système de Gestion de Base de Données Relationnelle (SGBDR) qui stocke l'intégralité des données du projet.

**Il est responsable de :**
- Stocker de manière persistante et structurée toutes les données (produits, ventes, utilisateurs, stocks, etc.).
- Garantir l'intégrité des données via les contraintes (clés étrangères, unicité, etc.).
- Assurer la cohérence transactionnelle (une vente est enregistrée en totalité ou pas du tout).

> **Règle fondamentale :** L'application n'accède jamais directement à MySQL. Toutes les opérations transitent obligatoirement par le Backend NestJS, qui applique les règles métier, puis par Prisma, qui exécute les requêtes.

---

## 3. Cycle de Vie Complet d'une Requête

Pour bien comprendre comment ces composants collaborent, voici le trajet complet d'une action concrète : **un caissier enregistre une vente**.

```
 1. CAISSIER
    Clique sur "Valider la vente" dans l'interface POS
    │
    ▼
 2. NEXT.JS (Frontend)
    Collecte les données du ticket (produits, quantités, modes de paiement)
    Envoie : POST https://librairie.ci/api/v1/ventes
    En-tête : Authorization: Bearer <token_JWT>
    Corps    : { id_session, articles: [...], paiements: [...] }
    │
    ▼
 3. NGINX (Reverse Proxy)
    Reçoit la requête HTTPS
    Détecte le préfixe /api/ → redirige vers NestJS (port 3000)
    │
    ▼
 4. NESTJS — Couche Sécurité (Guards)
    Vérifie la présence et la validité du token JWT
    Vérifie que le rôle "CAISSIER" possède la permission "VENTE_CREER"
    Si invalide → Réponse 401/403 immédiate (accès refusé)
    │
    ▼
 5. NESTJS — Couche Validation
    Vérifie la structure et le format des données reçues (DTO)
    Si données invalides → Réponse 400 (Bad Request)
    │
    ▼
 6. NESTJS — Couche Service (Logique Métier)
    Ouvre une transaction MySQL
    Calcule le total HT, TVA, TTC et la marge totale
    Pour chaque article :
      → Fige les snapshots (prix d'achat, prix de vente, TVA au moment de la vente)
      → Décrémente la quantité en stock
      → Enregistre le mouvement de stock (type : SORTIE_VENTE)
    Enregistre la vente et ses lignes
    Enregistre chaque paiement (mode + montant)
    Met à jour le total encaissé de la session de caisse
    Enregistre un log d'audit
    Valide la transaction (COMMIT)
    │
    ▼
 7. PRISMA ORM
    Traduit toutes ces opérations en requêtes SQL transactionnelles
    Les envoie à MySQL de manière atomique
    │
    ▼
 8. MYSQL
    Enregistre toutes les données de manière permanente
    Retourne les identifiants générés (id_vente, etc.)
    │
    ▼
 9. NESTJS → Réponse 201 Created
    Retourne le ticket de vente complet (données de la vente + paiements)
    │
    ▼
10. NEXT.JS
    Reçoit la réponse
    Affiche la confirmation de vente au caissier
    Lance l'impression du ticket de caisse
```

Ce flux garantit que **chaque vente est atomique** : soit tout est enregistré correctement, soit rien ne l'est (en cas d'erreur de stock ou de validation, la transaction est annulée).

---

## 4. Organisation du Backend NestJS

Le backend est organisé en **modules fonctionnels indépendants**. Chaque module regroupe le contrôleur (routes API), le service (logique métier) et les objets de transfert de données (DTOs) qui lui sont propres.

```
backend-nestjs/
│
├── src/
│   │
│   ├── common/                    ← Outillage transversal
│   │   ├── guards/                ← JwtAuthGuard, RolesGuard
│   │   ├── decorators/            ← @Roles(), @CurrentUser()
│   │   ├── interceptors/          ← AuditLogInterceptor
│   │   └── filters/               ← Filtre d'erreurs global
│   │
│   ├── config/                    ← Variables d'environnement (JWT, DB, Uploads)
│   │
│   ├── prisma/                    ← Service d'accès Prisma (injectable partout)
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   └── modules/                   ← Modules Métier (un dossier = un domaine)
│       │
│       ├── auth/                  ← Connexion, vérification JWT, Bcrypt
│       ├── users/                 ← Création/gestion des comptes internes
│       ├── roles/                 ← Gestion des rôles et permissions (RBAC)
│       ├── catalogue/             ← Produits, Catégories, EAV Attributs, Images
│       ├── suppliers/             ← Gestion des Fournisseurs
│       ├── purchases/             ← Bons d'achat, Réceptions fournisseurs
│       ├── stock/                 ← Niveaux de stock, alertes, mouvements
│       ├── inventory/             ← Inventaires physiques, ajustements
│       ├── sales/                 ← Tickets de vente, Lignes vente, Snapshots
│       ├── payments/              ← Enregistrement multi-modes de paiement
│       ├── cash/                  ← Sessions de caisse, ouverture/clôture
│       ├── finances/              ← Clôture journalière, consolidation
│       ├── dashboard/             ← KPIs et statistiques pour le Super Admin
│       └── audit/                 ← Consultation des logs d'audit
│
├── prisma/
│   └── schema.prisma              ← Définition de tous les modèles de données
│
└── test/
    └── ...                        ← Tests d'intégration et End-to-End
```

**Principe directeur :** Chaque module est autonome. Ajouter une fonctionnalité future (ex: module de fidélisation client) ne nécessite que d'ajouter un nouveau dossier sans toucher aux autres.

---

## 5. Organisation du Frontend Next.js

Le Frontend utilise le **App Router de Next.js 14+**, qui permet une séparation nette entre les espaces publics (accessibles à tous) et les espaces privés (réservés aux agents internes authentifiés).

```
frontend-nextjs/
│
├── src/
│   ├── app/                       ← Structure des pages (App Router)
│   │   │
│   │   ├── (public)/              ← Espace Vitrine (aucune authentification requise)
│   │   │   ├── page.tsx           → Page d'accueil et catalogue public
│   │   │   ├── catalogue/         → Liste des produits avec filtres et recherche
│   │   │   └── produits/[slug]/   → Fiche produit détaillée
│   │   │
│   │   ├── (auth)/                ← Pages d'authentification des agents
│   │   │   └── login/page.tsx     → Formulaire de connexion
│   │   │
│   │   ├── (erp)/                 ← Espace Privé ERP (JWT requis)
│   │   │   ├── dashboard/         → Tableau de bord KPIs (Super Admin)
│   │   │   ├── utilisateurs/      → Gestion des comptes internes (Admin)
│   │   │   ├── catalogue/         → Gestion des produits et catégories
│   │   │   ├── stock/             → Suivi des stocks et alertes
│   │   │   ├── achats/            → Bons d'achat et réceptions fournisseurs
│   │   │   ├── fournisseurs/      → Répertoire des fournisseurs
│   │   │   ├── inventaire/        → Saisie des inventaires physiques
│   │   │   └── finances/          → Clôtures journalières et rapports
│   │   │    
│   │   └── (pos)/                 ← Interface Point de Vente (Caissier)
│   │       └── caisse/page.tsx    → Terminal POS optimisé scanner douchette
│   │
│   ├── components/                ← Composants UI réutilisables
│   │   ├── ui/                    → Éléments de base (boutons, inputs, modals)
│   │   ├── pos/                   → Ticket de vente, modal paiement multi-modes
│   │   └── dashboard/             → Graphiques (Recharts), Cartes KPI
│   │
│   ├── services/                  ← Clients API (un fichier par module NestJS)
│   │   ├── auth.service.ts
│   │   ├── produits.service.ts
│   │   └── ventes.service.ts
│   │
│   ├── hooks/                     ← Custom React Hooks
│   │   ├── useAuth.ts             → Gestion de la session et du token JWT
│   │   └── usePosCart.ts          → Logique du panier de caisse (état local)
│   │
│   └── lib/                       ← Utilitaires (Axios instance, formatage)
```

---

## 6. Communications entre le Frontend et le Backend

**Toutes les communications entre Next.js et NestJS se font exclusivement via des appels HTTP REST au format JSON.**

Il n'y a pas d'accès direct à la base de données depuis le Frontend. Le Frontend ne connaît que l'URL de l'API.

Voici le principe de chaque type d'appel :

| Méthode HTTP | Usage | Exemple dans le projet |
|:---|:---|:---|
| `GET` | Lire / Récupérer des données | `GET /api/v1/produits` → lister les produits du catalogue |
| `POST` | Créer une nouvelle ressource | `POST /api/v1/ventes` → enregistrer un ticket de caisse |
| `PATCH` | Modifier partiellement une ressource | `PATCH /api/v1/produits/:id` → modifier le prix d'un produit |
| `DELETE` | Supprimer / Masquer une ressource | `DELETE /api/v1/produits/:id` → masquer un produit (RG-02) |

**Exemples d'endpoints principaux :**

```
POST   /api/v1/auth/login                → Authentification d'un agent interne
GET    /api/v1/produits                  → Catalogue public (avec filtres)
GET    /api/v1/produits/code-barre/:code → Recherche par scanner douchette (POS)
POST   /api/v1/produits                  → Créer un produit (Gestionnaire)
POST   /api/v1/sessions-caisse/ouvrir   → Ouvrir une session de caisse (Caissier)
POST   /api/v1/ventes                    → Valider un ticket de vente (Caissier)
POST   /api/v1/sessions-caisse/:id/cloturer → Clôturer la session (Caissier)
POST   /api/v1/finances/cloture-journaliere → Clôture journalière (Admin)
GET    /api/v1/dashboard/kpi             → KPIs du tableau de bord (Admin)
```

---

## 7. Authentification et Sécurité (JWT + RBAC)

### 7.1 — Le flux de connexion

```
 Agent Interne (Caissier, Gestionnaire, Admin)
    │
    Saisit son email + mot de passe
    │
    ▼
 NEXT.JS → POST /api/v1/auth/login
    │
    ▼
 NESTJS — Vérifie l'email dans la base de données
    │
    Vérifie le mot de passe avec Bcrypt (comparaison sécurisée)
    │
    Vérifie que le compte est en statut 'ACTIF'
    │
    ▼
 Si identifiants valides :
    Génère un token JWT signé contenant :
    {
      "id_utilisateur": 5,
      "email": "caissier@librairie.ci",
      "role": "CAISSIER"
    }
    │
    ▼
 NEXT.JS reçoit le token
    Le stocke dans un cookie sécurisé (HttpOnly)
    │
    ▼
 Toutes les requêtes suivantes
    incluent automatiquement ce token dans l'en-tête :
    Authorization: Bearer <token_JWT>
```

### 7.2 — Le contrôle des droits (RBAC)

À chaque requête entrante sur le Backend, NestJS effectue deux vérifications :

1. **Authentification** : Le token JWT est-il valide et non expiré ?
2. **Autorisation** : Le rôle de l'utilisateur possède-t-il la permission requise pour cette action ?

Si l'une des deux vérifications échoue, la requête est rejetée immédiatement, avant même d'atteindre la logique métier.

```
Requête reçue par NestJS
    │
    ├── Token absent ou invalide → 401 Unauthorized
    │
    ├── Token valide mais rôle insuffisant → 403 Forbidden
    │
    └── Token valide + rôle autorisé → Exécution de la logique métier ✅
```

---

## 8. Matrice des Rôles et Périmètres d'Accès

Le système implémente un contrôle d'accès basé sur les rôles (RBAC). Chaque rôle a un périmètre fonctionnel strictement délimité.

```
SUPER ADMINISTRATEUR
    │
    ├── Gestion des comptes utilisateurs et des rôles
    ├── Supervision de toutes les caisses et sessions
    ├── Validation et figeage de la clôture journalière
    ├── Consultation du tableau de bord et des KPIs
    ├── Consultation des logs d'audit complets
    └── Accès à tous les modules ci-dessous

GESTIONNAIRE CATALOGUE
    │
    ├── Création / Modification / Masquage de produits
    ├── Gestion des catégories et de l'arborescence
    ├── Gestion des attributs spécifiques (EAV)
    ├── Mise à jour des prix (avec motif obligatoire)
    └── Gestion des images produits

ACHETEUR / GESTIONNAIRE DE STOCK
    │
    ├── Enregistrement des fournisseurs
    ├── Saisie et suivi des bons d'achat
    ├── Réception des marchandises et entrée en stock
    ├── Réalisation des inventaires physiques
    └── Ajustements de stock avec justification

CAISSIER
    │
    ├── Ouverture d'une session de caisse
    ├── Enregistrement des ventes (scan code-barres)
    ├── Gestion des règlements multi-modes
    └── Clôture de session avec explication des écarts
```

**Principe de moindre privilège :** Chaque agent ne dispose que des droits strictement nécessaires à l'exercice de ses fonctions. Un caissier ne peut jamais modifier un prix ou consulter les rapports financiers.

---

## 9. Architecture de Déploiement

L'ensemble du système est conçu pour être déployé sur un serveur Linux via **Docker**, garantissant une mise en production reproductible et une gestion isolée de chaque composant.

```
              INTERNET
                  │
             HTTPS (Port 443)
                  │
          ┌───────────────────┐
          │    Nginx           │  ← Reverse Proxy & Terminaison SSL
          │  (Conteneur)      │     Certificat Let's Encrypt
          └────────┬──────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
┌─────────────┐         ┌───────────────┐
│  Next.js    │         │   NestJS      │
│  (Port 3001)│         │   (Port 3000) │
│  Conteneur  │         │   Conteneur   │
└─────────────┘         └───────┬───────┘
                                │
                        ┌───────────────┐
                        │   MySQL 8.0   │
                        │   (Port 3306) │
                        │   Conteneur   │
                        └───────────────┘
                                │
                        ┌───────────────┐
                        │  Volume       │
                        │  Persistant   │
                        │  (Données BD  │
                        │  + Médias)    │
                        └───────────────┘
```

**Un fichier `docker-compose.yml`** orchestre le démarrage, l'arrêt et la communication de tous ces conteneurs en une seule commande.

---

## 10. Qualités et Justifications de l'Architecture

Ce choix architectural n'est pas arbitraire. Chaque décision répond à une contrainte identifiée dans le cahier des charges.

| Qualité | Explication |
|:---|:---|
| **Modulaire** | Backend découpé en modules indépendants. Ajouter une fonctionnalité n'affecte pas les autres modules. |
| **Séparation des responsabilités** | Le Frontend gère l'affichage, le Backend gère la logique, la base gère les données. Aucun mélange. |
| **Sécurisée** | Authentification JWT, contrôle des rôles RBAC, mots de passe hachés (Bcrypt), aucun accès direct à la base. |
| **Évolutive** | L'architecture est pensée pour intégrer demain un module e-commerce (panier client, paiement en ligne, livraison) sans refonte. RG-07 est respectée nativement. |
| **Maintenable** | Structure standardisée et documentée. Un développeur entrant dans le projet comprend l'organisation en quelques minutes. |
| **Déployable facilement** | Docker permet de déployer l'intégralité du système sur n'importe quel serveur Linux en moins d'une heure. |
| **Performante** | Prisma génère des requêtes SQL optimisées. La table `cloture_journaliere` évite les recalculs sur des millions de lignes pour le tableau de bord. |

---

## 11. Ce que cette Architecture Prépare pour l'Avenir

Le cahier des charges mentionne explicitement (RG-07) que les fonctionnalités e-commerce publiques sont **désactivées en Phase 1** mais que l'architecture doit les prévoir sans refonte.

Voici comment cette architecture y répond concrètement :

- Le module `(public)` de Next.js est déjà structuré pour recevoir un panier client et un tunnel de commande.
- Le Backend NestJS peut accueillir un module `orders/` (commandes clients) sans toucher aux modules existants.
- La table `Produit` expose déjà `statut_visibilite` et `code_barre` pour l'intégration d'un scanner en ligne.
- L'authentification JWT peut être étendue à des comptes clients (avec un rôle `CLIENT`) sans modifier le système RBAC actuel.

L'architecture est donc **prête pour la croissance** dès la Phase 1.

---

*Document produit dans le cadre du Stage de Fin d'Études — Projet Librairie Numérique — Phase 2.2 Architecture Logicielle.*
