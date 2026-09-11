-- ====================================================================
-- SCRIPT D'INSERTION DES PRODUITS : PAGE 2 (COLLE, CARNETS, CRAIE, GÉOMÉTRIE, REGISTRES)
-- Système : Librairie Numérique ERP / POS
-- Date : 10/09/2026
-- ====================================================================

-- 1. CRÉATION DES NOUVELLES CATÉGORIES
-- --------------------------------------------------------------------
INSERT INTO `categorie` (`nom`, `slug`, `id_categorie_parente`) VALUES
('Colles & Adhésifs', 'colles-adhesifs', NULL),
('Carnets de Notes', 'carnets-de-notes', NULL),
('Craies Scolaires', 'craies-scolaires', NULL),
('Matériel & Géométrie', 'materiel-geometrie', NULL),
('Registres', 'registres', NULL)
ON DUPLICATE KEY UPDATE `nom` = VALUES(`nom`);

-- 2. INSERTION DES PRODUITS
-- --------------------------------------------------------------------
INSERT INTO `produit` 
(`reference`, `code_barre`, `libelle`, `description`, `marque`, `unite`, `etat`, `prix_achat`, `prix_vente`, `taux_tva`, `statut_visibilite`, `date_creation`)
VALUES
-- Section : COLLE
('COL-BOBO', '601000000101', 'COLLE bobo', 'Colle liquide pour écolier marque Bobo', 'Bobo', 'Pièce', 'NEUF', 350.00, 500.00, 0.00, 'VISIBLE', NOW()),
('COL-FORTE', '601000000102', 'Colle forte', 'Colle forte multi-usages séchage rapide', 'Standard', 'Pièce', 'NEUF', 700.00, 1000.00, 0.00, 'VISIBLE', NOW()),
('COL-TETE-BLEU', '601000000103', 'COLLE TÊTE BLEU', 'Colle scolaire avec applicateur tête bleue', 'Standard', 'Pièce', 'NEUF', 350.00, 500.00, 0.00, 'VISIBLE', NOW()),
('COL-TRANSP', '601000000104', 'COLLE TRANSPARENT', 'Colle liquide transparente sans solvant', 'Standard', 'Pièce', 'NEUF', 280.00, 400.00, 0.00, 'VISIBLE', NOW()),

-- Section : CARNETS DE NOTES
('CAR-200P-POL', '601000000105', 'Carnet 200p polypro', 'Carnet de notes 200 pages couverture polypropylène', 'Polypro', 'Pièce', 'NEUF', 500.00, 700.00, 0.00, 'VISIBLE', NOW()),
('CAR-MP-11X17', '601000000106', 'Carnet Mon pays 11*17 cm 192pages', 'Carnet de notes Mon Pays format 11x17 cm 192 pages', 'Mon Pays', 'Pièce', 'NEUF', 350.00, 500.00, 0.00, 'VISIBLE', NOW()),
('CAR-POL-9X13', '601000000107', 'Carnet polypro 9X13 cm 192pages', 'Carnet de poche polypro format 9x13 cm 192 pages', 'Polypro', 'Pièce', 'NEUF', 350.00, 500.00, 0.00, 'VISIBLE', NOW()),
('CAR-TRIO-9X13', '601000000108', 'Carnet trio 9X13 cm 96pages', 'Carnet de poche Trio format 9x13 cm 96 pages', 'Trio', 'Pièce', 'NEUF', 170.00, 250.00, 0.00, 'VISIBLE', NOW()),

-- Section : CRAIE
('CRA-DOM-BLC', '601000000109', 'Craie DOM\'S BLANC', 'Boîte de craies blanches de haute qualité DOMS', 'DOMS', 'Boîte', 'NEUF', 950.00, 1300.00, 0.00, 'VISIBLE', NOW()),
('CRA-DOM-CLR', '601000000110', 'Craie DOM\'S couleur', 'Boîte de craies couleurs assorties DOMS', 'DOMS', 'Boîte', 'NEUF', 1600.00, 2200.00, 0.00, 'VISIBLE', NOW()),
('CRA-MP-BLC', '601000000111', 'Craie Mon pays blanc', 'Boîte de craies blanches marque Mon Pays', 'Mon Pays', 'Boîte', 'NEUF', 700.00, 1000.00, 0.00, 'VISIBLE', NOW()),
('CRA-MP-CLR', '601000000112', 'Craie Mon pays couleur', 'Boîte de craies couleurs marque Mon Pays', 'Mon Pays', 'Boîte', 'NEUF', 1450.00, 2000.00, 0.00, 'VISIBLE', NOW()),
('CRA-ROB-BLC', '601000000113', 'CRAIE Robercolor blanc', 'Boîte de craies blanches Robercolor anti-poussière', 'Robercolor', 'Boîte', 'NEUF', 1100.00, 1500.00, 0.00, 'VISIBLE', NOW()),

