# Plan de Présentation et d'Adoption Utilisateur — Librairie Numérique (V1)

Ce document constitue le guide maître pour animer la session de présentation et de prise en main de l'application auprès des équipes (Caissiers, Gestionnaires de stock/catalogue, Administrateurs). L'objectif est de présenter les flux opérationnels de bout en bout et de structurer le recueil de retours d'expérience (UX, rapidité, blocages, suggestions).

---

## 1. Objectifs & Format de la Session

### 🎯 Objectifs
1. **Démontrer la valeur métier** : fluidification des ventes au comptoir, fiabilisation des stocks et visibilité en temps réel.
2. **Former par la pratique ("Learning by Doing")** : chaque participant manipule son propre poste avec des cas réels.
3. **Tester les flux critiques sous conditions réelles** (connexion, vente, clôture, réception fournisseur).
4. **Collecter les retours qualitatifs et quantitatifs** avant mise en production définitive.

### ⏱️ Format recommandé
* **Durée totale** : 1 demi-journée (~3h30 à 4h00).
* **Participants** :
  * Équipe Caisse (Caissiers / Vendeurs)
  * Équipe Gestion de Stock & Achats (Gestionnaires)
  * Responsable Magasin / Direction (Super Admins)
* **Matériel requis** :
  * Postes connectés à l'environnement de démo/pré-production.
  * Douchette/lecteur code-barres (si disponible).
  * Imprimante ticket de caisse / PDF virtuel.

---

## 2. Déroulement Chronologique de la Présentation

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Introduction & Vision Globale (20 min)                               │
│    Présentation de l'ERP, architecture, rôles & objectifs              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ 2. Démonstration de Bout en Bout par Rôle (60 min)                     │
│    Flux A : Gestionnaire (Produits, Fournisseurs, Stock, Réception)    │
│    Flux B : Caissier (Ouverture, Vente POS, Règlements, Clôture)       │
│    Flux C : Super Admin (Tableaux de bord, Finances, Utilisateurs)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ 3. Atelier Pratique & Scénarios Réels "Mains sur les touches" (75 min) │
│    Exercices guidés puis libres sur jeux de données tests              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ 4. Session Recueil des Retours & Débriefing (45 min)                   │
│    Questionnaire individuel + Tour de table interactif                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Guide Pas-à-Pas : Du Début à la Fin

### Module 1 : Authentification & Sécurité (Tous profils)
* **Écran** : `/login`
* **Actions à montrer & tester** :
  1. Connexion avec identifiants personnels (email/mot de passe).
  2. Présentation de la barre latérale dynamique (les menus s'adaptent selon les permissions du rôle connecté).
  3. Gestion du profil personnel (`/profil`) : changement de mot de passe, consultation des informations de compte.

---

### Module 2 : Flux Gestionnaire — Référencement, Approvisionnement & Stock
* **Profil ciblé** : `Gestionnaire` (Manager), `Super Admin`
* **Objectif** : Alimenter le magasin en articles et assurer la justesse des stocks.

#### Étape 2.1 — Référencement Fournisseur & Catalogue (`/fournisseurs` & `/produits`)
1. **Création d'un fournisseur** :
   * Nom, contact, coordonnées, conditions de paiement.
2. **Ajout d'un livre / article au catalogue** :
   * Renseignement des métadonnées : Titre, Auteur, ISBN/Code-barres, Catégorie/Genre, Éditeur.
   * Prix d'achat unitaire, Prix de vente public (TTC/HT), TVA applicable.
   * Définition du seuil d'alerte stock minimum.
   * Téléversement de l'image de couverture (via l'intégration Cloudinary optimisée).

#### Étape 2.2 — Entrées de Marchandises & Achats (`/achats` & `/stock`)
1. **Création d'un bon de commande fournisseur** :
   * Sélection des références, quantités commandées et coût d'achat convenu.
2. **Réception des articles** :
   * Validation de la réception partielle ou complète.
   * Constat de la mise à jour automatique des stocks disponibles.
3. **Mouvements & Alertes de Stock** (`/stock`) :
   * Consultation du registre des mouvements (Entrées, Sorties, Ajustements manuels).
   * Visualisation du badge d'alerte sur les articles en rupture ou sous le seuil critique.

#### Étape 2.3 — Inventaire physique & Régularisation (`/inventaire`)
1. Création d'une session d'inventaire.
2. Comptage réel vs stock théorique calculé par le logiciel.
3. Validation des écarts et ajustement automatique de l'état du stock avec motif traçable.

#### Étape 2.4 — Vitrine & Catalogue Public (`/gestion-catalogue`)
1. Sélection des articles à mettre en avant sur la vitrine publique.
2. Vérification du rendu sur la partie boutique / consultation client (`/`).

---

### Module 3 : Flux Vendeur / Caissier — Point de Vente (POS)
* **Profil ciblé** : `Caissier` (Cashier), `Super Admin`
* **Objectif** : Encaisser rapidement, limiter les erreurs de caisse et satisfaire le client en rayon.

#### Étape 3.1 — Prise de poste & Ouverture de Caisse (`/caisse`)
1. Déclaration du fond de caisse initial (espèces présentes dans le tiroir).
2. Vérification du statut de session ouverte.

#### Étape 3.2 — Conduite d'une Vente au Comptoir
1. **Recherche d'articles** :
   * Par scan code-barres (douchette) ou saisie rapide du titre / ISBN.
   * Ajustement direct des quantités, visualisation instantanée de la disponibilité.
