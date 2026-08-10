PLAN GÉNÉRAL DU PROJET
LIBRAIRIE NUMÉRIQUE
PHASE 1 : ANALYSE DU PROJET ✅
1.1 Compréhension du besoin ✅

Cette première étape a permis de définir les bases du projet.

Définition du problème
Objectifs du projet
Identification du public cible
Analyse des besoins fonctionnels et non fonctionnels

Livrable : Analyse du besoin.

1.2 Cahier des charges ✅

Le cahier des charges a été élaboré en tenant compte de l'ensemble des exigences du projet.

Il comprend notamment :

Les fonctionnalités attendues
Les règles de gestion
Les contraintes techniques
Les contraintes fonctionnelles
Les évolutions futures (commande en ligne, espace client, etc.)
Le périmètre du projet

Livrable : Cahier des charges validé.

1.3 Choix des technologies ✅

Après comparaison des différentes technologies, la stack suivante a été retenue.

Frontend
Next.js
Backend
NestJS
Base de données
MySQL
ORM
Prisma
Déploiement
Docker
Nginx
Linux

Livrable : Architecture technologique validée.

PHASE 2 : CONCEPTION

Cette phase consiste à transformer les besoins exprimés dans le cahier des charges en une architecture technique prête à être développée.

2.1 Conception de la base de données ✅

La base de données a été conçue progressivement en suivant une démarche méthodique.

Les principales étapes ont été :

Étape 1 : Identification des entités

Les principales entités ont été définies :

Utilisateur
Rôle
Permission
Produit
Catégorie
Fournisseur
Achat
Ligne d'achat
Stock
Mouvement de stock
Inventaire
Ligne d'inventaire
Vente
Ligne de vente
Paiement
Caisse
Session de caisse
Clôture journalière
Historique des prix
Journal d'audit
etc.
Étape 2 : Définition des attributs

Pour chaque entité ont été définis :

les attributs
leur type
leur description
leur caractère obligatoire ou facultatif
Étape 3 : Définition des relations

Toutes les relations entre les entités ont été établies conformément aux règles de gestion.

Étape 4 : Définition des cardinalités

Les cardinalités de chaque relation ont été définies afin d'assurer la cohérence du modèle de données.

Étape 5 : Réalisation du diagramme EER ✅

Le modèle conceptuel de la base de données a été réalisé sous MySQL Workbench.

Il représente :

les entités
les attributs
les clés primaires
les clés étrangères
les relations
les cardinalités
Étape 6 : Validation du modèle ✅

Le modèle de données a été vérifié et validé.

La conception de la base de données est désormais terminée.

Livrables :

Script SQL complet
Diagramme EER
Dictionnaire des données
2.2 Conception UML ✅

Afin de représenter le fonctionnement global du système, plusieurs diagrammes UML ont été réalisés.

Ils permettent de modéliser :

les acteurs
les cas d'utilisation
les interactions
l'organisation générale de l'application

Livrables :

Diagramme de cas d'utilisation
Diagrammes UML retenus pour le projet

2.3 Architecture logicielle ✅

Cette étape consistera à définir l'organisation générale de l'application.

Elle comprendra notamment :

Architecture globale
Organisation du Backend NestJS
Organisation du Frontend Next.js
Communication via API REST
Structure des modules
Organisation des dossiers

Livrable :

Schéma complet de l'architecture logicielle.

2.4 Maquettage des interfaces ⏳

Les principales interfaces de l'application seront conçues avant le développement.

Les maquettes porteront notamment sur :

Page d'accueil
Connexion
Tableau de bord
Gestion des produits
Gestion des catégories
Gestion des fournisseurs
Gestion des stocks
Gestion des ventes
Gestion des caisses
Rapports et statistiques

Livrable :

Maquettes fonctionnelles de l'application.

PHASE 3 : DÉVELOPPEMENT ⏳

Le développement sera réalisé progressivement, module par module.

Ordre prévu :

Module 1

Authentification

Module 2

Gestion des utilisateurs

Module 3

Gestion du catalogue

Module 4

Gestion des fournisseurs

Module 5

Gestion des achats

Module 6

Gestion des stocks

Module 7

Gestion des inventaires

Module 8

Gestion des ventes

Module 9

Gestion des paiements

Module 10

Gestion des caisses

Module 11

Tableau de bord

Module 12

Rapports et statistiques

PHASE 4 : TESTS ⏳

Une fois le développement terminé, plusieurs séries de tests seront réalisées.

Tests fonctionnels
Tests d'intégration
Vérification des règles métier
Validation des calculs
Correction des anomalies

Livrable :

Rapport de tests.

PHASE 5 : DÉPLOIEMENT ⏳

L'application sera préparée pour une mise en production.

Les technologies retenues sont :

Docker
Nginx
Linux

Le déploiement pourra être réalisé sur une plateforme compatible telle que :

Render
Railway
AWS
Azure
VPS Linux

Livrable :

Application déployée.

PHASE 6 : RÉDACTION DU RAPPORT DE STAGE ⏳

Grâce aux livrables produits tout au long du projet, la rédaction du rapport sera facilitée.

Le rapport comprendra notamment :

Présentation de l'entreprise
Contexte du projet
Analyse des besoins
Cahier des charges
Choix technologiques
Conception de la base de données
Diagrammes UML
Architecture logicielle
Développement
Tests
Déploiement
Résultats obtenus
Difficultés rencontrées
Perspectives d'évolution

Livrable :

Rapport de stage finalisé.