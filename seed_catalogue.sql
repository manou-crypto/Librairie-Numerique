-- ============================================================================
-- SCRIPT DE PEUPLEMENT : CATÉGORIES & PRODUITS (Librairie Numérique ERP / POS)
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. VIDER LES TABLES CONCERNÉES POUR UN ÉTAT PROPRE
TRUNCATE TABLE `categorie_produit`;
TRUNCATE TABLE `stock`;
TRUNCATE TABLE `produit`;
TRUNCATE TABLE `categorie`;

-- 2. INSERTION DE L'ARBORESCENCE DES CATÉGORIES
-- Catégories parentes (Racines)
INSERT INTO `categorie` (`id_categorie`, `nom`, `slug`, `id_categorie_parente`) VALUES
(1, 'Livres', 'livres', NULL),
(2, 'Fournitures scolaires', 'fournitures-scolaires', NULL),
(3, 'Informatique', 'informatique', NULL),
(4, 'Bureautique', 'bureautique', NULL);

-- Sous-catégories
INSERT INTO `categorie` (`id_categorie`, `nom`, `slug`, `id_categorie_parente`) VALUES
-- Enfants de Livres (1)
(5, 'Romans & Littérature', 'romans-litterature', 1),
(6, 'Manuels scolaires', 'manuels-scolaires', 1),
(7, 'Développement Personnel', 'developpement-personnel', 1),
-- Enfants de Fournitures scolaires (2)
(8, 'Cahiers & Carnets', 'cahiers-carnets', 2),
(9, 'Stylos & Écriture', 'stylos-ecriture', 2),
-- Enfants de Informatique (3)
(10, 'Stockage & Clés USB', 'stockage-usb', 3),
(11, 'Périphériques & Accessoires', 'peripheriques-accessoires', 3),
-- Enfants de Bureautique (4)
(12, 'Classement & Archivage', 'classement-archivage', 4),
(13, 'Papier & Impression', 'papier-impression', 4);

-- 3. INSERTION DES PRODUITS DU CATALOGUE
INSERT INTO `produit` (
  `id_produit`, `reference`, `code_barre`, `libelle`, `description`,
  `marque`, `unite`, `poids`, `etat`, `prix_achat`, `prix_vente`,
  `taux_tva`, `statut_visibilite`, `date_creation`
) VALUES
-- Livres > Romans
(1, 'LIV-ROM-001', '9782070360024', 'L\'Étranger - Albert Camus', 'Édition poche Folio. Chef-d\'œuvre classique.', 'Gallimard', 'Pièce', 0.15, 'NEUF', 2500.00, 4500.00, 0.00, 'VISIBLE', NOW()),
(2, 'LIV-ROM-002', '9782708705395', 'Les Soleils des Indépendances', 'Roman d\'Ahmadou Kourouma au programme.', 'Seuil', 'Pièce', 0.20, 'NEUF', 3000.00, 5200.00, 0.00, 'VISIBLE', NOW()),
(3, 'LIV-ROM-003', '9782266280456', 'Le Petit Prince', 'Antoine de Saint-Exupéry, version classique.', 'Pocket', 'Pièce', 0.12, 'NEUF', 2000.00, 3500.00, 0.00, 'VISIBLE', NOW()),

-- Livres > Manuels scolaires
(4, 'LIV-SCO-001', '9782841295600', 'Mathématiques CIAM Terminale SM', 'Manuel conforme au programme scientifique.', 'Édices', 'Pièce', 0.65, 'NEUF', 5000.00, 7500.00, 0.00, 'VISIBLE', NOW()),
(5, 'LIV-SCO-002', '9782841295617', 'Physique-Chimie 3ème Collection AREX', 'Manuel officiel avec exercices corrigés.', 'CEDA / Hatier', 'Pièce', 0.45, 'NEUF', 4000.00, 6000.00, 0.00, 'VISIBLE', NOW()),

-- Livres > Développement Personnel
(6, 'LIV-DEV-001', '9782290028247', 'Père Riche, Père Pauvre', 'Robert T. Kiyosaki - Éducation financière.', 'J\'ai Lu', 'Pièce', 0.30, 'NEUF', 4500.00, 8000.00, 0.00, 'VISIBLE', NOW()),
(7, 'LIV-DEV-002', '9782848995328', 'L\'Art subtil de s\'en foutre', 'Mark Manson - Guide à contre-courant.', 'Eyrolles', 'Pièce', 0.28, 'NEUF', 4800.00, 8500.00, 0.00, 'VISIBLE', NOW()),

-- Fournitures > Cahiers
(8, 'PAP-CAH-001', '6012345678901', 'Cahier Grand Format 200p Seyès', 'Format 24x32 cm, grands carreaux.', 'Oxford / Top', 'Pièce', 0.35, 'NEUF', 700.00, 1200.00, 18.00, 'VISIBLE', NOW()),
(9, 'PAP-CAH-002', '6012345678902', 'Carnet Piqué A5 96p Petits Carreaux', 'Couverture rigide pelliculée brillante.', 'Clairefontaine', 'Pièce', 0.15, 'NEUF', 450.00, 800.00, 18.00, 'VISIBLE', NOW()),

