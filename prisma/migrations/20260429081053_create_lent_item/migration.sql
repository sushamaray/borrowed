-- AlterTable
ALTER TABLE `user` ADD COLUMN `addressVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `contactVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `identityVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `meetupVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `idVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `profilePicture` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `LentItem` (
    `id` VARCHAR(191) NOT NULL,
    `lenderId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LentItem_lenderId_idx`(`lenderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productpc` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `postedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `location` VARCHAR(191) NULL,
    `images` LONGTEXT NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `features` LONGTEXT NOT NULL,
    `lenderName` VARCHAR(191) NOT NULL,
    `lenderReview` DOUBLE NOT NULL,
    `lenderNote` VARCHAR(191) NOT NULL,
    `lenderInfoUrl` VARCHAR(191) NULL,
    `compensationMajor` VARCHAR(191) NOT NULL,
    `compensationMinor` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LentItem` ADD CONSTRAINT `LentItem_lenderId_fkey` FOREIGN KEY (`lenderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