-- Section : ENSEMBLE GÉOMÉTRIQUE
('GEO-FER-JO471', '601000000114', 'KIT X 12 kit en fer jo 471', 'Kit de traçage géométrique 12 pièces boîte fer JO 471', 'JO', 'Pièce', 'NEUF', 1450.00, 2000.00, 0.00, 'VISIBLE', NOW()),
('GEO-INI-20CM', '601000000115', 'Kit ini 20 cm', 'Kit de traçage géométrique initiation règle 20 cm', 'Standard', 'Pièce', 'NEUF', 500.00, 700.00, 0.00, 'VISIBLE', NOW()),
('GEO-INI-30CM', '601000000116', 'Kit ini 30 cm', 'Kit de traçage géométrique initiation règle 30 cm', 'Standard', 'Pièce', 'NEUF', 600.00, 850.00, 0.00, 'VISIBLE', NOW()),
('GEO-SEC-JO435', '601000000117', 'Kit secondaire JO435', 'Kit géométrique complet pour collège / secondaire JO435', 'JO', 'Pièce', 'NEUF', 720.00, 1000.00, 0.00, 'VISIBLE', NOW()),
('GEO-BORIS-20CM', '601000000118', 'Kit boris plus jo 405 20cm', 'Kit géométrique Boris Plus règle 20 cm réf JO 405', 'Boris Plus', 'Pièce', 'NEUF', 500.00, 700.00, 0.00, 'VISIBLE', NOW()),
('GEO-PRI-20CM', '601000000119', 'Kit privilège 20 cm', 'Kit de traçage géométrique gamme Privilège 20 cm', 'Privilège', 'Pièce', 'NEUF', 720.00, 1000.00, 0.00, 'VISIBLE', NOW()),
('GEO-PRI-30CM', '601000000120', 'Kit privilège 30cm', 'Kit de traçage géométrique gamme Privilège 30 cm', 'Privilège', 'Pièce', 'NEUF', 900.00, 1250.00, 0.00, 'VISIBLE', NOW()),
('GEO-TECH-20CM', '601000000121', 'KITS techno 20 cm J0421', 'Kit géométrique technique 20 cm réf J0421', 'Techno', 'Pièce', 'NEUF', 420.00, 600.00, 0.00, 'VISIBLE', NOW()),

-- Section : REGISTRES
('REG-2RG-A6', '601000000122', 'Registre 2RG A6', 'Registre 2 mains format A6', 'Standard', 'Pièce', 'NEUF', 350.00, 500.00, 0.00, 'VISIBLE', NOW()),
('REG-3RG-A6', '601000000123', 'Registre 3RG A6', 'Registre 3 mains format A6', 'Standard', 'Pièce', 'NEUF', 500.00, 700.00, 0.00, 'VISIBLE', NOW()),
('REG-2RG-A5', '601000000124', 'Registre 2RG A5', 'Registre 2 mains format A5', 'Standard', 'Pièce', 'NEUF', 720.00, 1000.00, 0.00, 'VISIBLE', NOW()),
('REG-3RG-A5', '601000000125', 'Registre 3RG A5', 'Registre 3 mains format A5', 'Standard', 'Pièce', 'NEUF', 900.00, 1250.00, 0.00, 'VISIBLE', NOW()),
('REG-4RG-A5', '601000000126', 'Registre 4RG A5', 'Registre 4 mains format A5', 'Standard', 'Pièce', 'NEUF', 1100.00, 1500.00, 0.00, 'VISIBLE', NOW()),
('REG-5RG-A5', '601000000127', 'Registre 5RG A5', 'Registre 5 mains format A5', 'Standard', 'Pièce', 'NEUF', 1250.00, 1700.00, 0.00, 'VISIBLE', NOW()),
('REG-6RG-A5', '601000000128', 'Registre 6RG A5', 'Registre 6 mains format A5', 'Standard', 'Pièce', 'NEUF', 1450.00, 2000.00, 0.00, 'VISIBLE', NOW()),
('REG-2RG-A4', '601000000129', 'Registre 2RG A4', 'Registre grand format 2 mains format A4', 'Standard', 'Pièce', 'NEUF', 1100.00, 1500.00, 0.00, 'VISIBLE', NOW()),
('REG-3RG-A4', '601000000130', 'Registre 3RG A4', 'Registre grand format 3 mains format A4', 'Standard', 'Pièce', 'NEUF', 1450.00, 2000.00, 0.00, 'VISIBLE', NOW()),
('REG-4RG-A4', '601000000131', 'Registre 4RG A4', 'Registre grand format 4 mains format A4', 'Standard', 'Pièce', 'NEUF', 1800.00, 2500.00, 0.00, 'VISIBLE', NOW()),
('REG-5RG-A4', '601000000132', 'Registre 5RG A4', 'Registre grand format 5 mains format A4', 'Standard', 'Pièce', 'NEUF', 2200.00, 3000.00, 0.00, 'VISIBLE', NOW()),
('REG-6RG-A4', '601000000133', 'Registre 6RG A4', 'Registre grand format 6 mains format A4', 'Standard', 'Pièce', 'NEUF', 2550.00, 3500.00, 0.00, 'VISIBLE', NOW()),
('REG-TRIO-STELLA', '601000000134', 'REGISTRE trio stella', 'Grand registre d\'enregistrement comptable Trio Stella', 'Trio Stella', 'Pièce', 'NEUF', 1800.00, 2500.00, 0.00, 'VISIBLE', NOW())
ON DUPLICATE KEY UPDATE 
  `libelle` = VALUES(`libelle`),
  `prix_vente` = VALUES(`prix_vente`),
  `prix_achat` = VALUES(`prix_achat`),
  `marque` = VALUES(`marque`),
  `description` = VALUES(`description`);

