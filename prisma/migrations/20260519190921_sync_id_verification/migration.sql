-- DropForeignKey
ALTER TABLE `NidVerification` DROP FOREIGN KEY `NidVerification_userId_fkey`;

-- AlterTable
ALTER TABLE `BorrowCheckout` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `BorrowRequest` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AddForeignKey
ALTER TABLE `NidVerification` ADD CONSTRAINT `IdVerification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `NidVerification` RENAME INDEX `NidVerification_userId_idx` TO `IdVerification_userId_idx`;

-- RenameIndex
ALTER TABLE `NidVerification` RENAME INDEX `NidVerification_userId_key` TO `IdVerification_userId_key`;
