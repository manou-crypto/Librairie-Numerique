-- AlterTable
ALTER TABLE `caisse` ADD COLUMN `est_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `id_utilisateur` INTEGER NULL;

-- CreateTable
CREATE TABLE `configuration` (
    `id_configuration` INTEGER NOT NULL DEFAULT 1,
    `nom_librairie` VARCHAR(150) NOT NULL DEFAULT 'LibrairieNumerique',
    `logo_url` VARCHAR(500) NULL,
    `devise` VARCHAR(10) NOT NULL DEFAULT 'DZD',
    `tva` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_configuration`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `caisse` ADD CONSTRAINT `caisse_id_utilisateur_fkey` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur`(`id_utilisateur`) ON DELETE SET NULL ON UPDATE CASCADE;
