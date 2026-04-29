CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `postedAt` DATETIME(3) NOT NULL,
    `priceAmount` INTEGER NOT NULL,
    `summary` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `features` JSON NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `lenderName` VARCHAR(191) NOT NULL,
    `lenderRating` DECIMAL(2, 1) NOT NULL,
    `lenderNote` TEXT NOT NULL,
    `compensationMajor` VARCHAR(191) NOT NULL,
    `compensationMinor` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
