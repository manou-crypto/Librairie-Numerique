# Analyse de la communication Frontend - Backend pour la gestion des produits

Le problème que tu rencontres ("le produit n'est pas ajouté dans la base de données") se situe **uniquement au niveau du frontend**. Le backend et la base de données (Prisma) fonctionnent correctement.

## Analyse du problème

J'ai analysé les requêtes et le code source de l'application, voici ce qui se passe :
1. **Lecture des produits (GET)** : Lors du chargement de la page, le frontend appelle bien l'API `/api/v1/produits` via un `fetch` dans `ProductManagementClient.tsx`. Les données sont correctement récupérées depuis le backend.
2. **Écriture et modification (POST, PUT, DELETE)** : Actuellement, le frontend **ne fait aucun appel API** lorsqu'on ajoute, modifie ou supprime un produit. 
   - Dans le fichier `ProductManagementClient.tsx`, les fonctions `handleSaveProduct`, `handleDeleteConfirm`, `handleBulkDelete` et `handleToggleVisible` se contentent de **mettre à jour l'état local React** (`setProducts`) et d'afficher une notification de succès (`toast.success`).
   - Le frontend ne contacte jamais le backend pour lui transmettre ces changements.
   - De plus, lors de l'ajout, le modal `AddEditProductModal.tsx` génère un faux ID local (ex: `p-1723315200000`) au lieu de laisser la base de données générer l'ID réel.
3. **Conséquence** : Tant qu'on ne rafraîchit pas la page, le produit semble exister (car il est dans la mémoire du navigateur). Dès qu'on rafraîchit, le frontend refait un `fetch` au backend qui lui renvoie les données réelles (sans le produit ajouté), et le produit "disparaît".

Le service `produitsService` (`src/services/produits.service.ts`) contient bien toutes les méthodes pour communiquer avec le backend (`create`, `update`, `masquer`, `delete`), mais elles ne sont pas utilisées dans les composants UI.

> [!IMPORTANT]
> Le backend NestJS dispose déjà de toutes les routes nécessaires (`POST /api/v1/produits`, `PUT /api/v1/produits/:id`, etc.) et elles sont correctement configurées pour enregistrer les données via Prisma. C'est uniquement le composant UI React qui doit être connecté à ces API.

## User Review Required

Ce plan implique de modifier la façon dont le frontend gère les requêtes.
Es-tu d'accord avec cette approche ? Une fois validé, j'exécuterai les modifications.

## Proposed Changes

### Frontend Next.js (Composants UI)

#### [MODIFY] [ProductManagementClient.tsx](file:///c:/dev/librairienumerique/frontend-nextjs/src/app/%28erp%29/produits/components/ProductManagementClient.tsx)
- Remplacer les modifications d'état local par des appels asynchrones utilisant `produitsService` (ou `fetch`).
- Pour `handleSaveProduct` : faire un `POST` si nouveau produit, ou un `PUT` si modification.
- Pour `handleDeleteConfirm` : faire un `DELETE` vers l'API.
- Pour `handleToggleVisible` : faire un appel `PATCH` pour masquer/afficher.
- Gérer l'état de chargement pendant ces opérations pour éviter le double-clic, et recharger la liste depuis le backend une fois l'opération terminée (ou mettre à jour l'état local avec la réponse du backend).

#### [MODIFY] [AddEditProductModal.tsx](file:///c:/dev/librairienumerique/frontend-nextjs/src/app/%28erp%29/produits/components/AddEditProductModal.tsx)
- Ne plus générer de faux ID (ex: `p-Date.now()`). Transmettre les données du formulaire nettoyées au composant parent pour qu'il gère l'appel API.
- Mapper correctement les champs du formulaire vers les propriétés attendues par le backend (ex: `name` -> `libelle`).

## Verification Plan

### Manual Verification
1. Ajouter un nouveau produit depuis l'interface utilisateur.
2. Vérifier que la requête POST part bien dans l'onglet Network du navigateur.
3. Rafraîchir la page et constater que le produit est toujours là.
4. Vérifier dans la base de données (ou via un appel API GET) que le produit a bien été persisté.
5. Effectuer des tests similaires pour la modification et la suppression.
