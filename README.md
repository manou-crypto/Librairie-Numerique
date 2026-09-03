# 📚 Librairie Numérique — Système Intégré de Gestion (ERP & POS)

> **Plateforme web moderne et complète de gestion pour librairie** : Vitrine e-commerce publique, Caisse POS (Point de Vente), Gestion de Stock & Inventaires, Approvisionnement Achats/Fournisseurs et Pilotage Financier avec Sécurité RBAC.

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS%2010-red?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma%206-blue?logo=prisma)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/Database-MySQL%208.0-orange?logo=mysql)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Fonctionnalités Clés

### 🛒 1. Vitrine Publique & E-Commerce
- **Catalogue dynamique** filtrable par catégories et mots-clés.
- **Fiches produits détaillées** avec tarification en **Franc CFA (XOF)**.
- **Gestion des images** hébergées et optimisées dynamiquement via **Cloudinary** (Upload direct, génération d'OG Images pour le partage social).
- **Système EAV (Entity-Attribute-Value)** pour la gestion flexible des attributs spécifiques (Auteur, Éditeur, ISBN, Format, Nb de pages...).

### 💳 2. Terminal Caisse POS (Point de Vente)
- Interface de caisse ultra-rapide optimisée pour le **scanner douchette par code-barres**.
- **Calcul automatique de la TVA par produit** et gestion des snapshots de prix.
- Support des **multi-règlements** (Espèces, Carte Bancaire, Mobile Money, Chèque).
- **Décrémentation instantanée du stock** et impression de tickets de caisse.
- Gestion des **sessions de caisse** (Ouverture, fond de caisse initial, clôture avec détection des écarts).

### 📦 3. Gestion de Stock & Inventaires
- Suivi en temps réel des niveaux de stock et **alertes de rupture sous le seuil minimal**.
- Historique chronologique des mouvements de stock (`ENTREE_ACHAT`, `SORTIE_VENTE`, `AJUSTEMENT_INVENTAIRE`).
- Saisie des **inventaires physiques** avec réconciliation et ajustement automatique des écarts.

### 🚚 4. Approvisionnement & Fournisseurs
- Répertoire complet des fournisseurs.
- Création de **bons d'achat** et suivi du statut des commandes (`EN_ATTENTE`, `RECU`, `ANNULE`).
- **Incrémentation automatique du stock** lors de la validation de réception.

### 📊 5. Finances, Dashboard Admin & Immutabilité
- **Tableau de bord Admin (KPIs)** : Chiffre d'Affaires du jour, Bénéfice brut, Marge %, Panier moyen, Ventes du jour.
- **Clôture journalière immutabilisée** avec validation par l'administrateur.
- **Logs d'audit d'imputabilité** (`log_audit`) retraçant toutes les actions sensibles effectuées dans le système.

### 🔒 6. Sécurité Périmétrique & RBAC
- Authentification basée sur les **jetons JWT stockés dans des cookies sécurisés `SameSite=Strict`**.
- Mots de passe hachés avec **Bcrypt**.
- **Contrôle d'accès basé sur les rôles (RBAC)** avec les rôles par défaut :
  - `ADMIN` (Super Administrateur)
  - `GESTIONNAIRE_CATALOGUE` (Catalogue, Tarifs, Catégories)
  - `ACHETEUR_STOCK` (Stock, Achats, Fournisseurs)
  - `CAISSIER` (Terminal Caisse POS uniquement)

---

## 🏗️ Architecture Technique (N-Tiers)

```
                       UTILISATEURS / CLIENTS
                                 │
                         Navigateur Web
                                 │
                           HTTP / HTTPS
                                 │
                   Nginx (Reverse Proxy :80 / :443)
                                 │
         ┌───────────────────────┴───────────────────────┐
         │                                               │
  Frontend Next.js (:4028)                        Backend NestJS (:3000)
  (App Router, React 19, Tailwind)               (Controllers, Services, Guards)
         │                                               │
         └───────────────────────┬───────────────────────┘
                                 │
                           Prisma ORM (v6.4)
                                 │
                            MySQL 8.0 (:3306)
```

---

## 📁 Arborescence du Projet

```
librairienumerique/
├── frontend-nextjs/                # Application Frontend Next.js 15
│   ├── src/
│   │   ├── app/                    # App Router Next.js
│   │   │   ├── (auth)/login/       # Page de connexion sécurisée
│   │   │   ├── (erp)/              # Espace ERP Interne (14 sous-modules)
│   │   │   ├── (pos)/caisse/       # Terminal Point de Vente (POS)
│   │   │   └── (public)/           # Vitrine catalogue publique
│   │   ├── components/             # UI, Dashboard & POS components
│   │   ├── hooks/                  # useAuth, usePosCart
│   │   ├── services/               # 9 Clients API REST TypeScript
│   │   ├── lib/                    # Utilitaires (formatXOF, cookies, authHeaders)
│   │   └── middleware.ts           # Protection des routes ERP/POS côté serveur
│   ├── next.config.mjs             # Proxy rewrites -> http://localhost:3000
│   └── package.json
│
├── backend-nestjs/                 # Application Backend NestJS 10
│   ├── prisma/
│   │   └── schema.prisma           # Modélisation des 26 tables & enums MySQL
│   ├── src/
│   │   ├── common/                 # Guards (JwtAuthGuard, RolesGuard), Decorators (@Roles, @CurrentUser)
│   │   ├── prisma/                 # PrismaService & PrismaModule
│   │   ├── modules/                # 10 Modules métier (Auth, Users, Catalogue, Stock, Achats,
│   │   │                           # Fournisseurs, Caisses, Ventes, Inventaire, Finances)
│   │   └── main.ts                 # CORS, ValidationPipe & Port 3000
│   ├── .env                        # Chaîne de connexion DATABASE_URL & Secrets JWT
│   └── package.json
│
└── README.md                       # Documentation officielle du projet
```

---

## 🐳 Déploiement & Mise en Conteneur (Docker)

Toute l'application est conteneurisée pour pouvoir être déployée ou testée en local avec une seule commande.

### Fichiers de configuration Docker ajoutés :
1. **Frontend** (`frontend-nextjs/Dockerfile`) : Build multi-stage optimisé pour Next.js (production runtime alpine).
2. **Backend** (`backend-nestjs/Dockerfile`) : Build multi-stage NestJS avec auto-génération de Prisma Client et application des migrations au démarrage.
3. **Nginx** (`nginx/default.conf`) : Sert de reverse-proxy (redirige le trafic web standard vers le frontend et les requêtes `/api/*` vers le backend).
4. **Docker Compose** (`docker-compose.yml`) : Orchestre les 4 services (`mysql`, `backend`, `frontend`, `nginx`) avec volumes persistants pour les données MySQL.

> ⚠️ **Important pour Docker** : Le frontend nécessite l'accès à la variable `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` au moment du build. Assurez-vous que le fichier `.env` est présent et non ignoré par `.dockerignore` lors du `docker-compose build`.

### 🚀 Lancement avec Docker Compose

```bash
# 1. Cloner ou se placer à la racine du projet
cd librairienumerique

# 2. Lancer la build et démarrer l'ensemble des conteneurs en arrière-plan
docker-compose up -d --build
```

**Accès après lancement :**
- **Application complète (via Nginx)** : `http://localhost` (port 80 par défaut)
- **Base de données MySQL** : Accessible sur le port `3306` (identifiants: `root`/`root`)

---

## 🚀 Guide de Démarrage Rapide (Développement Local sans Docker)

### Pré-requis
- **Node.js** v20+ & **npm** v10+
- Serveur **MySQL 8.0** démarré en local ou sur un serveur (Base de données `librairie_db`).

---

### 1️⃣ Étape 1 : Configuration & Migration de la Base de Données

Dans le dossier `backend-nestjs` :

```powershell
cd backend-nestjs

# 1. Vérifier le fichier .env (adapter le mot de passe root de MySQL si besoin)
# DATABASE_URL="mysql://root:root@localhost:3306/librairie_db"
# Renseigner également vos clés Cloudinary : CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

# 2. Exécuter la migration Prisma pour créer les 26 tables dans MySQL
npx prisma migrate dev --name init

# 3. Générer le client Prisma
npx prisma generate
```

---

### 2️⃣ Étape 2 : Lancer le Backend NestJS

```powershell
cd backend-nestjs

# Démarrer le serveur en mode développement
npm run start:dev
```
> ℹ️ *Au premier démarrage, le serveur écoutera sur `http://localhost:3000` et créera automatiquement les rôles RBAC et le compte Super Admin initial :*
> - **Email** : `admin@librairie.ci`
> - **Mot de passe** : `admin123`

---

### 3️⃣ Étape 3 : Lancer le Frontend Next.js

Dans un second terminal :

```powershell
cd frontend-nextjs

# 1. Vérifier le fichier .env (il doit contenir NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)

# 2. Démarrer le serveur Next.js en mode développement
npm run dev
```
> ℹ️ *Le frontend sera accessible sur `http://localhost:4028`.*

---

### 4️⃣ Étape 4 : Connexion & Test

1. Ouvre ton navigateur sur `http://localhost:4028/login`.
2. Saisis `admin@librairie.ci` / `admin123` (ou clique sur le bouton **Super Admin**).
3. Tu seras authentifié par NestJS, le cookie JWT sera déposé, et tu seras automatiquement redirigé vers le Dashboard ERP !

---

## 📡 API Endpoints (Documentation Synthétique)

### 🔑 Authentification (`/api/v1/auth`)
- `POST /api/v1/auth/login` — Connexion, génération JWT & Audit log
- `POST /api/v1/auth/refresh` — Rafraîchissement du token JWT
- `POST /api/v1/auth/logout` — Déconnexion
- `GET /api/v1/auth/me` — Profil de l'utilisateur connecté

### 👥 Utilisateurs (`/api/v1/users`) — *Réservé ADMIN*
- `GET /api/v1/users` — Liste des utilisateurs et leurs rôles
- `POST /api/v1/users` — Création d'un utilisateur (hachage Bcrypt)
- `GET /api/v1/users/roles` — Liste des rôles système

### 📖 Catalogue & Produits (`/api/v1/produits`)
- `GET /api/v1/produits` — Liste paginée avec filtres
- `GET /api/v1/produits/code-barre/:code` — Recherche instantanée pour douchette scanner POS
- `POST /api/v1/produits` — Création d'un produit (Rôle: ADMIN, GESTIONNAIRE)
- `PATCH /api/v1/produits/:id/masquer` — Masquage logique du produit (RG-02)
- `GET /api/v1/categories` — Arborescence des catégories

### 🛒 Ventes POS (`/api/v1/ventes`)
- `POST /api/v1/ventes` — Enregistrement du ticket POS, snapshots prix/TVA, multi-règlements et décrémentation automatique du stock
- `GET /api/v1/ventes` — Historique des ventes
- `PATCH /api/v1/ventes/:id/annuler` — Annulation de vente (Rôle: ADMIN)

### 🏪 Sessions & Caisses (`/api/v1/sessions-caisse`)
- `GET /api/v1/caisses` — Liste des caisses physiques
- `GET /api/v1/sessions-caisse/active` — Session active de l'utilisateur
- `POST /api/v1/sessions-caisse/ouvrir` — Ouverture de session avec fond de caisse initial
- `POST /api/v1/sessions-caisse/:id/cloturer` — Clôture avec saisie du total réel et calcul des écarts

### 📦 Stock (`/api/v1/stock`)
- `GET /api/v1/stock` — Niveaux de stock et alertes de rupture
- `POST /api/v1/stock/mouvements` — Mouvements de stock manuels

### 🚚 Achats (`/api/v1/achats`) & Fournisseurs (`/api/v1/fournisseurs`)
- `GET /api/v1/fournisseurs` — Répertoire des fournisseurs
- `POST /api/v1/achats` — Bons d'achat
- `POST /api/v1/achats/:id/reception` — Validation de réception avec incrémentation automatique du stock

### 📈 Finances & Dashboard (`/api/v1/finances` & `/api/v1/dashboard`)
- `GET /api/v1/dashboard/kpi` — KPIs en temps réel pour le Dashboard Admin
- `POST /api/v1/finances/cloture-journaliere` — Validation de la clôture journalière immutabilisée

---

## 🛠️ Commandes Utiles

### Backend NestJS
```powershell
npm run build        # Compiler le projet en JavaScript (dist/)
npx prisma studio    # Ouvrir l'interface graphique de gestion de la BDD MySQL
```

### Frontend Next.js
```powershell
npm run build        # Générer le bundle de production Next.js
npm run lint         # Exécuter le linter ESLint
```

---

## 🤝 Contribution & Crédits

- **Conception & Architecture** : Équipe d'Architecture Logicielle
- **Dictionnaires de données & Modélisation UML 2.5** : Analystes & Concepteurs
- **Stack** : Next.js, NestJS, Prisma, MySQL, Tailwind CSS
"# Librairie-Numerique" 
