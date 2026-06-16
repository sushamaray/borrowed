-- CreateTable
CREATE TABLE `ConditionPhoto` (
    `id` VARCHAR(191) NOT NULL,
    `checkoutId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `data` LONGBLOB NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConditionPhoto_checkoutId_idx`(`checkoutId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `BorrowCheckout`
    ADD COLUMN `aiDamageVerdict` VARCHAR(191) NULL,
    ADD COLUMN `aiDamageConfidence` DOUBLE NULL,
    ADD COLUMN `aiDamageNotes` TEXT NULL,
    ADD COLUMN `aiDamageCheckedAt` DATETIME(3) NULL;

-- AddForeignKey
ALTER TABLE `ConditionPhoto` ADD CONSTRAINT `ConditionPhoto_checkoutId_fkey` FOREIGN KEY (`checkoutId`) REFERENCES `BorrowCheckout`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
