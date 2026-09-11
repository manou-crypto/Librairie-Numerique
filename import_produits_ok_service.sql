-- ====================================================================
-- SCRIPT D'INSERTION DES PRODUITS : LIBRAIRIE OK-SERVICE
-- Système : Librairie Numérique ERP / POS
-- Date : 10/09/2026
-- ====================================================================

-- 1. CRÉATION DES CATÉGORIES (si non existantes)
-- --------------------------------------------------------------------
INSERT INTO `categorie` (`id_categorie`, `nom`, `slug`, `id_categorie_parente`) VALUES
(1, 'Cahiers Écolier', 'cahiers-ecolier', NULL),
(2, 'Cahiers Étudiant', 'cahiers-etudiant', NULL),
(3, 'Cahiers Recherche', 'cahiers-recherche', NULL),
(4, 'Cahiers Travaux Pratiques', 'cahiers-travaux-pratiques', NULL),
(5, 'Matériel & Géométrie', 'materiel-geometrie', NULL),
(6, 'Cahiers d\'Écriture', 'cahiers-ecriture', NULL)
ON DUPLICATE KEY UPDATE `nom` = VALUES(`nom`);

-- 2. INSERTION DES PRODUITS
-- --------------------------------------------------------------------
INSERT INTO `produit` 
(`reference`, `code_barre`, `libelle`, `description`, `marque`, `unite`, `etat`, `prix_achat`, `prix_vente`, `taux_tva`, `statut_visibilite`, `date_creation`)
VALUES
-- Section : ECOLIER
('ECO-GUE-100P', '601000000001', 'Écolier GUERIER 100 Pages', 'Cahier écolier 100 pages marque GUERIER', 'GUERIER', 'Pièce', 'NEUF', 120.00, 175.00, 0.00, 'VISIBLE', NOW()),
('ECO-GUE-200P', '601000000002', 'Écolier GUERIER 200 Pages', 'Cahier écolier 200 pages marque GUERIER', 'GUERIER', 'Pièce', 'NEUF', 250.00, 350.00, 0.00, 'VISIBLE', NOW()),
('ECO-GUE-300P', '601000000003', 'Écolier GUERIER 300 Pages', 'Cahier écolier 300 pages marque GUERIER', 'GUERIER', 'Pièce', 'NEUF', 480.00, 650.00, 0.00, 'VISIBLE', NOW()),
('ECO-INT-100P', '601000000004', 'Écolier Intellectuel 100 pages', 'Cahier écolier 100 pages gamme Intellectuel', 'Intellectuel', 'Pièce', 'NEUF', 140.00, 200.00, 0.00, 'VISIBLE', NOW()),
('ECO-INT-200P', '601000000005', 'Écolier Intellectuel 200 pages', 'Cahier écolier 200 pages gamme Intellectuel', 'Intellectuel', 'Pièce', 'NEUF', 280.00, 400.00, 0.00, 'VISIBLE', NOW()),
('ECO-INT-300P', '601000000006', 'Écolier Intellectuel 300 pages', 'Cahier écolier 300 pages gamme Intellectuel', 'Intellectuel', 'Pièce', 'NEUF', 520.00, 700.00, 0.00, 'VISIBLE', NOW()),
('ECO-PRE-200P', '601000000007', 'Écolier PRESTIGE 200 pages', 'Cahier écolier 200 pages PRESTIGE', 'PRESTIGE', 'Pièce', 'NEUF', 280.00, 400.00, 0.00, 'VISIBLE', NOW()),
('ECO-PRI-100P', '601000000008', 'Écolier Privilège 100 pages', 'Cahier écolier 100 pages gamme Privilège', 'Privilège', 'Pièce', 'NEUF', 180.00, 250.00, 0.00, 'VISIBLE', NOW()),
('ECO-PRI-200P', '601000000009', 'Écolier Privilège 200 pages', 'Cahier écolier 200 pages gamme Privilège', 'Privilège', 'Pièce', 'NEUF', 370.00, 500.00, 0.00, 'VISIBLE', NOW()),
('ECO-PRI-300P', '601000000010', 'Écolier Privilège 300 pages', 'Cahier écolier 300 pages gamme Privilège', 'Privilège', 'Pièce', 'NEUF', 640.00, 850.00, 0.00, 'VISIBLE', NOW()),

