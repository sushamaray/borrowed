-- CreateTable
CREATE TABLE `CartSession` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CartSession_token_key`(`token`),
    INDEX `CartSession_token_idx`(`token`),
    INDEX `CartSession_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductCartItem` (
    `id` VARCHAR(191) NOT NULL,
    `cartSessionId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `days` INTEGER NOT NULL DEFAULT 1,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProductCartItem_cartSessionId_idx`(`cartSessionId`),
    UNIQUE INDEX `ProductCartItem_cartSessionId_productId_key`(`cartSessionId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CartSession` ADD CONSTRAINT `CartSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductCartItem` ADD CONSTRAINT `ProductCartItem_cartSessionId_fkey` FOREIGN KEY (`cartSessionId`) REFERENCES `CartSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductCartItem` ADD CONSTRAINT `ProductCartItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
