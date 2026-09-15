CREATE TABLE `unite` (
    `id_unite` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `multiple` INTEGER NOT NULL DEFAULT 1,
    UNIQUE INDEX `unite_nom_key`(`nom`),
    PRIMARY KEY (`id_unite`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `conditionnement` DROP COLUMN `nom`,
    DROP COLUMN `quantite_unitaire`,
    ADD COLUMN `id_unite` INTEGER NOT NULL;

ALTER TABLE `conditionnement` ADD CONSTRAINT `conditionnement_id_unite_fkey` FOREIGN KEY (`id_unite`) REFERENCES `unite`(`id_unite`) ON DELETE CASCADE ON UPDATE CASCADE;
