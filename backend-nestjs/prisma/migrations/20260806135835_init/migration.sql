-- CreateTable
CREATE TABLE `role` (
    `id_role` INTEGER NOT NULL AUTO_INCREMENT,
    `code_role` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `role_code_role_key`(`code_role`),
    PRIMARY KEY (`id_role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utilisateur` (
    `id_utilisateur` INTEGER NOT NULL AUTO_INCREMENT,
    `id_role` INTEGER NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `prenom` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `mot_de_passe_hash` VARCHAR(255) NOT NULL,
    `statut` ENUM('ACTIF', 'INACTIF') NOT NULL DEFAULT 'ACTIF',

    UNIQUE INDEX `utilisateur_email_key`(`email`),
    PRIMARY KEY (`id_utilisateur`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permission` (
    `id_permission` INTEGER NOT NULL AUTO_INCREMENT,
    `code_permission` VARCHAR(100) NOT NULL,
    `module` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `permission_code_permission_key`(`code_permission`),
    PRIMARY KEY (`id_permission`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permission` (
    `id_role` INTEGER NOT NULL,
    `id_permission` INTEGER NOT NULL,

    PRIMARY KEY (`id_role`, `id_permission`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `log_audit` (
    `id_log` BIGINT NOT NULL AUTO_INCREMENT,
    `id_utilisateur` INTEGER NULL,
    `action` VARCHAR(50) NOT NULL,
    `entite_cible` VARCHAR(50) NOT NULL,
    `details_json` JSON NULL,
    `date_action` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_log`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorie` (
    `id_categorie` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `id_categorie_parente` INTEGER NULL,

    UNIQUE INDEX `categorie_slug_key`(`slug`),
    PRIMARY KEY (`id_categorie`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produit` (
    `id_produit` INTEGER NOT NULL AUTO_INCREMENT,
    `reference` VARCHAR(50) NOT NULL,
    `code_barre` VARCHAR(100) NULL,
    `libelle` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `marque` VARCHAR(100) NULL,
    `unite` VARCHAR(50) NOT NULL DEFAULT 'Pièce',
    `poids` DECIMAL(8, 2) NULL,
    `etat` ENUM('NEUF', 'OCCASION', 'RECONDITIONNE') NOT NULL DEFAULT 'NEUF',
    `prix_achat` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `prix_vente` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `taux_tva` DECIMAL(4, 2) NOT NULL DEFAULT 20.00,
    `statut_visibilite` ENUM('VISIBLE', 'MASQUE') NOT NULL DEFAULT 'VISIBLE',
    `date_creation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `produit_reference_key`(`reference`),
    UNIQUE INDEX `produit_code_barre_key`(`code_barre`),
    PRIMARY KEY (`id_produit`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorie_produit` (
    `id_produit` INTEGER NOT NULL,
    `id_categorie` INTEGER NOT NULL,

    PRIMARY KEY (`id_produit`, `id_categorie`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `image_produit` (
    `id_image` INTEGER NOT NULL AUTO_INCREMENT,
    `id_produit` INTEGER NOT NULL,
    `url_image` VARCHAR(500) NOT NULL,
    `est_principale` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id_image`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attribut_specifique` (
    `id_attribut` INTEGER NOT NULL AUTO_INCREMENT,
    `code_attribut` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `attribut_specifique_code_attribut_key`(`code_attribut`),
    PRIMARY KEY (`id_attribut`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `valeur_attribut` (
    `id_produit` INTEGER NOT NULL,
    `id_attribut` INTEGER NOT NULL,
    `valeur` TEXT NOT NULL,

    PRIMARY KEY (`id_produit`, `id_attribut`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historique_prix` (
    `id_historique` INTEGER NOT NULL AUTO_INCREMENT,
    `id_produit` INTEGER NOT NULL,
    `id_utilisateur` INTEGER NOT NULL,
    `ancien_prix_achat` DECIMAL(10, 2) NOT NULL,
    `nouveau_prix_achat` DECIMAL(10, 2) NOT NULL,
    `ancien_prix_vente` DECIMAL(10, 2) NOT NULL,
    `nouveau_prix_vente` DECIMAL(10, 2) NOT NULL,
    `motif_changement` VARCHAR(255) NULL,
    `date_changement` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_historique`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fournisseur` (
    `id_fournisseur` INTEGER NOT NULL AUTO_INCREMENT,
    `nom_entreprise` VARCHAR(150) NOT NULL,
    `contact_nom` VARCHAR(100) NULL,
    `telephone` VARCHAR(30) NULL,
    `email` VARCHAR(150) NULL,
    `adresse` VARCHAR(255) NULL,
    `ville` VARCHAR(100) NULL,
    `pays` VARCHAR(100) NULL DEFAULT 'Côte d''Ivoire',
    `numero_contribuable` VARCHAR(100) NULL,
    `observations` TEXT NULL,

    PRIMARY KEY (`id_fournisseur`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achat` (
    `id_achat` INTEGER NOT NULL AUTO_INCREMENT,
    `numero_facture_fournisseur` VARCHAR(100) NOT NULL,
    `id_fournisseur` INTEGER NOT NULL,
    `id_utilisateur` INTEGER NOT NULL,
    `date_achat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `date_reception` DATETIME(3) NULL,
    `montant_total_ht` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `montant_total_ttc` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `statut_achat` ENUM('EN_ATTENTE', 'RECU', 'ANNULE') NOT NULL DEFAULT 'EN_ATTENTE',

    PRIMARY KEY (`id_achat`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ligne_achat` (
    `id_ligne_achat` INTEGER NOT NULL AUTO_INCREMENT,
    `id_achat` INTEGER NOT NULL,
    `id_produit` INTEGER NOT NULL,
    `quantite_commandee` INTEGER NOT NULL,
    `quantite_recue` INTEGER NOT NULL DEFAULT 0,
    `prix_achat_unitaire_ht` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id_ligne_achat`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock` (
    `id_stock` INTEGER NOT NULL AUTO_INCREMENT,
    `id_produit` INTEGER NOT NULL,
    `quantite_en_stock` INTEGER NOT NULL DEFAULT 0,
    `seuil_alerte` INTEGER NOT NULL DEFAULT 5,
    `date_derniere_entree` DATETIME(3) NULL,
    `date_derniere_sortie` DATETIME(3) NULL,

    UNIQUE INDEX `stock_id_produit_key`(`id_produit`),
    PRIMARY KEY (`id_stock`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mouvement_stock` (
    `id_mouvement` INTEGER NOT NULL AUTO_INCREMENT,
    `id_produit` INTEGER NOT NULL,
    `id_utilisateur` INTEGER NOT NULL,
    `id_achat` INTEGER NULL,
    `type_mouvement` ENUM('ENTREE_ACHAT', 'SORTIE_VENTE', 'AJUSTEMENT_INVENTAIRE') NOT NULL,
    `quantite` INTEGER NOT NULL,
    `date_mouvement` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_mouvement`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventaire` (
    `id_inventaire` INTEGER NOT NULL AUTO_INCREMENT,
    `reference_inventaire` VARCHAR(60) NOT NULL,
    `id_utilisateur` INTEGER NOT NULL,
    `date_inventaire` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `statut_inventaire` ENUM('EN_COURS', 'VALIDE', 'ANNULE') NOT NULL DEFAULT 'EN_COURS',
    `observations` TEXT NULL,

    UNIQUE INDEX `inventaire_reference_inventaire_key`(`reference_inventaire`),
    PRIMARY KEY (`id_inventaire`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ligne_inventaire` (
    `id_ligne_inventaire` INTEGER NOT NULL AUTO_INCREMENT,
    `id_inventaire` INTEGER NOT NULL,
    `id_produit` INTEGER NOT NULL,
    `quantite_theorique` INTEGER NOT NULL,
    `quantite_reelle` INTEGER NOT NULL,
    `ecart` INTEGER NOT NULL,
    `motif_ajustement` VARCHAR(255) NULL,

    PRIMARY KEY (`id_ligne_inventaire`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `caisse` (
    `id_caisse` INTEGER NOT NULL AUTO_INCREMENT,
    `code_caisse` VARCHAR(50) NOT NULL,
    `emplacement` VARCHAR(100) NULL,
    `statut_caisse` ENUM('OUVERTE', 'FERMEE') NOT NULL DEFAULT 'FERMEE',

    UNIQUE INDEX `caisse_code_caisse_key`(`code_caisse`),
    PRIMARY KEY (`id_caisse`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_caisse` (
    `id_session` INTEGER NOT NULL AUTO_INCREMENT,
    `id_caisse` INTEGER NOT NULL,
    `id_utilisateur` INTEGER NOT NULL,
    `date_ouverture` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `date_cloture` DATETIME(3) NULL,
    `fond_de_caisse_initial` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_encaisse_calcule` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_encaisse_reel` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `ecart_caisse` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `motif_ecart` TEXT NULL,
    `statut_session` ENUM('OUVERTE', 'CLOTUREE') NOT NULL DEFAULT 'OUVERTE',

    PRIMARY KEY (`id_session`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vente` (
    `id_vente` INTEGER NOT NULL AUTO_INCREMENT,
    `reference_ticket` VARCHAR(60) NOT NULL,
    `id_session` INTEGER NOT NULL,
    `date_vente` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `total_ht` DECIMAL(10, 2) NOT NULL,
    `total_tva` DECIMAL(10, 2) NOT NULL,
    `total_ttc` DECIMAL(10, 2) NOT NULL,
    `marge_totale` DECIMAL(10, 2) NOT NULL,
    `statut_vente` ENUM('VALIDEE', 'ANNULEE', 'REMBOURSEE') NOT NULL DEFAULT 'VALIDEE',

    UNIQUE INDEX `vente_reference_ticket_key`(`reference_ticket`),
    PRIMARY KEY (`id_vente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ligne_vente` (
    `id_ligne_vente` INTEGER NOT NULL AUTO_INCREMENT,
    `id_vente` INTEGER NOT NULL,
    `id_produit` INTEGER NOT NULL,
    `quantite` INTEGER NOT NULL,
    `prix_achat_unitaire_snapshot` DECIMAL(10, 2) NOT NULL,
    `prix_vente_unitaire_ht_snapshot` DECIMAL(10, 2) NOT NULL,
    `taux_tva_snapshot` DECIMAL(4, 2) NOT NULL,
    `marge_unitaire` DECIMAL(10, 2) NOT NULL,
    `total_ligne_ht` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id_ligne_vente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paiement` (
    `id_paiement` INTEGER NOT NULL AUTO_INCREMENT,
    `id_vente` INTEGER NOT NULL,
    `mode_paiement` ENUM('ESPECES', 'CARTE_BANCAIRE', 'MOBILE_MONEY', 'CHEQUE') NOT NULL,
    `montant` DECIMAL(10, 2) NOT NULL,
    `reference_transaction` VARCHAR(100) NULL,
    `date_paiement` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_paiement`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cloture_journaliere` (
    `id_cloture` INTEGER NOT NULL AUTO_INCREMENT,
    `date_cloture` DATE NOT NULL,
    `chiffre_affaires_ht` DECIMAL(10, 2) NOT NULL,
    `chiffre_affaires_ttc` DECIMAL(10, 2) NOT NULL,
    `tva_collectee` DECIMAL(10, 2) NOT NULL,
    `benefice_brut_total` DECIMAL(10, 2) NOT NULL,
    `nombre_ventes` INTEGER NOT NULL,
    `nombre_articles_vendus` INTEGER NOT NULL,
    `id_utilisateur_validation` INTEGER NOT NULL,
    `date_validation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cloture_journaliere_date_cloture_key`(`date_cloture`),
    PRIMARY KEY (`id_cloture`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `utilisateur` ADD CONSTRAINT `utilisateur_id_role_fkey` FOREIGN KEY (`id_role`) REFERENCES `role`(`id_role`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permission` ADD CONSTRAINT `role_permission_id_role_fkey` FOREIGN KEY (`id_role`) REFERENCES `role`(`id_role`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permission` ADD CONSTRAINT `role_permission_id_permission_fkey` FOREIGN KEY (`id_permission`) REFERENCES `permission`(`id_permission`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `log_audit` ADD CONSTRAINT `log_audit_id_utilisateur_fkey` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur`(`id_utilisateur`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categorie` ADD CONSTRAINT `categorie_id_categorie_parente_fkey` FOREIGN KEY (`id_categorie_parente`) REFERENCES `categorie`(`id_categorie`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categorie_produit` ADD CONSTRAINT `categorie_produit_id_produit_fkey` FOREIGN KEY (`id_produit`) REFERENCES `produit`(`id_produit`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categorie_produit` ADD CONSTRAINT `categorie_produit_id_categorie_fkey` FOREIGN KEY (`id_categorie`) REFERENCES `categorie`(`id_categorie`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `image_produit` ADD CONSTRAINT `image_produit_id_produit_fkey` FOREIGN KEY (`id_produit`) REFERENCES `produit`(`id_produit`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `valeur_attribut` ADD CONSTRAINT `valeur_attribut_id_produit_fkey` FOREIGN KEY (`id_produit`) REFERENCES `produit`(`id_produit`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `valeur_attribut` ADD CONSTRAINT `valeur_attribut_id_attribut_fkey` FOREIGN KEY (`id_attribut`) REFERENCES `attribut_specifique`(`id_attribut`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historique_prix` ADD CONSTRAINT `historique_prix_id_produit_fkey` FOREIGN KEY (`id_produit`) REFERENCES `produit`(`id_produit`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historique_prix` ADD CONSTRAINT `historique_prix_id_utilisateur_fkey` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur`(`id_utilisateur`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `achat` ADD CONSTRAINT `achat_id_fournisseur_fkey` FOREIGN KEY (`id_fournisseur`) REFERENCES `fournisseur`(`id_fournisseur`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `achat` ADD CONSTRAINT `achat_id_utilisateur_fkey` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur`(`id_utilisateur`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ligne_achat` ADD CONSTRAINT `ligne_achat_id_achat_fkey` FOREIGN KEY (`id_achat`) REFERENCES `achat`(`id_achat`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ligne_achat` ADD CONSTRAINT `ligne_achat_id_produit_fkey` FOREIGN KEY (`id_produit`) REFERENCES `produit`(`id_produit`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock` ADD CONSTRAINT `stock_id_produit_fkey` FOREIGN KEY (`id_produit`) REFERENCES `produit`(`id_produit`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mouvement_stock` ADD CONSTRAINT `mouvement_stock_id_produit_fkey` FOREIGN KEY (`id_produit`) REFERENCES `produit`(`id_produit`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mouvement_stock` ADD CONSTRAINT `mouvement_stock_id_utilisateur_fkey` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur`(`id_utilisateur`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mouvement_stock` ADD CONSTRAINT `mouvement_stock_id_achat_fkey` FOREIGN KEY (`id_achat`) REFERENCES `achat`(`id_achat`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventaire` ADD CONSTRAINT `inventaire_id_utilisateur_fkey` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur`(`id_utilisateur`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ligne_inventaire` ADD CONSTRAINT `ligne_inventaire_id_inventaire_fkey` FOREIGN KEY (`id_inventaire`) REFERENCES `inventaire`(`id_inventaire`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ligne_inventaire` ADD CONSTRAINT `ligne_inventaire_id_produit_fkey` FOREIGN KEY (`id_produit`) REFERENCES `produit`(`id_produit`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_caisse` ADD CONSTRAINT `session_caisse_id_caisse_fkey` FOREIGN KEY (`id_caisse`) REFERENCES `caisse`(`id_caisse`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_caisse` ADD CONSTRAINT `session_caisse_id_utilisateur_fkey` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur`(`id_utilisateur`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vente` ADD CONSTRAINT `vente_id_session_fkey` FOREIGN KEY (`id_session`) REFERENCES `session_caisse`(`id_session`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ligne_vente` ADD CONSTRAINT `ligne_vente_id_vente_fkey` FOREIGN KEY (`id_vente`) REFERENCES `vente`(`id_vente`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ligne_vente` ADD CONSTRAINT `ligne_vente_id_produit_fkey` FOREIGN KEY (`id_produit`) REFERENCES `produit`(`id_produit`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paiement` ADD CONSTRAINT `paiement_id_vente_fkey` FOREIGN KEY (`id_vente`) REFERENCES `vente`(`id_vente`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cloture_journaliere` ADD CONSTRAINT `cloture_journaliere_id_utilisateur_validation_fkey` FOREIGN KEY (`id_utilisateur_validation`) REFERENCES `utilisateur`(`id_utilisateur`) ON DELETE RESTRICT ON UPDATE CASCADE;
