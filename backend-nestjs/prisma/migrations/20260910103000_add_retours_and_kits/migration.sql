-- AlterTable: StatutVente enum update
ALTER TABLE `vente` MODIFY COLUMN `statut_vente` ENUM('VALIDEE', 'ANNULEE', 'REMBOURSEE', 'PARTIELLEMENT_REMBOURSEE') NOT NULL DEFAULT 'VALIDEE';

-- AlterTable: LigneVente kit & return fields
ALTER TABLE `ligne_vente`
    ADD COLUMN `quantite_retournee` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `nom_kit` VARCHAR(100) NULL,
    ADD COLUMN `id_kit_groupe` VARCHAR(50) NULL;

-- CreateTable: RetourVente
CREATE TABLE `retour_vente` (
    `id_retour_vente` INTEGER NOT NULL AUTO_INCREMENT,
    `reference_retour` VARCHAR(60) NOT NULL,
    `id_vente` INTEGER NOT NULL,
    `id_utilisateur` INTEGER NOT NULL,
    `id_session_caisse` INTEGER NULL,
    `date_retour` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type_retour` ENUM('ARTICLE', 'VENTE') NOT NULL,
    `motif` TEXT NOT NULL,
    `montant_rembourse` DECIMAL(10, 2) NOT NULL,
    `mode_remboursement` ENUM('ESPECES', 'CARTE_BANCAIRE', 'MOBILE_MONEY', 'CHEQUE') NOT NULL DEFAULT 'ESPECES',

    UNIQUE INDEX `retour_vente_reference_retour_key`(`reference_retour`),
    PRIMARY KEY (`id_retour_vente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: LigneRetour
CREATE TABLE `ligne_retour` (
    `id_ligne_retour` INTEGER NOT NULL AUTO_INCREMENT,
    `id_retour_vente` INTEGER NOT NULL,
    `id_ligne_vente` INTEGER NOT NULL,
    `id_produit` INTEGER NOT NULL,
    `quantite_retournee` INTEGER NOT NULL,
    `prix_unitaire_rembourse` DECIMAL(10, 2) NOT NULL,
    `total_ligne` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id_ligne_retour`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: ModeleKit
CREATE TABLE `modele_kit` (
    `id_modele_kit` INTEGER NOT NULL AUTO_INCREMENT,
    `nom_kit` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `prix_forfaitaire` DECIMAL(10, 2) NOT NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `date_creation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_modele_kit`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: LigneModeleKit
CREATE TABLE `ligne_modele_kit` (
    `id_ligne_modele_kit` INTEGER NOT NULL AUTO_INCREMENT,
    `id_modele_kit` INTEGER NOT NULL,
    `id_produit` INTEGER NOT NULL,
    `quantite` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id_ligne_modele_kit`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `retour_vente` ADD CONSTRAINT `retour_vente_id_vente_fkey` FOREIGN KEY (`id_vente`) REFERENCES `vente`(`id_vente`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `retour_vente` ADD CONSTRAINT `retour_vente_id_utilisateur_fkey` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur`(`id_utilisateur`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `retour_vente` ADD CONSTRAINT `retour_vente_id_session_caisse_fkey` FOREIGN KEY (`id_session_caisse`) REFERENCES `session_caisse`(`id_session`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ligne_retour` ADD CONSTRAINT `ligne_retour_id_retour_vente_fkey` FOREIGN KEY (`id_retour_vente`) REFERENCES `retour_vente`(`id_retour_vente`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ligne_retour` ADD CONSTRAINT `ligne_retour_id_ligne_vente_fkey` FOREIGN KEY (`id_ligne_vente`) REFERENCES `ligne_vente`(`id_ligne_vente`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ligne_retour` ADD CONSTRAINT `ligne_retour_id_produit_fkey` FOREIGN KEY (`id_produit`) REFERENCES `produit`(`id_produit`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ligne_modele_kit` ADD CONSTRAINT `ligne_modele_kit_id_modele_kit_fkey` FOREIGN KEY (`id_modele_kit`) REFERENCES `modele_kit`(`id_modele_kit`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ligne_modele_kit` ADD CONSTRAINT `ligne_modele_kit_id_produit_fkey` FOREIGN KEY (`id_produit`) REFERENCES `produit`(`id_produit`) ON DELETE RESTRICT ON UPDATE CASCADE;
