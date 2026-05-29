-- CreateTable
CREATE TABLE `BorrowerReview` (
    `id` VARCHAR(191) NOT NULL,
    `borrowCheckoutId` VARCHAR(191) NOT NULL,
    `lenderId` VARCHAR(191) NOT NULL,
    `borrowerId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BorrowerReview_borrowCheckoutId_key`(`borrowCheckoutId`),
    INDEX `BorrowerReview_lenderId_idx`(`lenderId`),
    INDEX `BorrowerReview_borrowerId_idx`(`borrowerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BorrowerReview` ADD CONSTRAINT `BorrowerReview_borrowCheckoutId_fkey` FOREIGN KEY (`borrowCheckoutId`) REFERENCES `BorrowCheckout`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BorrowerReview` ADD CONSTRAINT `BorrowerReview_lenderId_fkey` FOREIGN KEY (`lenderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BorrowerReview` ADD CONSTRAINT `BorrowerReview_borrowerId_fkey` FOREIGN KEY (`borrowerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
