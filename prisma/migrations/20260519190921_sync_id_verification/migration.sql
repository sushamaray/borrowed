-- DropForeignKey
ALTER TABLE `idverification` DROP FOREIGN KEY `NidVerification_userId_fkey`;

-- AlterTable
ALTER TABLE `borrowcheckout` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `borrowrequest` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AddForeignKey
ALTER TABLE `IdVerification` ADD CONSTRAINT `IdVerification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `idverification` RENAME INDEX `NidVerification_userId_idx` TO `IdVerification_userId_idx`;

-- RenameIndex
ALTER TABLE `idverification` RENAME INDEX `NidVerification_userId_key` TO `IdVerification_userId_key`;
