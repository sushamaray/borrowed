-- CreateEnum
CREATE TABLE `_prisma_migrations_billing_method_enum_guard` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE `_prisma_migrations_billing_method_enum_guard`;

-- CreateTable
CREATE TABLE `BillingOrder` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `deliveryAddress` TEXT NOT NULL,
    `specialNotes` TEXT NULL,
    `billingMethod` ENUM('BKASH', 'NAGAD', 'ROCKET', 'CARD', 'CASH_ON_DELIVERY') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BillingOrder_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BillingOrder` ADD CONSTRAINT `BillingOrder_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
