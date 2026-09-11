-- AlterTable
ALTER TABLE `inventaire`
    ADD COLUMN `date_validation` DATETIME(3) NULL,
    ADD COLUMN `validateur_nom` VARCHAR(100) NULL,
    ADD COLUMN `demande_invalidation` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `motif_invalidation` TEXT NULL,
    ADD COLUMN `date_demande_invalidation` DATETIME(3) NULL,
    ADD COLUMN `demandeur_invalidation_nom` VARCHAR(100) NULL,
    ADD COLUMN `date_invalidation` DATETIME(3) NULL,
    ADD COLUMN `utilisateur_invalidation_nom` VARCHAR(100) NULL;
