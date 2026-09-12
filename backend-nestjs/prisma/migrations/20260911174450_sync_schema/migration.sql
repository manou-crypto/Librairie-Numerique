-- AlterTable
ALTER TABLE `achat` ADD COLUMN `date_prevue_reception` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `utilisateur` ADD COLUMN `avatar_url` VARCHAR(500) NULL;

-- CreateTable
CREATE TABLE `notification` (
    `id_notification` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `titre` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `lue` BOOLEAN NOT NULL DEFAULT false,
    `date_creation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_notification`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