-- Fournitures > Stylos & Écriture
(10, 'PAP-STY-001', '3086126600213', 'Boîte de 50 Stylos Bille BIC Cristal Bleu', 'Stylo à bille classique pointe moyenne 1.0 mm.', 'BIC', 'Boîte', 0.30, 'NEUF', 4500.00, 7000.00, 18.00, 'VISIBLE', NOW()),
(11, 'PAP-STY-002', '4005401100010', 'Surligneur Stabilo Boss Jaune Fluo', 'Surligneur pointe biseautée longue durée.', 'Stabilo', 'Pièce', 0.04, 'NEUF', 350.00, 600.00, 18.00, 'VISIBLE', NOW()),

-- Informatique > Stockage
(12, 'INF-STO-001', '6196591823451', 'Clé USB 64 Go SanDisk Ultra Dual Type-C', 'Double connecteur USB Type-C & Type-A 3.1.', 'SanDisk', 'Pièce', 0.02, 'NEUF', 4200.00, 7500.00, 18.00, 'VISIBLE', NOW()),

-- Informatique > Périphériques
(13, 'INF-PER-001', '0978551487210', 'Souris Sans Fil Optique Logitech M185', 'Souris ergonomique avec nano-récepteur USB.', 'Logitech', 'Pièce', 0.10, 'NEUF', 5500.00, 9500.00, 18.00, 'VISIBLE', NOW()),

-- Bureautique > Classement
(14, 'BUR-CLA-001', '3130630132145', 'Classeur à Levier Dos 80mm A4 Pro', 'Classeur rigide avec renfort métallique.', 'Exacompta', 'Pièce', 0.40, 'NEUF', 1200.00, 2000.00, 18.00, 'VISIBLE', NOW()),

-- Bureautique > Papier & Impression
(15, 'BUR-PAP-001', '8851907001018', 'Rame Papier A4 80g Double A (500f)', 'Papier blanc haute blancheur pour imprimante.', 'Double A', 'Rame', 2.50, 'NEUF', 2800.00, 4200.00, 18.00, 'VISIBLE', NOW()),

-- Article Masqué pour tester le filtre de visibilité
(16, 'LIV-ARC-001', '9782070369999', 'Dictionnaire Latin-Français Ancien', 'Article archivé masqué au public.', 'Hachette', 'Pièce', 0.80, 'OCCASION', 1500.00, 3000.00, 0.00, 'MASQUE', NOW());

-- 4. ASSOCIATION PRODUIT <-> CATÉGORIES (Parent & Sous-catégories)
INSERT INTO `categorie_produit` (`id_produit`, `id_categorie`) VALUES
-- Romans (cat 1 + cat 5)
(1, 1), (1, 5),
(2, 1), (2, 5),
(3, 1), (3, 5),
-- Scolaires (cat 1 + cat 6)
(4, 1), (4, 6),
(5, 1), (5, 6),
-- Dév Personnel (cat 1 + cat 7)
(6, 1), (6, 7),
(7, 1), (7, 7),
-- Cahiers (cat 2 + cat 8)
(8, 2), (8, 8),
(9, 2), (9, 8),
-- Stylos (cat 2 + cat 9)
(10, 2), (10, 9),
(11, 2), (11, 9),
-- Stockage (cat 3 + cat 10)
(12, 3), (12, 10),
-- Périphériques (cat 3 + cat 11)
(13, 3), (13, 11),
-- Classement (cat 4 + cat 12)
(14, 4), (14, 12),
-- Papier (cat 4 + cat 13)
(15, 4), (15, 13),
-- Dictionnaire archivé (cat 1 + cat 6)
(16, 1), (16, 6);

-- 5. INITIALISATION DU STOCK POUR TOUS LES ARTICLES
INSERT INTO `stock` (`id_produit`, `quantite_en_stock`, `seuil_alerte`, `date_derniere_entree`) VALUES
(1, 45, 5, NOW()),
(2, 28, 5, NOW()),
(3, 60, 10, NOW()),
(4, 18, 5, NOW()),
(5, 3, 5, NOW()),     -- En alerte (3 <= 5)
(6, 0, 5, NOW()),     -- En rupture (0)
(7, 2, 5, NOW()),     -- En alerte (2 <= 5)
(8, 150, 20, NOW()),
(9, 40, 10, NOW()),
(10, 30, 5, NOW()),
(11, 4, 10, NOW()),   -- En alerte (4 <= 10)
(12, 25, 5, NOW()),
(13, 2, 4, NOW()),    -- En alerte (2 <= 4)
(14, 0, 8, NOW()),    -- En rupture (0)
(15, 85, 15, NOW()),
(16, 1, 2, NOW());

SET FOREIGN_KEY_CHECKS = 1;

-- 6. RÉCAPITULATIF DE CONTRÔLE
SELECT 'Catégories et produits initialisés avec succès !' AS `Message`,
       (SELECT COUNT(*) FROM `categorie`) AS `Categories_Total`,
       (SELECT COUNT(*) FROM `produit`) AS `Produits_Total`,
       (SELECT COUNT(*) FROM `stock` WHERE `quantite_en_stock` = 0) AS `Produits_En_Rupture`,
       (SELECT COUNT(*) FROM `stock` WHERE `quantite_en_stock` > 0 AND `quantite_en_stock` <= `seuil_alerte`) AS `Produits_En_Alerte`,
       (SELECT COUNT(*) FROM `produit` WHERE `statut_visibilite` = 'VISIBLE') AS `Produits_Actifs`,
       (SELECT COUNT(*) FROM `produit` WHERE `statut_visibilite` = 'MASQUE') AS `Produits_Masques`;
