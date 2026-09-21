/*
  Warnings:

  - Added the required column `updated_at` to the `achat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `achat` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `mode_paiement` ENUM('ESPECES', 'CARTE_BANCAIRE', 'MOBILE_MONEY', 'CHEQUE') NULL,
    ADD COLUMN `montant_paye` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `mouvement_stock` MODIFY `type_mouvement` ENUM('ENTREE_ACHAT', 'SORTIE_VENTE', 'AJUSTEMENT_INVENTAIRE', 'TRANSFERT_ETAL', 'RETOUR_RESERVE') NOT NULL;

-- AlterTable
ALTER TABLE `stock` ADD COLUMN `quantite_etal` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `unite` ADD COLUMN `id_unite_base` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `unite` ADD CONSTRAINT `unite_id_unite_base_fkey` FOREIGN KEY (`id_unite_base`) REFERENCES `unite`(`id_unite`) ON DELETE SET NULL ON UPDATE CASCADE;
