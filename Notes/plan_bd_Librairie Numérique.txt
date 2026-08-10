plan_bd_Librairie Numérique



 PARTIE 1 : Définition des Processus Métier et Déduction des Entités

## Processus 1 : Approvisionnement & Achats Fournisseurs

1. Scénario Métier :
    • Le responsable des achats sélectionne un FOURNISSEUR et crée une commande / facture d'achat (ACHAT).
    • Il saisit les différentes lignes d'articles (LIGNE_ACHAT) reçus avec leurs quantités et prix d'achat unit
    • À la validation de la réception, le système génère les MOUVEMENT_STOCK (Type: ENTREE_ACHAT), met à jour l
    quantite_en_stock et actualise date_derniere_entree dans STOCK.
2. Entités déduites : FOURNISSEUR, ACHAT, LIGNE_ACHAT, MOUVEMENT_STOCK, STOCK.

## Processus 2 : Vente & Encaissement en Caisse (Multi-Règlements)

1. Scénario Métier :
    • Le caissier prend son service : ouverture de SESSION_CAISSE sur une CAISSE donnée avec saisie du fond de 
    • Scan des produits par code_barre → Création de la VENTE (statut = VALIDEE) et de ses LIGNE_VENTE (avec sn
    d'achat/vente et calcul instantané de marge).
    • Encaissement : Le client peut régler en plusieurs fois ou combiner les modes (ex: Espèces + Mobile Money)
    dans la table PAIEMENT.
    • Décrémentation automatique du STOCK, mise à jour de date_derniere_sortie et création du MOUVEMENT_STOCK (
    • En cas d'erreur ou retour client, la vente passe à statut = ANNULEE ou REMBOURSEE avec mouvements de stoc
    • En fin de service : Clôture de la session avec saisie du montant physique réel et motif_ecart si une diff
2. Entités déduites : CAISSE, SESSION_CAISSE, VENTE, LIGNE_VENTE, PAIEMENT, MOUVEMENT_STOCK, STOCK.

## Processus 3 : Contrôle du Stock & Inventaire Physique

1. Scénario Métier :
    • Le gestionnaire lance un INVENTAIRE périodique.
    • Pour chaque produit, il compte le stock réel et saisit la valeur dans LIGNE_INVENTAIRE.
    • Le système calcule automatiquement l'ecart (quantité réelle - quantité théorique).
    • À la validation, le stock est ajusté dans STOCK et un MOUVEMENT_STOCK (AJUSTEMENT_INVENTAIRE) est consign
2. Entités déduites : INVENTAIRE, LIGNE_INVENTAIRE, STOCK, MOUVEMENT_STOCK.

## Processus 4 : Évolution des Prix & Consolidation Financière Journalière

1. Scénario Métier A (Historique des Prix) :
    • Chaque fois que le prix d'achat ou le prix de vente d'un produit est modifié, le système enregistre une l
    HISTORIQUE_PRIX (ancien prix, nouveau prix, auteur, date, motif).
2. Scénario Métier B (Clôture Journalière Super Admin) :
    • En fin de journée (à minuit ou sur demande), le système exécute une agrégation financière et fige les don
    CLOTURE_JOURNALIERE (CA HT, CA TTC, Bénéfice total, TVA collectée, Nbre de ventes, Nbre d'articles).
3. Entités déduites : HISTORIQUE_PRIX, CLOTURE_JOURNALIERE.
──────
 PARTIE 2 : Modèle Conceptuel de Données Révisé (MCD - Mermaid)

  erDiagram
      %% ==========================================
      %% 1. UTILISATEURS, ROLES & LOGS
      %% ==========================================
      ROLE ||--|{ UTILISATEUR : "est assigné à (1,n)"
      ROLE ||--|{ ROLE_PERMISSION : "contient (0,n)"
      PERMISSION ||--|{ ROLE_PERMISSION : "est associée à (0,n)"
      UTILISATEUR ||--o{ LOG_AUDIT : "génère (0,n)"

      ROLE {
          int id_role PK
          string code_role UK
          string libelle
      }

      UTILISATEUR {
          int id_utilisateur PK
          int id_role FK
          string nom
          string prenom
          string email UK
          string mot_de_passe_hash
          enum statut
      }

      %% ==========================================
      %% 2. PRODUITS, CATEGORIES & PRICING
      %% ==========================================
      CATEGORIE ||--o{ CATEGORIE : "parent de (0,n)"
      CATEGORIE ||--|{ CATEGORIE_PRODUIT : "contient (1,n)"
      PRODUIT ||--|{ CATEGORIE_PRODUIT : "classé dans (1,n)"
      PRODUIT ||--o{ IMAGE_PRODUIT : "possède (0,n)"
      PRODUIT ||--o{ VALEUR_ATTRIBUT : "a pour attribut (0,n)"
      ATTRIBUT_SPECIFIQUE ||--o{ VALEUR_ATTRIBUT : "définit (0,n)"
      PRODUIT ||--o{ HISTORIQUE_PRIX : "subit des variations (0,n)"

      PRODUIT {
          int id_produit PK
          string reference UK
          string code_barre UK "Pour scanner caisse"
          string libelle
          string marque
          string unite "ex: Pièce, Rame, Carton"
          decimal poids
          enum etat "NEUF, OCCASION, RECONDITIONNE"
          decimal prix_achat
          decimal prix_vente
          decimal taux_tva
          enum statut_visibilite
      }

      HISTORIQUE_PRIX {
          int id_historique PK
          int id_produit FK
          int id_utilisateur FK
          decimal ancien_prix_achat
          decimal nouveau_prix_achat
          decimal ancien_prix_vente
          decimal nouveau_prix_vente
          string motif_changement
          datetime date_changement
      }

      %% ==========================================
      %% 3. APPROVISIONNEMENT (FOURNISSEURS & ACHATS)
      %% ==========================================
      FOURNISSEUR ||--o{ ACHAT : "facture (0,n)"
      UTILISATEUR ||--o{ ACHAT : "passe (0,n)"
      ACHAT ||--|{ LIGNE_ACHAT : "contient (1,n)"
      PRODUIT ||--o{ LIGNE_ACHAT : "est acheté dans (0,n)"

      FOURNISSEUR {
          int id_fournisseur PK
          string nom_entreprise
          string contact_nom
          string telephone
          string email
          string adresse
          string ville
          string pays
          string numero_contribuable
          text observations
      }

      ACHAT {
          int id_achat PK
          string numero_facture_fournisseur
          int id_fournisseur FK
          int id_utilisateur FK
          datetime date_achat
          datetime date_reception
          decimal montant_total_ht
          decimal montant_total_ttc
          enum statut_achat "EN_ATTENTE, RECU, ANNULE"
      }

      LIGNE_ACHAT {
          int id_ligne_achat PK
          int id_achat FK
          int id_produit FK
          int quantite_commandee
          int quantite_recue
          decimal prix_achat_unitaire_ht
      }

      %% ==========================================
      %% 4. STOCKS, MOUVEMENTS & INVENTAIRE
      %% ==========================================
      PRODUIT ||--|| STOCK : "possède un niveau (1,1)"
      PRODUIT ||--o{ MOUVEMENT_STOCK : "subit (0,n)"
      UTILISATEUR ||--o{ MOUVEMENT_STOCK : "valide (0,n)"
      INVENTAIRE ||--|{ LIGNE_INVENTAIRE : "comporte (1,n)"
      PRODUIT ||--o{ LIGNE_INVENTAIRE : "fait l objet de (0,n)"
      UTILISATEUR ||--o{ INVENTAIRE : "effectue (0,n)"

      STOCK {
          int id_stock PK
          int id_produit FK, UK
          int quantite_en_stock
          int seuil_alerte
          datetime date_derniere_entree
          datetime date_derniere_sortie
      }

      MOUVEMENT_STOCK {
          int id_mouvement PK
          int id_produit FK
          int id_utilisateur FK
          int id_achat FK "Si entrée achat"
          enum type_mouvement "ENTREE_ACHAT, SORTIE_VENTE, AJUSTEMENT_INVENTAIRE"
          int quantite
          datetime date_mouvement
      }

      INVENTAIRE {
          int id_inventaire PK
          string reference_inventaire UK
          int id_utilisateur FK
          datetime date_inventaire
          enum statut_inventaire "EN_COURS, VALIDE, ANNULE"
          text observations
      }

      LIGNE_INVENTAIRE {
          int id_ligne_inventaire PK
          int id_inventaire FK
          int id_produit FK
          int quantite_theorique
          int quantite_reelle
          int ecart
          string motif_ajustement
      }

      %% ==========================================
      %% 5. VENTES, PAIEMENTS & SESSIONS DE CAISSE
      %% ==========================================
      CAISSE ||--o{ SESSION_CAISSE : "accueille (0,n)"
      UTILISATEUR ||--o{ SESSION_CAISSE : "ouvre (0,n)"
      SESSION_CAISSE ||--o{ VENTE : "enregistre (0,n)"
      VENTE ||--|{ LIGNE_VENTE : "contient (1,n)"
      PRODUIT ||--o{ LIGNE_VENTE : "est vendu dans (0,n)"
      VENTE ||--|{ PAIEMENT : "est réglée par (1,n)"

      CAISSE {
          int id_caisse PK
          string code_caisse UK
          string emplacement
          enum statut_caisse
      }

      SESSION_CAISSE {
          int id_session PK
          int id_caisse FK
          int id_utilisateur FK
          datetime date_ouverture
          datetime date_cloture
          decimal fond_de_caisse_initial
          decimal total_encaisse_calcule
          decimal total_encaisse_reel
          decimal ecart_caisse
          text motif_ecart "Explication si écart"
          enum statut_session
      }

      VENTE {
          int id_vente PK
          string reference_ticket UK
          int id_session FK
          datetime date_vente
          decimal total_ht
          decimal total_tva
          decimal total_ttc
          decimal marge_totale
          enum statut_vente "VALIDEE, ANNULEE, REMBOURSEE"
      }

      LIGNE_VENTE {
          int id_ligne_vente PK
          int id_vente FK
          int id_produit FK
          int quantite
          decimal prix_achat_unitaire_snapshot
          decimal prix_vente_unitaire_ht_snapshot
          decimal taux_tva_snapshot
          decimal marge_unitaire
          decimal total_ligne_ht
      }

      PAIEMENT {
          int id_paiement PK
          int id_vente FK
          enum mode_paiement "ESPECES, CARTE_BANCAIRE, MOBILE_MONEY, CHEQUE"
          decimal montant
          string reference_transaction
          datetime date_paiement
      }

      %% ==========================================
      %% 6. FINANCE & CONSOLIDATION JOURNALIÈRE
      %% ==========================================
      UTILISATEUR ||--o{ CLOTURE_JOURNALIERE : "valide (0,n)"

      CLOTURE_JOURNALIERE {
          int id_cloture PK
          date date_cloture UK
          decimal chiffre_affaires_ht
          decimal chiffre_affaires_ttc
          decimal tva_collectee
          decimal benefice_brut_total
          int nombre_ventes
          int nombre_articles_vendus
          int id_utilisateur_validation FK
          datetime date_validation
      }
  ──────
 PARTIE 3 : Script DDL SQL Exécutable (Mis à Jour)

  -- ============================================================
  -- SCRIPT BASE DE DONNÉES FINALE : LIBRAIRIE NUMÉRIQUE (ERP COMPLETE)
  -- ============================================================

  -- 1. RÔLES & UTILISATEURS (RBAC SIMPLIFIÉ 1:N)
  CREATE TABLE role (
      id_role INT AUTO_INCREMENT PRIMARY KEY,
      code_role VARCHAR(50) NOT NULL UNIQUE,
      libelle VARCHAR(100) NOT NULL
  );

  CREATE TABLE utilisateur (
      id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
      id_role INT NOT NULL,
      nom VARCHAR(100) NOT NULL,
      prenom VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      mot_de_passe_hash VARCHAR(255) NOT NULL,
      statut ENUM('ACTIF', 'INACTIF') DEFAULT 'ACTIF',
      CONSTRAINT fk_user_role FOREIGN KEY (id_role) REFERENCES role(id_role)
  );

  CREATE TABLE permission (
      id_permission INT AUTO_INCREMENT PRIMARY KEY,
      code_permission VARCHAR(100) NOT NULL UNIQUE,
      module VARCHAR(50) NOT NULL
  );

  CREATE TABLE role_permission (
      id_role INT NOT NULL,
      id_permission INT NOT NULL,
      PRIMARY KEY (id_role, id_permission),
      CONSTRAINT fk_rp_role FOREIGN KEY (id_role) REFERENCES role(id_role) ON DELETE CASCADE,
      CONSTRAINT fk_rp_perm FOREIGN KEY (id_permission) REFERENCES permission(id_permission) ON DELETE CASCADE
  );

  CREATE TABLE log_audit (
      id_log BIGINT AUTO_INCREMENT PRIMARY KEY,
      id_utilisateur INT NULL,
      action VARCHAR(50) NOT NULL,
      entite_cible VARCHAR(50) NOT NULL,
      details_json JSON NULL,
      date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_log_user FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE SET 
  );

  -- 2. CATALOGUE PRODUITS & ENRICHISSEMENTS
  CREATE TABLE categorie (
      id_categorie INT AUTO_INCREMENT PRIMARY KEY,
      nom VARCHAR(100) NOT NULL,
      slug VARCHAR(120) NOT NULL UNIQUE,
      id_categorie_parente INT NULL,
      CONSTRAINT fk_cat_parent FOREIGN KEY (id_categorie_parente) REFERENCES categorie(id_categorie) ON DELETE 
  );

  CREATE TABLE produit (
      id_produit INT AUTO_INCREMENT PRIMARY KEY,
      reference VARCHAR(50) NOT NULL UNIQUE,
      code_barre VARCHAR(100) NULL UNIQUE, -- ③ Code-barres pour scanner
      libelle VARCHAR(255) NOT NULL,
      description TEXT,
      marque VARCHAR(100) NULL,             -- ③ Marque
      unite VARCHAR(50) DEFAULT 'Pièce',    -- ③ Unité (ex: Pièce, Rame, Carton)
      poids DECIMAL(8, 2) NULL,             -- ③ Poids en kg
      etat ENUM('NEUF', 'OCCASION', 'RECONDITIONNE') DEFAULT 'NEUF', -- ③ État du produit
      prix_achat DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      prix_vente DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      taux_tva DECIMAL(4, 2) NOT NULL DEFAULT 20.00,
      statut_visibilite ENUM('VISIBLE', 'MASQUE') DEFAULT 'VISIBLE',
      date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE categorie_produit (
      id_produit INT NOT NULL,
      id_categorie INT NOT NULL,
      PRIMARY KEY (id_produit, id_categorie),
      CONSTRAINT fk_cp_prod FOREIGN KEY (id_produit) REFERENCES produit(id_produit) ON DELETE CASCADE,
      CONSTRAINT fk_cp_cat FOREIGN KEY (id_categorie) REFERENCES categorie(id_categorie) ON DELETE CASCADE
  );

  CREATE TABLE image_produit (
      id_image INT AUTO_INCREMENT PRIMARY KEY,
      id_produit INT NOT NULL,
      url_image VARCHAR(500) NOT NULL,
      est_principale BOOLEAN DEFAULT FALSE,
      CONSTRAINT fk_img_prod FOREIGN KEY (id_produit) REFERENCES produit(id_produit) ON DELETE CASCADE
  );

  CREATE TABLE attribut_specifique (
      id_attribut INT AUTO_INCREMENT PRIMARY KEY,
      code_attribut VARCHAR(50) NOT NULL UNIQUE,
      libelle VARCHAR(100) NOT NULL
  );

  CREATE TABLE valeur_attribut (
      id_produit INT NOT NULL,
      id_attribut INT NOT NULL,
      valeur TEXT NOT NULL,
      PRIMARY KEY (id_produit, id_attribut),
      CONSTRAINT fk_va_prod FOREIGN KEY (id_produit) REFERENCES produit(id_produit) ON DELETE CASCADE,
      CONSTRAINT fk_va_attr FOREIGN KEY (id_attribut) REFERENCES attribut_specifique(id_attribut) ON DELETE CAS
  );

  -- ⑩ HISTORIQUE DES PRIX
  CREATE TABLE historique_prix (
      id_historique INT AUTO_INCREMENT PRIMARY KEY,
      id_produit INT NOT NULL,
      id_utilisateur INT NOT NULL,
      ancien_prix_achat DECIMAL(10, 2) NOT NULL,
      nouveau_prix_achat DECIMAL(10, 2) NOT NULL,
      ancien_prix_vente DECIMAL(10, 2) NOT NULL,
      nouveau_prix_vente DECIMAL(10, 2) NOT NULL,
      motif_changement VARCHAR(255) NULL,
      date_changement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_hp_prod FOREIGN KEY (id_produit) REFERENCES produit(id_produit),
      CONSTRAINT fk_hp_user FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur)
  );

  -- 3. APPROVISIONNEMENT (④ FOURNISSEURS & ① ACHATS / LIGNES ACHAT)
  CREATE TABLE fournisseur (
      id_fournisseur INT AUTO_INCREMENT PRIMARY KEY,
      nom_entreprise VARCHAR(150) NOT NULL,
      contact_nom VARCHAR(100),
      telephone VARCHAR(30),
      email VARCHAR(150),
      adresse VARCHAR(255) NULL,              -- ④ Adresse
      ville VARCHAR(100) NULL,                -- ④ Ville
      pays VARCHAR(100) DEFAULT 'Côte d\'Ivoire', -- ④ Pays
      numero_contribuable VARCHAR(100) NULL,  -- ④ N° Contribuable (NCC/IFU)
      observations TEXT NULL                  -- ④ Observations
  );

  CREATE TABLE achat (
      id_achat INT AUTO_INCREMENT PRIMARY KEY,
      numero_facture_fournisseur VARCHAR(100) NOT NULL,
      id_fournisseur INT NOT NULL,
      id_utilisateur INT NOT NULL,
      date_achat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      date_reception TIMESTAMP NULL,
      montant_total_ht DECIMAL(10, 2) DEFAULT 0.00,
      montant_total_ttc DECIMAL(10, 2) DEFAULT 0.00,
      statut_achat ENUM('EN_ATTENTE', 'RECU', 'ANNULE') DEFAULT 'EN_ATTENTE',
      CONSTRAINT fk_ach_fourn FOREIGN KEY (id_fournisseur) REFERENCES fournisseur(id_fournisseur),
      CONSTRAINT fk_ach_user FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur)
  );

  CREATE TABLE ligne_achat (
      id_ligne_achat INT AUTO_INCREMENT PRIMARY KEY,
      id_achat INT NOT NULL,
      id_produit INT NOT NULL,
      quantite_commandee INT NOT NULL,
      quantite_recue INT NOT NULL DEFAULT 0,
      prix_achat_unitaire_ht DECIMAL(10, 2) NOT NULL,
      CONSTRAINT fk_la_achat FOREIGN KEY (id_achat) REFERENCES achat(id_achat) ON DELETE CASCADE,
      CONSTRAINT fk_la_prod FOREIGN KEY (id_produit) REFERENCES produit(id_produit)
  );

  -- 4. STOCKS, MOUVEMENTS & ⑧ INVENTAIRE
  CREATE TABLE stock (
      id_stock INT AUTO_INCREMENT PRIMARY KEY,
      id_produit INT NOT NULL UNIQUE,
      quantite_en_stock INT NOT NULL DEFAULT 0,
      seuil_alerte INT NOT NULL DEFAULT 5,
      date_derniere_entree TIMESTAMP NULL, -- ② Date dernière entrée
      date_derniere_sortie TIMESTAMP NULL, -- ② Date dernière sortie
      CONSTRAINT fk_stock_prod FOREIGN KEY (id_produit) REFERENCES produit(id_produit) ON DELETE CASCADE
  );

  CREATE TABLE mouvement_stock (
      id_mouvement INT AUTO_INCREMENT PRIMARY KEY,
      id_produit INT NOT NULL,
      id_utilisateur INT NOT NULL,
      id_achat INT NULL, -- Lié à l'achat si entrée
      type_mouvement ENUM('ENTREE_ACHAT', 'SORTIE_VENTE', 'AJUSTEMENT_INVENTAIRE') NOT NULL,
      quantite INT NOT NULL,
      date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_mvt_prod FOREIGN KEY (id_produit) REFERENCES produit(id_produit),
      CONSTRAINT fk_mvt_user FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur),
      CONSTRAINT fk_mvt_achat FOREIGN KEY (id_achat) REFERENCES achat(id_achat) ON DELETE SET NULL
  );

  CREATE TABLE inventaire (
      id_inventaire INT AUTO_INCREMENT PRIMARY KEY,
      reference_inventaire VARCHAR(60) NOT NULL UNIQUE,
      id_utilisateur INT NOT NULL,
      date_inventaire TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      statut_inventaire ENUM('EN_COURS', 'VALIDE', 'ANNULE') DEFAULT 'EN_COURS',
      observations TEXT NULL,
      CONSTRAINT fk_inv_user FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur)
  );

  CREATE TABLE ligne_inventaire (
      id_ligne_inventaire INT AUTO_INCREMENT PRIMARY KEY,
      id_inventaire INT NOT NULL,
      id_produit INT NOT NULL,
      quantite_theorique INT NOT NULL,
      quantite_reelle INT NOT NULL,
      ecart INT NOT NULL,
      motif_ajustement VARCHAR(255) NULL,
      CONSTRAINT fk_li_inv FOREIGN KEY (id_inventaire) REFERENCES inventaire(id_inventaire) ON DELETE CASCADE,
      CONSTRAINT fk_li_prod FOREIGN KEY (id_produit) REFERENCES produit(id_produit)
  );

  -- 5. CAISSE, SESSIONS, ⑤ VENTES & ⑦ PAIEMENTS MULTIPLES
  CREATE TABLE caisse (
      id_caisse INT AUTO_INCREMENT PRIMARY KEY,
      code_caisse VARCHAR(50) NOT NULL UNIQUE,
      emplacement VARCHAR(100),
      statut_caisse ENUM('OUVERTE', 'FERMEE') DEFAULT 'FERMEE'
  );

  CREATE TABLE session_caisse (
      id_session INT AUTO_INCREMENT PRIMARY KEY,
      id_caisse INT NOT NULL,
      id_utilisateur INT NOT NULL,
      date_ouverture TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      date_cloture TIMESTAMP NULL,
      fond_de_caisse_initial DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      total_encaisse_calcule DECIMAL(10, 2) DEFAULT 0.00,
      total_encaisse_reel DECIMAL(10, 2) DEFAULT 0.00,
      ecart_caisse DECIMAL(10, 2) DEFAULT 0.00,
      motif_ecart TEXT NULL, -- ⑥ Motif si écart de caisse constaté
      statut_session ENUM('OUVERTE', 'CLOTUREE') DEFAULT 'OUVERTE',
      CONSTRAINT fk_sess_caiss FOREIGN KEY (id_caisse) REFERENCES caisse(id_caisse),
      CONSTRAINT fk_sess_usr FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur)
  );

  CREATE TABLE vente (
      id_vente INT AUTO_INCREMENT PRIMARY KEY,
      reference_ticket VARCHAR(60) NOT NULL UNIQUE,
      id_session INT NOT NULL,
      date_vente TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      total_ht DECIMAL(10, 2) NOT NULL,
      total_tva DECIMAL(10, 2) NOT NULL,
      total_ttc DECIMAL(10, 2) NOT NULL,
      marge_totale DECIMAL(10, 2) NOT NULL,
      statut_vente ENUM('VALIDEE', 'ANNULEE', 'REMBOURSEE') DEFAULT 'VALIDEE', -- ⑤ Statut pour annulation/remb
      CONSTRAINT fk_vnt_sess FOREIGN KEY (id_session) REFERENCES session_caisse(id_session)
  );

  CREATE TABLE ligne_vente (
      id_ligne_vente INT AUTO_INCREMENT PRIMARY KEY,
      id_vente INT NOT NULL,
      id_produit INT NOT NULL,
      quantite INT NOT NULL,
      prix_achat_unitaire_snapshot DECIMAL(10, 2) NOT NULL,
      prix_vente_unitaire_ht_snapshot DECIMAL(10, 2) NOT NULL,
      taux_tva_snapshot DECIMAL(4, 2) NOT NULL,
      marge_unitaire DECIMAL(10, 2) NOT NULL,
      total_ligne_ht DECIMAL(10, 2) NOT NULL,
      CONSTRAINT fk_lv_vnt FOREIGN KEY (id_vente) REFERENCES vente(id_vente) ON DELETE CASCADE,
      CONSTRAINT fk_lv_prd FOREIGN KEY (id_produit) REFERENCES produit(id_produit)
  );

  -- ⑦ TABLE PAIEMENT SEPAREE (Gestion du multi-règlement)
  CREATE TABLE paiement (
      id_paiement INT AUTO_INCREMENT PRIMARY KEY,
      id_vente INT NOT NULL,
      mode_paiement ENUM('ESPECES', 'CARTE_BANCAIRE', 'MOBILE_MONEY', 'CHEQUE') NOT NULL,
      montant DECIMAL(10, 2) NOT NULL,
      reference_transaction VARCHAR(100) NULL,
      date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_pmt_vente FOREIGN KEY (id_vente) REFERENCES vente(id_vente) ON DELETE CASCADE
  );

  -- ⑨ TABLE CLÔTURE JOURNALIÈRE (Consolidation des données)
  CREATE TABLE cloture_journaliere (
      id_cloture INT AUTO_INCREMENT PRIMARY KEY,
      date_cloture DATE NOT NULL UNIQUE,
      chiffre_affaires_ht DECIMAL(10, 2) NOT NULL,
      chiffre_affaires_ttc DECIMAL(10, 2) NOT NULL,
      tva_collectee DECIMAL(10, 2) NOT NULL,
      benefice_brut_total DECIMAL(10, 2) NOT NULL,
      nombre_ventes INT NOT NULL,
      nombre_articles_vendus INT NOT NULL,
      id_utilisateur_validation INT NOT NULL,
      date_validation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_clot_user FOREIGN KEY (id_utilisateur_validation) REFERENCES utilisateur(id_utilisateur)


------------------------------------------------------------------------------------------------------------------------------------------------------------  Voici le Dictionnaire de Données complet et détaillé de l'ensemble de la base de données.

  Pour une lisibilité maximale, il est organisé en 6 blocs fonctionnels métier. Chaque champ y est documenté avec son type, ses
  contraintes (PK, FK, UK, Nullable) et sa description opérationnelle.
  ──────
   1. Bloc Sécurité, Rôles & Traçabilité (RBAC)

  ### Table role

   Nom du Champ │ Type de Donnée       │ Clé │ Obligatoire │ Valeur pa… │ Description & Rôle Métier
  ──────────────┼──────────────────────┼─────┼─────────────┼────────────┼─────────────────────────────────────────────────────────
   id_role      │ INT (Auto-incrément) │ PK  │     Oui     │ Auto       │ Identifiant unique du rôle.
   code_role    │ VARCHAR(50)          │ UK  │     Oui     │ -          │ Code court d'identification (ADMIN, CAISSIER,
                │                      │     │             │            │ GESTIONNAIRE).
   libelle      │ VARCHAR(100)         │  -  │     Oui     │ -          │ Nom complet du rôle affiché dans l'interface.

  ### Table utilisateur

   Nom du Champ      │ Type de Donnée          │ Clé │ Obligatoire │ Valeur par … │ Description & Rôle Métier
  ───────────────────┼─────────────────────────┼─────┼─────────────┼──────────────┼───────────────────────────────────────────────
   id_utilisateur    │ INT (Auto-incrément)    │ PK  │     Oui     │ Auto         │ Identifiant unique de l'utilisateur interne.
   id_role           │ INT                     │ FK  │     Oui     │ -            │ Rôle assigné à l'utilisateur (relation 1 à N
                     │                         │     │             │              │ vers role).
   nom               │ VARCHAR(100)            │  -  │     Oui     │ -            │ Nom de famille.
   prenom            │ VARCHAR(100)            │  -  │     Oui     │ -            │ Prénom.
   email             │ VARCHAR(150)            │ UK  │     Oui     │ -            │ Adresse email servant d'identifiant de
                     │                         │     │             │              │ connexion.
   mot_de_passe_hash │ VARCHAR(255)            │  -  │     Oui     │ -            │ Empreinte sécurisée du mot de passe
                     │                         │     │             │              │ (Bcrypt/Argon2).
   statut            │ ENUM('ACTIF','INACTIF') │  -  │     Oui     │ 'ACTIF'      │ État du compte (permet de bloquer un accès).

  ### Table permission

   Nom du Champ    │ Type de Donnée       │ Clé │ Obligatoire │ Valeur par Défaut │ Description & Rôle Métier
  ─────────────────┼──────────────────────┼─────┼─────────────┼───────────────────┼───────────────────────────────────────────────
   id_permission   │ INT (Auto-incrément) │ PK  │     Oui     │ Auto              │ Identifiant unique de la permission.
   code_permission │ VARCHAR(100)         │ UK  │     Oui     │ -                 │ Action autorisée (PRODUIT_CREER, VENTE_ANNULER
   module          │ VARCHAR(50)          │  -  │     Oui     │ -                 │ Module associé (CATALOGUE, CAISSE, ACHATS).

  ### Table role_permission

   Nom du Champ     │ Type de Donnée   │       Clé        │   Obligatoire    │ Valeur par Défaut │ Description & Rôle Métier
  ──────────────────┼──────────────────┼──────────────────┼──────────────────┼───────────────────┼────────────────────────────────
   id_role          │ INT              │      PK, FK      │       Oui        │ -                 │ Clé étrangère vers role.
   id_permission    │ INT              │      PK, FK      │       Oui        │ -                 │ Clé étrangère vers permission.

  ### Table log_audit

   Nom du Champ   │ Type de Donnée      │ Clé │ Obligatoire │ Valeur par D… │ Description & Rôle Métier
  ────────────────┼─────────────────────┼─────┼─────────────┼───────────────┼─────────────────────────────────────────────────────
   id_log         │ BIGINT (Auto-       │ PK  │     Oui     │ Auto          │ Identifiant unique de l'évènement tracé.
                  │ incrément)          │     │             │               │
   id_utilisateur │ INT                 │ FK  │     Non     │ NULL          │ Auteur de l'action (NULL si système).
   action         │ VARCHAR(50)         │  -  │     Oui     │ -             │ Action effectuée (CREATION, CLOTURE, MODIF_PRIX).
   entite_cible   │ VARCHAR(50)         │  -  │     Oui     │ -             │ Table ou objet impacté (PRODUIT, SESSION_CAISSE).
   details_json   │ JSON / TEXT         │  -  │     Non     │ NULL          │ Capture des anciennes vs nouvelles valeurs en JSON.
   date_action    │ TIMESTAMP           │  -  │     Oui     │ CURRENT_TIMES │ Date et heure exactes de l'opération.
                  │                     │     │             │ TAMP          │
  ──────
   2. Bloc Catalogue, Produits & Historique des Prix

  ### Table categorie

   Nom du Champ         │ Type de Donnée       │ Clé │ Obligatoire │ Valeur par Dé… │ Description & Rôle Métier
  ──────────────────────┼──────────────────────┼─────┼─────────────┼────────────────┼─────────────────────────────────────────────
   id_categorie         │ INT (Auto-incrément) │ PK  │     Oui     │ Auto           │ Identifiant unique de la catégorie.
   nom                  │ VARCHAR(100)         │  -  │     Oui     │ -              │ Libellé (ex: Livres, Bureautique,
                        │                      │     │             │                │ Informatique).
   slug                 │ VARCHAR(120)         │ UK  │     Oui     │ -              │ Slug lisible pour l'URL du site.
   id_categorie_parente │ INT                  │ FK  │     Non     │ NULL           │ ID de la catégorie mère (gestion de
                        │                      │     │             │                │ l'arborescence).

  ### Table produit

   Nom du Champ      │ Type de Donnée       │ Clé │ Obligatoire │ Valeur par Défa… │ Description & Rôle Métier
  ───────────────────┼──────────────────────┼─────┼─────────────┼──────────────────┼──────────────────────────────────────────────
   id_produit        │ INT (Auto-incrément) │ PK  │     Oui     │ Auto             │ Identifiant unique du produit.
   reference         │ VARCHAR(50)          │ UK  │     Oui     │ -                │ Référence interne (SKU).
   code_barre        │ VARCHAR(100)         │ UK  │     Non     │ NULL             │ Code-barres EAN13/UPC pour le lecteur
                     │                      │     │             │                  │ douchette en caisse.
   libelle           │ VARCHAR(255)         │  -  │     Oui     │ -                │ Désignation commerciale de l'article.
   description       │ TEXT                 │  -  │     Non     │ NULL             │ Description complète de l'article.
   marque            │ VARCHAR(100)         │  -  │     Non     │ NULL             │ Marque / Éditeur du produit.
   unite             │ VARCHAR(50)          │  -  │     Oui     │ 'Pièce'          │ Conditionnement (ex: Pièce, Carton, Rame).
   poids             │ DECIMAL(8,2)         │  -  │     Non     │ NULL             │ Poids du produit en Kg.
   etat              │ ENUM(...)            │  -  │     Oui     │ 'NEUF'           │ État (NEUF, OCCASION, RECONDITIONNE).
   prix_achat        │ DECIMAL(10,2)        │  -  │     Oui     │ 0.00             │ Prix d'achat HT au fournisseur.
   prix_vente        │ DECIMAL(10,2)        │  -  │     Oui     │ 0.00             │ Prix de vente HT au client.
   taux_tva          │ DECIMAL(4,2)         │  -  │     Oui     │ 20.00            │ Taux de TVA applicable en %.
   statut_visibilite │ ENUM(...)            │  -  │     Oui     │ 'VISIBLE'        │ Visibilité vitrine (VISIBLE ou MASQUE pour
                     │                      │     │             │                  │ RG-02).
   date_creation     │ TIMESTAMP            │  -  │     Oui     │ CURRENT_TIMESTAM │ Date d'enregistrement de la fiche.
                     │                      │     │             │ P                │

  ### Table categorie_produit

   Nom du Champ      │ Type de Donnée   │       Clé        │   Obligatoire    │ Valeur par Défaut │ Description & Rôle Métier
  ───────────────────┼──────────────────┼──────────────────┼──────────────────┼───────────────────┼───────────────────────────────
   id_produit        │ INT              │      PK, FK      │       Oui        │ -                 │ ID du produit.
   id_categorie      │ INT              │      PK, FK      │       Oui        │ -                 │ ID de la catégorie rattachée.

  ### Table image_produit

   Nom du Champ   │ Type de Donnée       │ Clé  │ Obligatoire │ Valeur par Défaut │ Description & Rôle Métier
  ────────────────┼──────────────────────┼──────┼─────────────┼───────────────────┼───────────────────────────────────────────────
   id_image       │ INT (Auto-incrément) │  PK  │     Oui     │ Auto              │ Identifiant unique de l'image.
   id_produit     │ INT                  │  FK  │     Oui     │ -                 │ Produit auquel appartient l'image.
   url_image      │ VARCHAR(500)         │  -   │     Oui     │ -                 │ Chemin d'accès ou URL de l'image.
   est_principale │ BOOLEAN              │  -   │     Oui     │ False             │ Indique s'il s'agit de l'image de couverture.

  ### Tables Flexibles attribut_specifique & valeur_attribut

   Table               │ Champ          │ Type           │      Clé       │ Description
  ─────────────────────┼────────────────┼────────────────┼────────────────┼───────────────────────────────────────────────────────
   attribut_specifique │ id_attribut    │ INT (Auto)     │       PK       │ ID de la caractéristique.
                       │ code_attribut  │ VARCHAR(50)    │       UK       │ Code de la propriété (ex: isbn, ram, auteur).
                       │ libelle        │ VARCHAR(100)   │       -        │ Libellé lisible (ex: ISBN, Mémoire RAM).
   valeur_attribut     │ id_produit     │ INT            │     PK, FK     │ Produit concerné.
                       │ id_attribut    │ INT            │     PK, FK     │ Attribut concerné.
                       │ valeur         │ TEXT           │       -        │ Valeur spécifique (ex: "978-2-04-123456-7", "16 Go").

  ### Table historique_prix

   Nom du Champ       │ Type de Donnée       │ Clé │ Obligatoire │ Valeur par Défaut │ Description & Rôle Métier
  ────────────────────┼──────────────────────┼─────┼─────────────┼───────────────────┼────────────────────────────────────────────
   id_historique      │ INT (Auto-incrément) │ PK  │     Oui     │ Auto              │ Identifiant du registre de changement de pr
   id_produit         │ INT                  │ FK  │     Oui     │ -                 │ Produit dont le tarif change.
   id_utilisateur     │ INT                  │ FK  │     Oui     │ -                 │ Auteur de la modification tarifaire.
   ancien_prix_achat  │ DECIMAL(10,2)        │  -  │     Oui     │ -                 │ Prix d'achat HT avant changement.
   nouveau_prix_achat │ DECIMAL(10,2)        │  -  │     Oui     │ -                 │ Nouveau prix d'achat HT.
   ancien_prix_vente  │ DECIMAL(10,2)        │  -  │     Oui     │ -                 │ Prix de vente HT avant changement.
   nouveau_prix_vente │ DECIMAL(10,2)        │  -  │     Oui     │ -                 │ Nouveau prix de vente HT.
   motif_changement   │ VARCHAR(255)         │  -  │     Non     │ NULL              │ Motif explicatif (ex: Hausse éditeur, Promo
   date_changement    │ TIMESTAMP            │  -  │     Oui     │ CURRENT_TIMESTAMP │ Horodatage précis de la modification.
  ──────
   3. Bloc Approvisionnement & Fournisseurs

  ### Table fournisseur

   Nom du Champ        │ Type de Donnée       │  Clé  │ Obligatoire │ Valeur par Défaut │ Description & Rôle Métier
  ─────────────────────┼──────────────────────┼───────┼─────────────┼───────────────────┼─────────────────────────────────────────
   id_fournisseur      │ INT (Auto-incrément) │  PK   │     Oui     │ Auto              │ Identifiant du fournisseur.
   nom_entreprise      │ VARCHAR(150)         │   -   │     Oui     │ -                 │ Raison sociale / Nom de la société.
   contact_nom         │ VARCHAR(100)         │   -   │     Non     │ NULL              │ Nom du commercial / représentant.
   telephone           │ VARCHAR(30)          │   -   │     Non     │ NULL              │ Numéro de téléphone.
   email               │ VARCHAR(150)         │   -   │     Non     │ NULL              │ Adresse email du fournisseur.
   adresse             │ VARCHAR(255)         │   -   │     Non     │ NULL              │ Adresse géographique.
   ville               │ VARCHAR(100)         │   -   │     Non     │ NULL              │ Ville.
   pays                │ VARCHAR(100)         │   -   │     Oui     │ 'Côte d\'Ivoire'  │ Pays du fournisseur.
   numero_contribuable │ VARCHAR(100)         │   -   │     Non     │ NULL              │ N° d'immatriculation fiscale (NCC/IFU).
   observations        │ TEXT                 │   -   │     Non     │ NULL              │ Remarques / conditions de paiement.

  ### Table achat

   Nom du Champ               │ Type de Donnée       │ Clé │ Obligatoire │ Valeur par Défa… │ Description & Rôle Métier
  ────────────────────────────┼──────────────────────┼─────┼─────────────┼──────────────────┼─────────────────────────────────────
   id_achat                   │ INT (Auto-incrément) │ PK  │     Oui     │ Auto             │ Identifiant du bon / de la facture
                              │                      │     │             │                  │ d'achat.
   numero_facture_fournisseur │ VARCHAR(100)         │  -  │     Oui     │ -                │ Référence de la facture du
                              │                      │     │             │                  │ fournisseur.
   id_fournisseur             │ INT                  │ FK  │     Oui     │ -                │ Fournisseur ayant vendu le lot.
   id_utilisateur             │ INT                  │ FK  │     Oui     │ -                │ Agent d'achat ayant saisi la
                              │                      │     │             │                  │ commande.
   date_achat                 │ TIMESTAMP            │  -  │     Oui     │ CURRENT_TIMESTAM │ Date d'émission de l'achat.
                              │                      │     │             │ P                │
   date_reception             │ TIMESTAMP            │  -  │     Non     │ NULL             │ Date de livraison effective des
                              │                      │     │             │                  │ marchandises.
   montant_total_ht           │ DECIMAL(10,2)        │  -  │     Oui     │ 0.00             │ Montant total HT de la commande.
   montant_total_ttc          │ DECIMAL(10,2)        │  -  │     Oui     │ 0.00             │ Montant total TTC payé.
   statut_achat               │ ENUM(...)            │  -  │     Oui     │ 'EN_ATTENTE'     │ État (EN_ATTENTE, RECU, ANNULE).

  ### Table ligne_achat

   Nom du Champ           │ Type de Donnée       │ Clé │ Obligatoire │ Valeur par Défaut │ Description & Rôle Métier
  ────────────────────────┼──────────────────────┼─────┼─────────────┼───────────────────┼────────────────────────────────────────
   id_ligne_achat         │ INT (Auto-incrément) │ PK  │     Oui     │ Auto              │ Identifiant de la ligne d'achat.
   id_achat               │ INT                  │ FK  │     Oui     │ -                 │ Raccordement au bon d'achat parent.
   id_produit             │ INT                  │ FK  │     Oui     │ -                 │ Produit acheté.
   quantite_commandee     │ INT                  │  -  │     Oui     │ -                 │ Quantité figurant sur le bon de command
   quantite_recue         │ INT                  │  -  │     Oui     │ 0                 │ Quantité réellement comptée en stock.
   prix_achat_unitaire_ht │ DECIMAL(10,2)        │  -  │     Oui     │ -                 │ Coût unitaire d'achat négocier HT.
  ──────
   4. Bloc Stock, Mouvements & Inventaire

  ### Table stock

   Nom du Champ         │ Type de Donnée    │  Clé   │ Obligatoire │ Valeur par D… │ Description & Rôle Métier
  ──────────────────────┼───────────────────┼────────┼─────────────┼───────────────┼──────────────────────────────────────────────
   id_stock             │ INT (Auto-        │   PK   │     Oui     │ Auto          │ Identifiant de l'enregistrement de stock.
                        │ incrément)        │        │             │               │
   id_produit           │ INT               │ FK, UK │     Oui     │ -             │ Produit (Relation 1-à-1 stricte).
   quantite_en_stock    │ INT               │   -    │     Oui     │ 0             │ Quantité physiquement disponible.
   seuil_alerte         │ INT               │   -    │     Oui     │ 5             │ Niveau minimum déclenchant l'alerte réappro.
   date_derniere_entree │ TIMESTAMP         │   -    │     Non     │ NULL          │ Date du dernier approvisionnement reçu.
   date_derniere_sortie │ TIMESTAMP         │   -    │     Non     │ NULL          │ Date de la dernière vente / sortie.

  ### Table mouvement_stock

   Nom du Champ   │ Type de Donnée  │ Clé │ Obligatoire │ Valeur par Dé… │ Description & Rôle Métier
  ────────────────┼─────────────────┼─────┼─────────────┼────────────────┼────────────────────────────────────────────────────────
   id_mouvement   │ INT (Auto-      │ PK  │     Oui     │ Auto           │ Identifiant du mouvement.
                  │ incrément)      │     │             │                │
   id_produit     │ INT             │ FK  │     Oui     │ -              │ Produit impacté.
   id_utilisateur │ INT             │ FK  │     Oui     │ -              │ Opérateur responsable de l'entrée/sortie.
   id_achat       │ INT             │ FK  │     Non     │ NULL           │ Référence d'achat si c'est une réception.
   type_mouvement │ ENUM(...)       │  -  │     Oui     │ -              │ Motif (ENTREE_ACHAT, SORTIE_VENTE,
                  │                 │     │             │                │ AJUSTEMENT_INVENTAIRE).
   quantite       │ INT             │  -  │     Oui     │ -              │ Quantité mouvementée (positive ou négative).
   date_mouvement │ TIMESTAMP       │  -  │     Oui     │ CURRENT_TIMEST │ Horodatage exact de l'opération.
                  │                 │     │             │ AMP            │

  ### Tables inventaire & ligne_inventaire

   Table               │ Champ                │ Type               │        Clé         │ Description
  ─────────────────────┼──────────────────────┼────────────────────┼────────────────────┼─────────────────────────────────────────
   inventaire          │ id_inventaire        │ INT (Auto)         │         PK         │ ID du rapport d'inventaire.
                       │ reference_inventaire │ VARCHAR(60)        │         UK         │ Référence (ex: INV-2026-Q1).
                       │ id_utilisateur       │ INT                │         FK         │ Agent effectuant l'inventaire.
                       │ date_inventaire      │ TIMESTAMP          │         -          │ Date de comptage.
                       │ statut_inventaire    │ ENUM(...)          │         -          │ État (EN_COURS, VALIDE, ANNULE).
   ligne_inventaire    │ id_ligne_inventaire  │ INT (Auto)         │         PK         │ Ligne de comptage.
                       │ id_inventaire        │ INT                │         FK         │ Inventaire parent.
                       │ id_produit           │ INT                │         FK         │ Produit compté.
                       │ quantite_theorique   │ INT                │         -          │ Stock théorique calculé par le système.
                       │ quantite_reelle      │ INT                │         -          │ Stock réel compté physiquement.
                       │ ecart                │ INT                │         -          │ Écart (Reel - Theorique).
                       │ motif_ajustement     │ VARCHAR(255)       │         -          │ Explication (ex: Casse, Vol, Perte).
  ──────
   5. Bloc Caisse, Ventes & Paiements

  ### Table caisse

   Nom du Champ  │ Type de Donnée       │     Clé      │ Obligatoire  │ Valeur par Défaut │ Description & Rôle Métier
  ───────────────┼──────────────────────┼──────────────┼──────────────┼───────────────────┼───────────────────────────────────────
   id_caisse     │ INT (Auto-incrément) │      PK      │     Oui      │ Auto              │ Identifiant physique de la caisse.
   code_caisse   │ VARCHAR(50)          │      UK      │     Oui      │ -                 │ Code de la caisse (ex: CAISSE_01).
   emplacement   │ VARCHAR(100)         │      -       │     Non      │ NULL              │ Emplacement physique dans le magasin.
   statut_caisse │ ENUM(...)            │      -       │     Oui      │ 'FERMEE'          │ État courant (OUVERTE, FERMEE).

  ### Table session_caisse

   Nom du Champ           │ Type de Donnée       │ Clé │ Obligatoire │ Valeur par Défaut │ Description & Rôle Métier
  ────────────────────────┼──────────────────────┼─────┼─────────────┼───────────────────┼────────────────────────────────────────
   id_session             │ INT (Auto-incrément) │ PK  │     Oui     │ Auto              │ Identifiant unique du service de caisse
   id_caisse              │ INT                  │ FK  │     Oui     │ -                 │ Caisse physique utilisée.
   id_utilisateur         │ INT                  │ FK  │     Oui     │ -                 │ Caissier responsable du poste.
   date_ouverture         │ TIMESTAMP            │  -  │     Oui     │ CURRENT_TIMESTAMP │ Date et heure d'ouverture de caisse.
   date_cloture           │ TIMESTAMP            │  -  │     Non     │ NULL              │ Date et heure de fermeture.
   fond_de_caisse_initial │ DECIMAL(10,2)        │  -  │     Oui     │ 0.00              │ Espèces présentes à l'ouverture.
   total_encaisse_calcule │ DECIMAL(10,2)        │  -  │     Oui     │ 0.00              │ Montant des encaissés théoriques calcul
   total_encaisse_reel    │ DECIMAL(10,2)        │  -  │     Oui     │ 0.00              │ Espèces/Monnaie réelles dans le tiroir.
   ecart_caisse           │ DECIMAL(10,2)        │  -  │     Oui     │ 0.00              │ Différence (Reel - Théorique).
   motif_ecart            │ TEXT                 │  -  │     Non     │ NULL              │ Explication du caissier en cas d'écart.
   statut_session         │ ENUM(...)            │  -  │     Oui     │ 'OUVERTE'         │ État de la session (OUVERTE, CLOTUREE).

  ### Table vente

   Nom du Champ     │ Type de Donnée       │ Clé │ Obligatoire │ Valeur par … │ Description & Rôle Métier
  ──────────────────┼──────────────────────┼─────┼─────────────┼──────────────┼───────────────────────────────────────────────────
   id_vente         │ INT (Auto-incrément) │ PK  │     Oui     │ Auto         │ Identifiant de la vente.
   reference_ticket │ VARCHAR(60)          │ UK  │     Oui     │ -            │ Numéro de ticket de caisse imprimé.
   id_session       │ INT                  │ FK  │     Oui     │ -            │ Session de caisse dans laquelle la vente est
                    │                      │     │             │              │ faite.
   date_vente       │ TIMESTAMP            │  -  │     Oui     │ CURRENT_TIME │ Date et heure de validation du ticket.
                    │                      │     │             │ STAMP        │
   total_ht         │ DECIMAL(10,2)        │  -  │     Oui     │ -            │ Total HT de la vente.
   total_tva        │ DECIMAL(10,2)        │  -  │     Oui     │ -            │ Total TVA collectée sur la vente.
   total_ttc        │ DECIMAL(10,2)        │  -  │     Oui     │ -            │ Montant total TTC à régler par le client.
   marge_totale     │ DECIMAL(10,2)        │  -  │     Oui     │ -            │ Bénéfice brut généré par cette vente.
   statut_vente     │ ENUM(...)            │  -  │     Oui     │ 'VALIDEE'    │ Statut ticket (VALIDEE, ANNULEE, REMBOURSEE).

  ### Table ligne_vente

   Nom du Champ                   │ Type de Donnée       │ Clé │ Obligatoire │ Valeur par Défaut │ Description & Rôle Métier
  ────────────────────────────────┼──────────────────────┼─────┼─────────────┼───────────────────┼────────────────────────────────
   id_ligne_vente                 │ INT (Auto-incrément) │ PK  │     Oui     │ Auto              │ Identifiant de l'article sur
                                  │                      │     │             │                   │ le ticket.
   id_vente                       │ INT                  │ FK  │     Oui     │ -                 │ Ticket de vente rattaché.
   id_produit                     │ INT                  │ FK  │     Oui     │ -                 │ Produit vendu.
   quantite                       │ INT                  │  -  │     Oui     │ -                 │ Nombre d'unités vendues.
   prix_achat_unitaire_snapshot   │ DECIMAL(10,2)        │  -  │     Oui     │ -                 │ Prix d'achat unitaire au
                                  │                      │     │             │                   │ moment précis du passage en
                                  │                      │     │             │                   │ caisse.
   prix_vente_unitaire_ht_snapsho │ DECIMAL(10,2)        │  -  │     Oui     │ -                 │ Prix de vente HT au moment
   t                              │                      │     │             │                   │ précis du passage en caisse.
   taux_tva_snapshot              │ DECIMAL(4,2)         │  -  │     Oui     │ -                 │ Taux de TVA capturé.
   marge_unitaire                 │ DECIMAL(10,2)        │  -  │     Oui     │ -                 │ Marge brute unitaire calculée
                                  │                      │     │             │                   │ (Vente HT - Achat HT).
   total_ligne_ht                 │ DECIMAL(10,2)        │  -  │     Oui     │ -                 │ Total HT de la ligne (Prix
                                  │                      │     │             │                   │ Vente HT × Quantité).

  ### Table paiement

   Nom du Champ          │ Type de Donnée       │ Clé │ Obligatoire │ Valeur par Dé… │ Description & Rôle Métier
  ───────────────────────┼──────────────────────┼─────┼─────────────┼────────────────┼────────────────────────────────────────────
   id_paiement           │ INT (Auto-incrément) │ PK  │     Oui     │ Auto           │ Identifiant unique du règlement.
   id_vente              │ INT                  │ FK  │     Oui     │ -              │ Vente réglée.
   mode_paiement         │ ENUM(...)            │  -  │     Oui     │ -              │ Moyen utilisé (ESPECES, CARTE_BANCAIRE,
                         │                      │     │             │                │ MOBILE_MONEY, CHEQUE).
   montant               │ DECIMAL(10,2)        │  -  │     Oui     │ -              │ Somme réglée avec ce mode.
   reference_transaction │ VARCHAR(100)         │  -  │     Non     │ NULL           │ Référence du reçu CB / Transaction Mobile
                         │                      │     │             │                │ Money.
   date_paiement         │ TIMESTAMP            │  -  │     Oui     │ CURRENT_TIMEST │ Horodatage de l'encaissement.
                         │                      │     │             │ AMP            │
  ──────
   6. Bloc Finance & Consolidation

  ### Table cloture_journaliere

   Nom du Champ              │ Type de Donnée      │ Clé │ Obligatoire │ Valeur p… │ Description & Rôle Métier
  ───────────────────────────┼─────────────────────┼─────┼─────────────┼───────────┼──────────────────────────────────────────────
   id_cloture                │ INT (Auto-          │ PK  │     Oui     │ Auto      │ Identifiant du rapport financier figé.
                             │ incrément)          │     │             │           │
   date_cloture              │ DATE                │ UK  │     Oui     │ -         │ Date calendaire récapitulée (YYYY-MM-DD).
   chiffre_affaires_ht       │ DECIMAL(10,2)       │  -  │     Oui     │ -         │ Total CA Hors Taxe de la journée.
   chiffre_affaires_ttc      │ DECIMAL(10,2)       │  -  │     Oui     │ -         │ Total CA Toutes Taxes Comprises.
   tva_collectee             │ DECIMAL(10,2)       │  -  │     Oui     │ -         │ Montant total de la TVA collectée.
   benefice_brut_total       │ DECIMAL(10,2)       │  -  │     Oui     │ -         │ Marge commerciale / Bénéfice net brut
                             │                     │     │             │           │ réalisé.
   nombre_ventes             │ INT                 │  -  │     Oui     │ -         │ Nombre total de tickets validés dans la
                             │                     │     │             │           │ journée.
   nombre_articles_vendus    │ INT                 │  -  │     Oui     │ -         │ Volume total de pièces vendues.
   id_utilisateur_validation │ INT                 │ FK  │     Oui     │ -         │ Super Admin / Directeur ayant validé le
                             │                     │     │             │           │ rapport.
   date_validation           │ TIMESTAMP           │  -  │     Oui     │ CURRENT_T │ Heure exacte du figeage des comptes.
                             │                     │     │             │ IMESTAMP  │
