-- CreateTable
CREATE TABLE `type_vente` (
    `id_type_vente` INTEGER NOT NULL AUTO_INCREMENT,
    `libelle` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `type_vente_libelle_key`(`libelle`),
    PRIMARY KEY (`id_type_vente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarif_article` (
    `id_tarif` INTEGER NOT NULL AUTO_INCREMENT,
    `id_produit` INTEGER NOT NULL,
    `id_type_vente` INTEGER NOT NULL,
    `prix` DECIMAL(10, 2) NOT NULL,

    UNIQUE INDEX `tarif_article_id_produit_id_type_vente_key`(`id_produit`, `id_type_vente`),
    PRIMARY KEY (`id_tarif`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conditionnement` (
    `id_conditionnement` INTEGER NOT NULL AUTO_INCREMENT,
    `id_produit` INTEGER NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `quantite_unitaire` INTEGER NOT NULL DEFAULT 1,
    `code_barre` VARCHAR(100) NULL,
    `prix_vente` DECIMAL(10, 2) NOT NULL,

    UNIQUE INDEX `conditionnement_code_barre_key`(`code_barre`),
    PRIMARY KEY (`id_conditionnement`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tarif_article` ADD CONSTRAINT `tarif_article_id_produit_fkey` FOREIGN KEY (`id_produit`) REFERENCES `produit`(`id_produit`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarif_article` ADD CONSTRAINT `tarif_article_id_type_vente_fkey` FOREIGN KEY (`id_type_vente`) REFERENCES `type_vente`(`id_type_vente`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conditionnement` ADD CONSTRAINT `conditionnement_id_produit_fkey` FOREIGN KEY (`id_produit`) REFERENCES `produit`(`id_produit`) ON DELETE CASCADE ON UPDATE CASCADE;