-- Section : ÉTUDIANT
('ETU-MP-100PC', '601000000011', 'Cahiers Étudiant 100 pages Mon pays PC', 'Cahier grand format étudiant 100p Mon pays petits carreaux', 'Mon Pays', 'Pièce', 'NEUF', 370.00, 500.00, 0.00, 'VISIBLE', NOW()),
('ETU-MP-200PCGC', '601000000012', 'Cahiers Étudiant 200 pages Mon pays PC-GC', 'Cahier grand format étudiant 200p Mon pays PC/GC', 'Mon Pays', 'Pièce', 'NEUF', 750.00, 1000.00, 0.00, 'VISIBLE', NOW()),
('ETU-MP-300PCGC', '601000000013', 'Cahiers Étudiant 300 pages Mon pays PC-GC', 'Cahier grand format étudiant 300p Mon pays PC/GC', 'Mon Pays', 'Pièce', 'NEUF', 1050.00, 1400.00, 0.00, 'VISIBLE', NOW()),
('ETU-POL-200PCGC', '601000000014', 'Cahiers Étudiant 200 pages POLYPRO PC-GC', 'Cahier couverture polypropylène indéchirable 200p PC/GC', 'POLYPRO', 'Pièce', 'NEUF', 750.00, 1000.00, 0.00, 'VISIBLE', NOW()),
('ETU-POL-300PCGC', '601000000015', 'Cahiers Étudiant 300 pages POLYPRO PC-GC', 'Cahier couverture polypropylène indéchirable 300p PC/GC', 'POLYPRO', 'Pièce', 'NEUF', 980.00, 1300.00, 0.00, 'VISIBLE', NOW()),
('ETU-GUE-300PC', '601000000016', 'Cahiers Étudiant 300 pages Guerrier PC', 'Cahier grand format étudiant 300 pages marque Guerrier', 'Guerrier', 'Pièce', 'NEUF', 950.00, 1250.00, 0.00, 'VISIBLE', NOW()),

-- Section : ÉTUDIANT PRIVILÈGE
('ETU-PRI-200PCGC', '601000000017', 'Cahiers Étudiant 200 P PRIVILÈGE PC-GC', 'Cahier grand format étudiant 200 pages gamme Privilège', 'Privilège', 'Pièce', 'NEUF', 1050.00, 1400.00, 0.00, 'VISIBLE', NOW()),
('ETU-PRI-300PCGC', '601000000018', 'Cahiers Étudiant 300 P PRIVILÈGE PC-GC', 'Cahier grand format étudiant 300 pages gamme Privilège', 'Privilège', 'Pièce', 'NEUF', 1200.00, 1600.00, 0.00, 'VISIBLE', NOW()),

-- Section : RECHERCHE
('REC-100-PM', '601000000019', 'Cahiers RECHERCHE 100 pages PM', 'Cahier de recherche 100 pages petit modèle', 'Recherche', 'Pièce', 'NEUF', 370.00, 500.00, 0.00, 'VISIBLE', NOW()),
('REC-200-MM', '601000000020', 'Cahiers RECHERCHE 200 pages MM', 'Cahier de recherche 200 pages moyen modèle', 'Recherche', 'Pièce', 'NEUF', 680.00, 900.00, 0.00, 'VISIBLE', NOW()),
('REC-300-GM', '601000000021', 'Cahiers RECHERCHE 300 pages GM', 'Cahier de recherche 300 pages grand modèle', 'Recherche', 'Pièce', 'NEUF', 980.00, 1300.00, 0.00, 'VISIBLE', NOW()),

-- Section : TRAVAUX PRATIQUES
('TP-MP-100P', '601000000022', 'Cahiers TP 100 pages Mon Pays', 'Cahier de travaux pratiques 100 pages Mon Pays', 'Mon Pays', 'Pièce', 'NEUF', 350.00, 475.00, 0.00, 'VISIBLE', NOW()),
('TP-MP-200P', '601000000023', 'Cahiers TP 200 pages Mon Pays', 'Cahier de travaux pratiques 200 pages Mon Pays', 'Mon Pays', 'Pièce', 'NEUF', 720.00, 950.00, 0.00, 'VISIBLE', NOW()),
('TP-MP-300P', '601000000024', 'Cahiers TP 300 pages Mon Pays', 'Cahier de travaux pratiques 300 pages Mon Pays', 'Mon Pays', 'Pièce', 'NEUF', 1020.00, 1350.00, 0.00, 'VISIBLE', NOW()),
('TP-PRI-100P', '601000000025', 'Cahiers T.P Privilège 100 pages', 'Cahier de travaux pratiques 100 pages Privilège', 'Privilège', 'Pièce', 'NEUF', 370.00, 500.00, 0.00, 'VISIBLE', NOW()),
('TP-PRI-200P', '601000000026', 'Cahiers T.P Privilège 200 pages', 'Cahier de travaux pratiques 200 pages Privilège', 'Privilège', 'Pièce', 'NEUF', 900.00, 1200.00, 0.00, 'VISIBLE', NOW()),
('TP-PRI-300P', '601000000027', 'Cahiers T.P Privilège 300 pages', 'Cahier de travaux pratiques 300 pages Privilège', 'Privilège', 'Pièce', 'NEUF', 1320.00, 1750.00, 0.00, 'VISIBLE', NOW()),

