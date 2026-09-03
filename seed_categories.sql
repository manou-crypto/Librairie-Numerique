INSERT IGNORE INTO categorie (nom, slug, id_categorie_parente) VALUES
  ('Livres', 'livres', NULL),
  ('Fournitures scolaires', 'fournitures-scolaires', NULL),
  ('Informatique', 'informatique', NULL),
  ('Bureautique', 'bureautique', NULL);

INSERT IGNORE INTO categorie (nom, slug, id_categorie_parente)
SELECT 'Romans & Litterature', 'romans-litterature', id_categorie FROM categorie WHERE slug='livres' LIMIT 1;

INSERT IGNORE INTO categorie (nom, slug, id_categorie_parente)
SELECT 'Manuels scolaires', 'manuels-scolaires', id_categorie FROM categorie WHERE slug='livres' LIMIT 1;

INSERT IGNORE INTO categorie (nom, slug, id_categorie_parente)
SELECT 'Dictionnaires', 'dictionnaires', id_categorie FROM categorie WHERE slug='livres' LIMIT 1;

INSERT IGNORE INTO categorie (nom, slug, id_categorie_parente)
SELECT 'Cahiers & Carnets', 'cahiers-carnets', id_categorie FROM categorie WHERE slug='fournitures-scolaires' LIMIT 1;

INSERT IGNORE INTO categorie (nom, slug, id_categorie_parente)
SELECT 'Stylos & Crayons', 'stylos-crayons', id_categorie FROM categorie WHERE slug='fournitures-scolaires' LIMIT 1;

INSERT IGNORE INTO categorie (nom, slug, id_categorie_parente)
SELECT 'Peripheriques', 'peripheriques', id_categorie FROM categorie WHERE slug='informatique' LIMIT 1;

INSERT IGNORE INTO categorie (nom, slug, id_categorie_parente)
SELECT 'Consommables', 'consommables', id_categorie FROM categorie WHERE slug='informatique' LIMIT 1;

INSERT IGNORE INTO categorie (nom, slug, id_categorie_parente)
SELECT 'Classement', 'classement', id_categorie FROM categorie WHERE slug='bureautique' LIMIT 1;

SELECT id_categorie, nom, id_categorie_parente FROM categorie ORDER BY id_categorie;
