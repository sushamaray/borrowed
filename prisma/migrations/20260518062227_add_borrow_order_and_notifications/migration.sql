-- AlterTable
ALTER TABLE `billingorder` ADD COLUMN `borrowerId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `BorrowOrder` (
    `id` VARCHAR(191) NOT NULL,
    `borrowerId` VARCHAR(191) NOT NULL,
    `lenderId` VARCHAR(191) NOT NULL,
    `lentItemId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `totalPrice` INTEGER NULL,
    `deposit` INTEGER NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BorrowOrder_borrowerId_idx`(`borrowerId`),
    INDEX `BorrowOrder_lenderId_idx`(`lenderId`),
    INDEX `BorrowOrder_lentItemId_idx`(`lentItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `link` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_idx`(`userId`),
    UNIQUE INDEX `Notification_userId_type_link_key`(`userId`, `type`, `link`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `BillingOrder_borrowerId_idx` ON `BillingOrder`(`borrowerId`);

-- AddForeignKey
ALTER TABLE `BillingOrder` ADD CONSTRAINT `BillingOrder_borrowerId_fkey` FOREIGN KEY (`borrowerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BorrowOrder` ADD CONSTRAINT `BorrowOrder_borrowerId_fkey` FOREIGN KEY (`borrowerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BorrowOrder` ADD CONSTRAINT `BorrowOrder_lenderId_fkey` FOREIGN KEY (`lenderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BorrowOrder` ADD CONSTRAINT `BorrowOrder_lentItemId_fkey` FOREIGN KEY (`lentItemId`) REFERENCES `LentItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