-- Section : ENSEMBLE GÉOMÉTRIQUE & ÉCRITURE
('GEO-ENS-700', '601000000028', 'Ensemble géométrique (Petit Modèle)', 'Ensemble géométrique boîte de traçage scolaire', 'Standard', 'Pièce', 'NEUF', 500.00, 700.00, 0.00, 'VISIBLE', NOW()),
('GEO-ENS-900', '601000000029', 'Ensemble géométrique (Moyen Modèle)', 'Ensemble géométrique boîte de traçage complète', 'Standard', 'Pièce', 'NEUF', 680.00, 900.00, 0.00, 'VISIBLE', NOW()),
('GEO-ENS-1000', '601000000030', 'Ensemble géométrique (Grand Modèle Métal)', 'Ensemble géométrique boîte métallique deluxe', 'Standard', 'Pièce', 'NEUF', 750.00, 1000.00, 0.00, 'VISIBLE', NOW()),
('CAH-DBL-32P', '601000000031', 'Cahiers Double lignes 32 pages', 'Cahier d\'écriture double lignes pour débutants 32 pages', 'Standard', 'Pièce', 'NEUF', 70.00, 100.00, 0.00, 'VISIBLE', NOW())
ON DUPLICATE KEY UPDATE 
  `libelle` = VALUES(`libelle`),
  `prix_vente` = VALUES(`prix_vente`),
  `prix_achat` = VALUES(`prix_achat`),
  `marque` = VALUES(`marque`),
  `description` = VALUES(`description`);

-- 3. ASSOCIATION PRODUITS <-> CATÉGORIES
-- --------------------------------------------------------------------
-- Catégorie 1: Cahiers Écolier
INSERT IGNORE INTO `categorie_produit` (`id_produit`, `id_categorie`)
SELECT `id_produit`, 1 FROM `produit` WHERE `reference` LIKE 'ECO-%';

-- Catégorie 2: Cahiers Étudiant
INSERT IGNORE INTO `categorie_produit` (`id_produit`, `id_categorie`)
SELECT `id_produit`, 2 FROM `produit` WHERE `reference` LIKE 'ETU-%';

-- Catégorie 3: Cahiers Recherche
INSERT IGNORE INTO `categorie_produit` (`id_produit`, `id_categorie`)
SELECT `id_produit`, 3 FROM `produit` WHERE `reference` LIKE 'REC-%';

-- Catégorie 4: Cahiers Travaux Pratiques
INSERT IGNORE INTO `categorie_produit` (`id_produit`, `id_categorie`)
SELECT `id_produit`, 4 FROM `produit` WHERE `reference` LIKE 'TP-%';

-- Catégorie 5: Matériel & Géométrie
INSERT IGNORE INTO `categorie_produit` (`id_produit`, `id_categorie`)
SELECT `id_produit`, 5 FROM `produit` WHERE `reference` LIKE 'GEO-%';

-- Catégorie 6: Cahiers d'Écriture
INSERT IGNORE INTO `categorie_produit` (`id_produit`, `id_categorie`)
SELECT `id_produit`, 6 FROM `produit` WHERE `reference` = 'CAH-DBL-32P';

-- 4. INITIALISATION DES STOCKS POUR LA CAISSE (50 unités par produit, seuil alerte: 5)
-- --------------------------------------------------------------------
INSERT INTO `stock` (`id_produit`, `quantite_en_stock`, `seuil_alerte`, `date_derniere_entree`)
SELECT `id_produit`, 50, 5, NOW()
FROM `produit`
WHERE `reference` IN (
  'ECO-GUE-100P', 'ECO-GUE-200P', 'ECO-GUE-300P',
  'ECO-INT-100P', 'ECO-INT-200P', 'ECO-INT-300P',
  'ECO-PRE-200P',
  'ECO-PRI-100P', 'ECO-PRI-200P', 'ECO-PRI-300P',
  'ETU-MP-100PC', 'ETU-MP-200PCGC', 'ETU-MP-300PCGC',
  'ETU-POL-200PCGC', 'ETU-POL-300PCGC', 'ETU-GUE-300PC',
  'ETU-PRI-200PCGC', 'ETU-PRI-300PCGC',
  'REC-100-PM', 'REC-200-MM', 'REC-300-GM',
  'TP-MP-100P', 'TP-MP-200P', 'TP-MP-300P',
  'TP-PRI-100P', 'TP-PRI-200P', 'TP-PRI-300P',
  'GEO-ENS-700', 'GEO-ENS-900', 'GEO-ENS-1000',
  'CAH-DBL-32P'
)
ON DUPLICATE KEY UPDATE `quantite_en_stock` = VALUES(`quantite_en_stock`);
