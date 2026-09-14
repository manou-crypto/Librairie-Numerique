/*
  Warnings:

  - You are about to drop the column `marque` on the `produit` table.
  Custom Data Migration: the string data from `marque` will be transferred to the new `marque` table before the column is dropped.

*/
-- CreateTable
CREATE TABLE `marque` (
    `id_marque` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `marque_nom_key`(`nom`),
    PRIMARY KEY (`id_marque`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable (Add id_marque first)
ALTER TABLE `produit` ADD COLUMN `id_marque` INTEGER NULL;

-- Custom Data Migration
-- 1. Insert unique Marques from Produit table
INSERT IGNORE INTO `marque` (`nom`)
SELECT DISTINCT `marque` FROM `produit` WHERE `marque` IS NOT NULL AND TRIM(`marque`) != '';

-- 2. Link existing Produits to the newly created Marques
UPDATE `produit` p
JOIN `marque` m ON p.`marque` = m.`nom`
SET p.`id_marque` = m.`id_marque`;

-- AlterTable (Drop old column)
ALTER TABLE `produit` DROP COLUMN `marque`;

-- AddForeignKey
ALTER TABLE `produit` ADD CONSTRAINT `produit_id_marque_fkey` FOREIGN KEY (`id_marque`) REFERENCES `marque`(`id_marque`) ON DELETE SET NULL ON UPDATE CASCADE;
