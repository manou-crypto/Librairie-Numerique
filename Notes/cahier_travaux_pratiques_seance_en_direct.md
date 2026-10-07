# Cahier de Travaux Pratiques en Direct — Prise en Main & Retours
## Application « Librairie Numérique » (ERP & Point de Vente)

Ce livret est conçu pour être **suivi en direct, étape par étape, écran par écran**, par les participants pendant la séance de prise en main. Chaque étape indique **où cliquer**, **quoi saisir**, **ce qu'il faut observer**, et offre un **espace de retour immédiat**.

---

## 📋 Informations de la Session de Test

* **Nom du participant** : ___________________________
* **Rôle testé** : [ ] Caissier & Vendeur  |  [ ] Gestionnaire de Stock & Catalogue  |  [ ] Super Administrateur
* **Poste / Machine n°** : _________
* **Date** : ____ / ____ / ________

---

## Sommaire du Déroulé Pas-à-Pas

1. [Étape 0 : Connexion & Découverte de l'Espace](#étape-0--connexion--découverte-de-lespace)
2. [Étape 1 : Référencer un Livre avec Couverture Photo](#étape-1--référencer-un-livre-avec-couverture-photo)
3. [Étape 2 : Approvisionnement & Gestion Réserve / Étal](#étape-2--approvisionnement--gestion-réserve--étal)
4. [Étape 3 : Vitrine & Visibilité du Catalogue Public](#étape-3--vitrine--visibilité-du-catalogue-public)
5. [Étape 4 : Prise de Poste & Ouverture de Caisse](#étape-4--prise-de-poste--ouverture-de-caisse)
6. [Étape 5 : Vente Comptoir #1 — Espèces & Rendu de Monnaie](#étape-5--vente-comptoir-1--espèces--rendu-de-monnaie)
7. [Étape 6 : Vente Comptoir #2 — Mobile Money / Mixte & Remise](#étape-6--vente-comptoir-2--mobile-money--mixte--remise)
8. [Étape 7 : Historique, Annulation ou Réimpression](#étape-7--historique-annulation-ou-réimpression)
9. [Étape 8 : Contrôle d'Inventaire & Régularisation](#étape-8--contrôle-dinventaire--régularisation)
10. [Étape 9 : Clôture de Caisse & Rapprochement Financier](#étape-9--clôture-de-caisse--rapprochement-financier)
11. [Fiche Finale d'Évaluation & Suggestions](#fiche-finale-dévaluation--suggestions)

---

### Étape 0 : Connexion & Découverte de l'Espace
*Objectif : Vérifier l'accès, les identifiants et l'adaptation du menu selon votre profil.*

| Action à réaliser | Détail de la manipulation | Ce que vous devez observer |
|---|---|---|
| **0.1 Naviguer** | Ouvrir le navigateur et aller sur `/login` | Écran de connexion épuré avec logo de la Librairie |
| **0.2 S'identifier** | Saisir votre email de test et votre mot de passe, puis cliquer sur **Se connecter** | Redirection fluide vers le tableau de bord ou la caisse |
| **0.3 Observer le menu** | Regarder la barre latérale gauche (Sidebar) | Vos modules autorisés s'affichent (Ventes, Stock, Gestion...) |

> 💬 **Votre avis immédiat** :
> * La connexion s'est-elle faite sans confusion ? [ ] OUI  [ ] NON
> * *Remarque éventuelle* : __________________________________________________

---

### Étape 1 : Référencer un Livre avec Couverture Photo
*Objectif : Enregistrer un nouvel ouvrage au catalogue avec toutes ses caractéristiques.*

* **Menu** : Cliquez sur **`Produits & Catalogue`** (`/produits`)
* **Action** : Cliquez sur le bouton bleu **`+ Nouveau Produit`**

#### Saisie du formulaire test :
* **Titre / Libellé** : `Le Petit Prince - Édition Spéciale`
* **Référence / Code-barres** : `9782070612758` (ou scannez un code-barres test)
* **Catégorie** : Sélectionnez `Livres` (ou Romans / Jeunesse)
* **Prix d'Achat** : `2 500` FCFA
* **Prix de Vente Public** : `4 500` FCFA
* **TVA** : `0%` (ou selon configuration)
* **Stock Minimum d'Alerte** : `5`
* **Image de couverture** : Cliquez sur **Téléverser / Changer l'image**, choisissez une photo sur l'ordinateur, puis validez le widget Cloudinary.
* Cliquez sur **`Enregistrer le produit`**.

> 👁️ **À vérifier** :
> - [ ] Le livre apparaît immédiatement dans la liste des produits avec son image miniature.
> - [ ] Les prix et la référence sont exacts.
>
> 💬 **Votre avis immédiat** :
> * *L'ajout de photo et la saisie des champs sont-ils rapides et clairs ?*
> * Note : ⭐⭐⭐⭐⭐ ( / 5) — *Commentaire* : __________________________________

---

### Étape 2 : Approvisionnement & Gestion Réserve / Étal
*Objectif : Faire entrer du stock physique et transférer des exemplaires sur le rayon de vente.*

* **Menu** : Cliquez sur **`Stock`** (`/stock`)

#### 2.1 Approvisionner du stock
1. Repérez votre livre `Le Petit Prince - Édition Spéciale`.
2. Cliquez sur l'action d'approvisionnement ou **`Ajouter du stock`**.
3. **Quantité reçue** : `20` exemplaires.
4. **Motif** : `Arrivage Fournisseur Test`. Validez.
5. *Observation* : Le stock global passe à **20** avec le badge de statut vert **Normal**.

#### 2.2 Transférer de la Réserve vers l'Étal (Rayon comptoir)
1. Cliquez sur le bouton de transfert `⇄` (Transfert Étal).
2. Choisissez l'option : **Réserve vers Étal**.
3. **Quantité à déplacer** : `12` exemplaires.
4. Cliquez sur **`Confirmer le transfert`**.
5. *Observation* : 
   * Réserve : **8**
   * Étal (au comptoir) : **12**
   * Total disponible : **20**

> 💬 **Votre avis immédiat** :
> * La séparation Réserve / Étal est-elle utile pour votre organisation quotidienne ?
> * [ ] Indispensable  [ ] Utile  [ ] Trop complexe
> * *Commentaire* : __________________________________________________

---

### Étape 3 : Vitrine & Visibilité du Catalogue Public
*Objectif : Décider ce que les clients peuvent voir en ligne.*

* **Menu** : Cliquez sur **`Gestion Catalogue`** (`/gestion-catalogue`)

1. Localisez `Le Petit Prince - Édition Spéciale` dans le tableau.
2. Basculez l'interrupteur ou statut sur **`Visible en vitrine`**.
3. Cliquez sur le bouton en haut **`Consulter le Catalogue public`** (ou ouvrez un onglet sur `/catalogue`).
4. Vérifiez que la couverture, le titre et le prix s'affichent impeccablement pour un visiteur public.

> 💬 **Votre avis immédiat** :
> * L'affichage public reflète-t-il bien l'image de la librairie ?
> * Note : ⭐⭐⭐⭐⭐ ( / 5) — *Commentaire* : __________________________________

---

### Étape 4 : Prise de Poste & Ouverture de Caisse
*Objectif : Démarrer son quart de travail au comptoir.*

* **Menu** : Cliquez sur **`Point de vente`** (`/caisse`)

1. Si la caisse est fermée, une fenêtre **« Ouverture de Caisse »** s'affiche.
2. **Fond de caisse initial** : Tapez `25 000` FCFA (les espèces dans le tiroir au démarrage).
3. Cliquez sur **`Ouvrir la session de caisse`**.
4. *Observation* : L'écran du terminal POS s'active, avec la barre de recherche, la grille des articles et le panier à droite.

> 💬 **Votre avis immédiat** :
> * L'ouverture de session est-elle claire et rapide ? [ ] OUI  [ ] NON

---

### Étape 5 : Vente Comptoir #1 — Espèces & Rendu de Monnaie
*Objectif : Encaisser un client pressé avec paiement en liquide.*

1. **Recherche du livre** :
   * Dans la barre de recherche, tapez `Petit Prince` (ou scannez son code-barres).
   * Cliquez sur le livre pour l'ajouter au panier.
2. **Quantité** :
   * Cliquez sur le bouton `+` pour passer à **2** exemplaires.
   * Total affiché dans le panier : `9 000 FCFA` (2 × 4 500).
3. **Paiement** :
   * Cliquez sur le bouton vert **`Encaisser (9 000 FCFA)`**.
   * Dans le modal de règlement, sélectionnez l'onglet **Espèces**.
   * Le client vous donne un billet de `10 000 FCFA`. Tapez `10 000` dans le champ "Montant reçu".
   * *Observation* : Le logiciel calcule immédiatement : **Monnaie à rendre = 1 000 FCFA**.
4. **Finalisation** :
   * Cliquez sur **`Valider la vente`**.
   * L'aperçu du ticket de caisse apparaît instantanément.
   * Cliquez sur **`Imprimer le ticket`** (ou fermez la fenêtre après vérification).

> 👁️ **Contrôle Stock immédiat** :
> * Retournez rapidement dans **`Stock`** : le stock d'étal a-t-il bien diminué de 2 unités (12 ➔ 10) ? [ ] OUI  [ ] NON
>
> 💬 **Votre avis immédiat** :
> * Rapidité du processus de vente au comptoir :
> * Note : ⭐⭐⭐⭐⭐ ( / 5) — *Temps ressenti : [ ] Très rapide  [ ] Moyen  [ ] Trop long*

---

### Étape 6 : Vente Comptoir #2 — Mobile Money / Mixte & Remise
*Objectif : Gérer une vente avec remise commerciale et paiement numérique.*

1. Sur le terminal de caisse (`/caisse`), ajoutez un ou deux articles différents dans le panier.
2. **Remise** : Appliquez une remise promotionnelle (ex: `10%` ou `500 FCFA`).
3. **Encaissement mixte ou Mobile Money** :
   * Cliquez sur **`Encaisser`**.
   * Choisissez le mode **Mobile Money** (Wave / Orange Money / MTN) ou saisissez un paiement partagé (ex: 50% Mobile Money + reste Espèces).
   * Entrez la référence de transaction reçue par SMS.
4. Cliquez sur **`Valider la vente`**.

> 💬 **Votre avis immédiat** :
> * La gestion des paiements mobiles et des remises est-elle simple à manipuler avec un client devant soi ?
> * Note : ⭐⭐⭐⭐⭐ ( / 5) — *Remarque* : __________________________________

---

### Étape 7 : Historique, Annulation ou Réimpression
*Objectif : Traiter une demande client après l'achat (perte de ticket ou retour).*

* **Menu** : Cliquez sur **`Historique ventes`** (`/ventes`)

1. Retrouvez les 2 ventes que vous venez de réaliser en tête de liste.
2. Cliquez sur l'icône **Détail / Oeil** pour voir les lignes du panier.
3. Cliquez sur **`Réimprimer le ticket`** : vérifiez que les détails sont identiques.
4. Testez la procédure d'avoir / retour partiel ou annulation (si autorisée sur votre profil).

> 💬 **Votre avis immédiat** :
> * La recherche dans l'historique est-elle assez claire en cas de litige client ?
> * [ ] Très claire  [ ] Moyenne  [ ] Difficile

---

### Étape 8 : Contrôle d'Inventaire & Régularisation
*Objectif : Effectuer un comptage physique et ajuster les écarts constatés.*

* **Menu** : Cliquez sur **`Inventaire`** (`/inventaire`)

1. Cliquez sur **`Nouvelle Session d'Inventaire`**.
2. Sélectionnez le périmètre : **Étal (Magasin)**.
3. Recherchez `Le Petit Prince - Édition Spéciale` :
   * Stock théorique attendu par l'ordinateur : `10`.
   * Simulez un comptage réel en rayon : saisissez `9` (un livre a été égaré ou abîmé).
4. *Observation* : Le logiciel affiche un écart de `-1 exemplaire` en rouge.
5. Saisissez une observation : `Exemplaire de démonstration abîmé`.
6. Cliquez sur **`Valider et clôturer l'inventaire`**.
7. *Vérification* : Le stock réel passe automatiquement à 9 sans blocage.

> 💬 **Votre avis immédiat** :
> * Cette façon de faire l'inventaire vous semble-t-elle sécurisante contre les erreurs ?
> * Note : ⭐⭐⭐⭐⭐ ( / 5) — *Commentaire* : __________________________________

---

### Étape 9 : Clôture de Caisse & Rapprochement Financier
*Objectif : Terminer la journée de vente et vérifier la comptabilité.*

* **Menu** : Rendez-vous sur le **`Point de vente`** (`/caisse`)

1. Cliquez sur le bouton rouge en haut à droite **`Clôturer la Caisse`** (ou Rapport Caisse).
2. La fenêtre récapitule :
   * Fond de caisse initial : `25 000 FCFA`
   * Ventes en espèces enregistrées
   * Ventes Mobile Money / Cartes
   * **Total attendu dans le tiroir-caisse**.
3. Saisissez le montant réel compté dans le tiroir.
4. Validez la clôture : le rapport Z de caisse est généré.
5. Allez sur **`Tableau de bord`** (`/dashboard`) pour voir l'impact immédiat sur le chiffre d'affaires du jour.

> 💬 **Votre avis immédiat** :
> * Le rapport de clôture donne-t-il toutes les informations nécessaires pour la comptabilité ?
> * [ ] OUI  [ ] NON  (Si NON, que manque-t-il ? : ______________________________)

---

## 📝 Fiche Finale d'Évaluation & Suggestions

*À remplir par le participant à la fin de la séance pratique :*

### 1. Notes d'appréciation générale (de 1 à 5 étoiles)
* Ergonomie visuelle & lisibilité des écrans : ⭐⭐⭐⭐⭐
* Rapidité et fluidité pour servir un client : ⭐⭐⭐⭐⭐
* Facilité pour gérer le stock et les réceptions : ⭐⭐⭐⭐⭐
* Clarté du passage de caisse et de la clôture : ⭐⭐⭐⭐⭐

### 2. Vos 3 fonctionnalités préférées :
1. ____________________________________________________________________
2. ____________________________________________________________________
3. ____________________________________________________________________

### 3. Les points à corriger ou simplifier avant l'ouverture :
* 🔴 **Point bloquant ou gênant** : ________________________________________
* 🟡 **Suggestion d'amélioration de confort** : ___________________________
* 🟢 **Bouton ou raccourci manquant** : ___________________________________

---
*Merci pour votre contribution active à la réussite du lancement de la Librairie Numérique !*
