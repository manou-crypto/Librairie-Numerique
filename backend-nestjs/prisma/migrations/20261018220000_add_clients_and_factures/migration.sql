-- CreateTable
CREATE TABLE IF NOT EXISTS `client` (
    `id_client` INTEGER NOT NULL AUTO_INCREMENT,
    `code_client` VARCHAR(50) NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `prenom` VARCHAR(100) NULL,
    `telephone` VARCHAR(30) NULL,
    `email` VARCHAR(150) NULL,
    `adresse` VARCHAR(255) NULL,
    `type_client` VARCHAR(191) NOT NULL DEFAULT 'PARTICULIER',
    `notes` TEXT NULL,
    `date_creation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `client_code_client_key`(`code_client`),
    PRIMARY KEY (`id_client`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable configuration
ALTER TABLE `configuration` 
    ADD COLUMN `adresse` VARCHAR(255) NULL DEFAULT 'Bouaké - Belleville 2',
    ADD COLUMN `telephone` VARCHAR(50) NULL DEFAULT '0709511425',
    ADD COLUMN `email` VARCHAR(150) NULL DEFAULT 'dahiri.ok@gmail.com',
    ADD COLUMN `slogan` VARCHAR(255) NULL;

-- AlterTable vente
ALTER TABLE `vente` 
    ADD COLUMN `numero_facture` VARCHAR(50) NULL,
    ADD COLUMN `id_client` INTEGER NULL,
    ADD COLUMN `nom_client_snapshot` VARCHAR(150) NULL,
    ADD COLUMN `telephone_client_snapshot` VARCHAR(50) NULL,
    ADD COLUMN `total_remise` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- AlterTable ligne_vente
ALTER TABLE `ligne_vente` 
    ADD COLUMN `prix_unitaire_reduit` DECIMAL(10, 2) NULL,
    ADD COLUMN `remise_valeur` DECIMAL(10, 2) NULL DEFAULT 0.00,
    ADD COLUMN `remise_type` VARCHAR(20) NULL DEFAULT 'FIXE',
    ADD COLUMN `unite_libelle` VARCHAR(50) NULL DEFAULT 'Pce(s)';

-- AddForeignKey
ALTER TABLE `vente` ADD CONSTRAINT `vente_id_client_fkey` FOREIGN KEY (`id_client`) REFERENCES `client`(`id_client`) ON DELETE SET NULL ON UPDATE CASCADE;
