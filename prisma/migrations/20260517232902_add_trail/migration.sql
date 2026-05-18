-- CreateTable
CREATE TABLE `ItemTrailEntry` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `lentItemId` VARCHAR(191) NULL,
    `borrowId` VARCHAR(191) NULL,
    `borrowerId` VARCHAR(191) NULL,
    `useFor` TEXT NOT NULL,
    `location` VARCHAR(191) NULL,
    `tags` JSON NOT NULL,
    `itemRating` INTEGER NOT NULL,
    `photoUrls` JSON NOT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `anonymous` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ItemTrailEntry_borrowId_key`(`borrowId`),
    INDEX `ItemTrailEntry_productId_idx`(`productId`),
    INDEX `ItemTrailEntry_lentItemId_idx`(`lentItemId`),
    INDEX `ItemTrailEntry_borrowerId_idx`(`borrowerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrailReaction` (
    `id` VARCHAR(191) NOT NULL,
    `trailEntryId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'heart',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TrailReaction_trailEntryId_idx`(`trailEntryId`),
    INDEX `TrailReaction_userId_idx`(`userId`),
    UNIQUE INDEX `TrailReaction_trailEntryId_userId_key`(`trailEntryId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ItemTrailEntry` ADD CONSTRAINT `ItemTrailEntry_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemTrailEntry` ADD CONSTRAINT `ItemTrailEntry_lentItemId_fkey` FOREIGN KEY (`lentItemId`) REFERENCES `LentItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemTrailEntry` ADD CONSTRAINT `ItemTrailEntry_borrowId_fkey` FOREIGN KEY (`borrowId`) REFERENCES `BorrowTransaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemTrailEntry` ADD CONSTRAINT `ItemTrailEntry_borrowerId_fkey` FOREIGN KEY (`borrowerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrailReaction` ADD CONSTRAINT `TrailReaction_trailEntryId_fkey` FOREIGN KEY (`trailEntryId`) REFERENCES `ItemTrailEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrailReaction` ADD CONSTRAINT `TrailReaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