-- 3. ASSOCIATION PRODUITS <-> CATÉGORIES
-- --------------------------------------------------------------------
-- Colles & Adhésifs
INSERT IGNORE INTO `categorie_produit` (`id_produit`, `id_categorie`)
SELECT p.`id_produit`, c.`id_categorie`
FROM `produit` p, `categorie` c
WHERE p.`reference` LIKE 'COL-%' AND c.`slug` = 'colles-adhesifs';

-- Carnets de Notes
INSERT IGNORE INTO `categorie_produit` (`id_produit`, `id_categorie`)
SELECT p.`id_produit`, c.`id_categorie`
FROM `produit` p, `categorie` c
WHERE p.`reference` LIKE 'CAR-%' AND c.`slug` = 'carnets-de-notes';

-- Craies Scolaires
INSERT IGNORE INTO `categorie_produit` (`id_produit`, `id_categorie`)
SELECT p.`id_produit`, c.`id_categorie`
FROM `produit` p, `categorie` c
WHERE p.`reference` LIKE 'CRA-%' AND c.`slug` = 'craies-scolaires';

-- Matériel & Géométrie
INSERT IGNORE INTO `categorie_produit` (`id_produit`, `id_categorie`)
SELECT p.`id_produit`, c.`id_categorie`
FROM `produit` p, `categorie` c
WHERE p.`reference` LIKE 'GEO-%' AND c.`slug` = 'materiel-geometrie';

-- Registres
INSERT IGNORE INTO `categorie_produit` (`id_produit`, `id_categorie`)
SELECT p.`id_produit`, c.`id_categorie`
FROM `produit` p, `categorie` c
WHERE p.`reference` LIKE 'REG-%' AND c.`slug` = 'registres';

-- 4. INITIALISATION DES STOCKS POUR LA VENTE EN CAISSE (50 unités par produit)
-- --------------------------------------------------------------------
INSERT INTO `stock` (`id_produit`, `quantite_en_stock`, `seuil_alerte`, `date_derniere_entree`)
SELECT `id_produit`, 50, 5, NOW()
FROM `produit`
WHERE `reference` IN (
  'COL-BOBO', 'COL-FORTE', 'COL-TETE-BLEU', 'COL-TRANSP',
  'CAR-200P-POL', 'CAR-MP-11X17', 'CAR-POL-9X13', 'CAR-TRIO-9X13',
  'CRA-DOM-BLC', 'CRA-DOM-CLR', 'CRA-MP-BLC', 'CRA-MP-CLR', 'CRA-ROB-BLC',
  'GEO-FER-JO471', 'GEO-INI-20CM', 'GEO-INI-30CM', 'GEO-SEC-JO435',
  'GEO-BORIS-20CM', 'GEO-PRI-20CM', 'GEO-PRI-30CM', 'GEO-TECH-20CM',
  'REG-2RG-A6', 'REG-3RG-A6', 'REG-2RG-A5', 'REG-3RG-A5', 'REG-4RG-A5', 'REG-5RG-A5', 'REG-6RG-A5',
  'REG-2RG-A4', 'REG-3RG-A4', 'REG-4RG-A4', 'REG-5RG-A4', 'REG-6RG-A4',
  'REG-TRIO-STELLA'
)
ON DUPLICATE KEY UPDATE `quantite_en_stock` = VALUES(`quantite_en_stock`);