2. **Gestion du panier client** :
   * Application d'une remise (ligne ou panier global) selon les règles autorisées.
   * Association éventuelle d'un client (fidélité / nom sur facture).
3. **Encaissement multi-moyens de paiement** :
   * Espèces (calcul automatique du rendu de monnaie).
   * Carte Bancaire.
   * Mobile Money ou paiement mixte (ex: moitié espèces, moitié Mobile Money).
4. **Finalisation & Ticket** :
   * Validation définitive et décrémentation instantanée du stock physique.
   * Impression du ticket de caisse / génération du reçu.

#### Étape 3.3 — Historique & Opérations Spéciales (`/ventes`)
1. Consultation des ventes de la journée.
2. Réimpression d'un ticket égaré.
3. Procédure d'annulation de vente ou retour d'article avec motif de réintégration au stock.

#### Étape 3.4 — Clôture de Caisse & Fin de Journée
1. Dénombrement des espèces physiques en caisse.
2. Rapprochement avec le chiffre d'affaires théorique calculé par le POS.
3. Justification des écarts éventuels et génération du rapport de clôture (Z de caisse).

---

### Module 4 : Flux Direction & Super Admin — Pilotage & Paramétrage
* **Profil ciblé** : `Super Admin`
* **Objectif** : Mesurer la rentabilité, superviser les collaborateurs et sécuriser la configuration.

#### Étape 4.1 — Tableau de bord & KPIs (`/dashboard`)
* Chiffre d'affaires journalier / mensuel.
* Nombre de ventes, panier moyen, top 5 des livres les plus vendus.
* Alertes immédiates de réapprovisionnement.

#### Étape 4.2 — Pilotage Financier & Rapports (`/finances`, `/rapports`)
* Détail des flux de trésorerie par mode d'encaissement.
* Export des états comptables (ventes, TVA collectée, valorisation du stock).

#### Étape 4.3 — Administration des comptes & Rôles (`/utilisateurs`, `/parametres`)
* Création d'un nouveau collaborateur et attribution du profil adéquat (`Caissier` ou `Gestionnaire`).
* Réinitialisation de mot de passe, désactivation d'accès.
* Configuration des coordonnées de la librairie, mentions légales sur les tickets.

---

## 4. Scénarios de Test Pratique (Atelier Utilisateurs)

Pour permettre au personnel de manipuler concrètement, distribuez ces 3 fiches de mise en situation :

| Scénario | Rôle | Action demandée | Résultat attendu |
|---|---|---|---|
| **#1 : Vente Express** | Caissier | 1. Ouvrir sa caisse avec 15 000 FCFA de fond.<br>2. Vendre 2 exemplaires du livre test "L'Enfant Noir".<br>3. Encaisser 10 000 FCFA en espèces et rendre la monnaie.<br>4. Imprimer le ticket. | Stock diminué de 2, montant en caisse mis à jour, ticket conforme. |
| **#2 : Nouvel Arrivage** | Gestionnaire | 1. Créer une nouvelle référence de livre avec sa photo de couverture.<br>2. Enregistrer une réception de 20 unités auprès d'un fournisseur.<br>3. Mettre l'article en avant sur le catalogue public. | Produit visible en stock avec quantité 20, présent sur le POS et sur la vitrine. |
| **#3 : Clôture & Contrôle** | Admin / Caissier | 1. Réaliser la clôture de caisse à la fin du service.<br>2. Contrôler les totaux dans le Dashboard d'administration.<br>3. Vérifier que les alertes de stock s'affichent correctement. | Rapport de clôture généré, Dashboard synchronisé sans décalage. |

---

## 5. Grille de Recueil des Retours (Fiche Évaluation Utilisateur)

Distribuez cette grille aux participants à l'issue de l'atelier pour collecter leurs avis :

### Critères d'Évaluation (Note de 1 à 5)
1. **Facilité de prise en main (Ergonomie)** :
   * *1 (Trop complexe) à 5 (Très intuitif)*
2. **Rapidité d'encaissement sur la caisse** :
   * *1 (Lenteur gênante) à 5 (Fluide et immédiat)*
3. **Clarté de la recherche de livres / catalogue** :
   * *1 (Difficile de trouver les livres) à 5 (Recherche rapide et précise)*
4. **Gestion des stocks et mouvements** :
   * *1 (Confus / Manque d'infos) à 5 (Clair et sécurisant)*
5. **Satisfaction globale pour un usage quotidien** :
   * *1 (Non prêt) à 5 (Prêt pour le travail quotidien)*

### Questions Ouvertes Spécifiques
* **Points forts** : *Quelles sont les fonctionnalités qui vont le plus vous faire gagner du temps ?*
* **Points de blocage / Frustrations** : *À quel moment avez-vous hésité ou rencontré une incompréhension ?*
* **Besoins manquants indispensables** : *Y a-t-il une règle métier ou un cas client imprévu qui manque absolument ?*
* **Lisibilité matérielle** : *La taille du texte et les boutons sont-ils adaptés à l'écran de caisse en magasin ?*

---

## 6. Prochaines Étapes Post-Présentation
1. **Consolidation des retours** : catégorisation en bugs critiques, améliorations ergonomiques mineures et évolutions futures (V2).
2. **Corrections prioritaires** : ajustements immédiats sur les points de friction remontés par les caissiers et gestionnaires.
3. **Mise à disposition du mémo plastifié** : création d'une fiche réflexe d'une page affichée à côté du poste de caisse (raccourcis et étapes clés).
4. **Lancement officiel en production**.
