-- DropForeignKey
ALTER TABLE `NidVerification` DROP FOREIGN KEY `NidVerification_userId_fkey`;

-- AlterTable
ALTER TABLE `BorrowCheckout` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `BorrowRequest` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AddForeignKey
ALTER TABLE `NidVerification` ADD CONSTRAINT `IdVerification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex (MariaDB does not support RENAME INDEX; drop and recreate)
ALTER TABLE `NidVerification` DROP INDEX `NidVerification_userId_idx`;
ALTER TABLE `NidVerification` ADD INDEX `IdVerification_userId_idx` (`userId`);

ALTER TABLE `NidVerification` DROP INDEX `NidVerification_userId_key`;
ALTER TABLE `NidVerification` ADD UNIQUE INDEX `IdVerification_userId_key` (`userId`);
