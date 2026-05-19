-- ─────────────────────────────────────────────────────────────────────────────
-- Catch-up migration: aligns the database with the current schema.prisma.
-- The previous migrations diverged significantly from the schema over time.
-- ─────────────────────────────────────────────────────────────────────────────

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. Drop orphaned tables no longer in schema ───────────────────────────────

DROP TABLE IF EXISTS `ProductCartItem`;
DROP TABLE IF EXISTS `CartSession`;
DROP TABLE IF EXISTS `BorrowTransaction`;
DROP TABLE IF EXISTS `BorrowOrder`;
DROP TABLE IF EXISTS `BillingOrder`;
DROP TABLE IF EXISTS `billingorder`;
DROP TABLE IF EXISTS `productpc`;

-- ── 2. Drop the FK on ItemTrailEntry that pointed at BorrowTransaction ─────────

ALTER TABLE `ItemTrailEntry` DROP FOREIGN KEY `ItemTrailEntry_borrowId_fkey`;

-- ── 3. Clear old seed data from tables being restructured ─────────────────────
--    (rows used old column shapes that no longer match the schema)

DELETE FROM `ItemTrailEntry`;
DELETE FROM `TrailReaction`;
DELETE FROM `CartItem`;
DELETE FROM `LentItem`;
DELETE FROM `Product`;

-- ── 4. User — add missing columns ─────────────────────────────────────────────

ALTER TABLE `User`
  ADD COLUMN `latitude`     DOUBLE       NULL,
  ADD COLUMN `longitude`    DOUBLE       NULL,
  ADD COLUMN `phoneNumber`  VARCHAR(191) NULL,
  ADD COLUMN `verifiedAt`   DATETIME(3)  NULL;

-- ── 5. Mentor — add subcategories + userId link ────────────────────────────────

ALTER TABLE `Mentor`
  ADD COLUMN `subcategories` JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  ADD COLUMN `userId`        VARCHAR(191) NULL;

CREATE UNIQUE INDEX `Mentor_userId_key` ON `Mentor`(`userId`);

ALTER TABLE `Mentor`
  ADD CONSTRAINT `Mentor_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 6. LentItem — replace old item-info columns with productId FK ──────────────

ALTER TABLE `LentItem`
  DROP COLUMN `title`,
  DROP COLUMN `description`,
  DROP COLUMN `imageUrl`,
  DROP COLUMN `category`,
  DROP COLUMN `location`,
  DROP COLUMN `deposit`,
  DROP COLUMN `pricePerDay`,
  ADD COLUMN  `productId` VARCHAR(191) NOT NULL;

CREATE INDEX `LentItem_productId_idx` ON `LentItem`(`productId`);

ALTER TABLE `LentItem`
  ADD CONSTRAINT `LentItem_productId_fkey`
  FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 7. Product — replace old lender-info columns with new schema columns ───────

ALTER TABLE `Product`
  DROP COLUMN `postedAt`,
  DROP COLUMN `priceAmount`,
  DROP COLUMN `summary`,
  DROP COLUMN `lenderName`,
  DROP COLUMN `lenderRating`,
  MODIFY `imageUrl`          VARCHAR(191) NULL,
  MODIFY `lenderNote`        TEXT         NULL,
  MODIFY `compensationMajor` VARCHAR(191) NULL,
  MODIFY `compensationMinor` VARCHAR(191) NULL,
  ADD COLUMN `subcategory` VARCHAR(191) NULL,
  ADD COLUMN `pricePerDay` INTEGER      NOT NULL,
  ADD COLUMN `deposit`     INTEGER      NULL,
  ADD COLUMN `drawbacks`   JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  ADD COLUMN `createdById` VARCHAR(191) NOT NULL;

CREATE INDEX `Product_createdById_idx` ON `Product`(`createdById`);
CREATE INDEX `Product_category_idx`    ON `Product`(`category`);

ALTER TABLE `Product`
  ADD CONSTRAINT `Product_createdById_fkey`
  FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 8. ItemTrailEntry — rename borrowId → borrowCheckoutId ────────────────────

ALTER TABLE `ItemTrailEntry`
  DROP INDEX  `ItemTrailEntry_borrowId_key`,
  DROP COLUMN `borrowId`,
  ADD COLUMN  `borrowCheckoutId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `ItemTrailEntry_borrowCheckoutId_key`
  ON `ItemTrailEntry`(`borrowCheckoutId`);

-- ── 9. Create BorrowRequest ───────────────────────────────────────────────────

CREATE TABLE `BorrowRequest` (
  `id`           VARCHAR(191) NOT NULL,
  `requesterId`  VARCHAR(191) NOT NULL,
  `title`        VARCHAR(191) NOT NULL,
  `category`     VARCHAR(191) NULL,
  `description`  TEXT         NULL,
  `location`     VARCHAR(191) NULL,
  `neededFrom`   DATETIME(3)  NOT NULL,
  `neededUntil`  DATETIME(3)  NOT NULL,
  `budgetPerDay` INTEGER      NULL,
  `status`       VARCHAR(191) NOT NULL DEFAULT 'open',
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  INDEX `BorrowRequest_requesterId_idx`(`requesterId`),
  INDEX `BorrowRequest_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 10. Create BorrowRequestOffer ─────────────────────────────────────────────

CREATE TABLE `BorrowRequestOffer` (
  `id`              VARCHAR(191) NOT NULL,
  `borrowRequestId` VARCHAR(191) NOT NULL,
  `productId`       VARCHAR(191) NOT NULL,
  `lenderId`        VARCHAR(191) NOT NULL,
  `message`         TEXT         NULL,
  `status`          VARCHAR(191) NOT NULL DEFAULT 'pending',
  `createdAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `BorrowRequestOffer_borrowRequestId_idx`(`borrowRequestId`),
  INDEX `BorrowRequestOffer_lenderId_idx`(`lenderId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 11. Create BorrowCheckout ─────────────────────────────────────────────────

CREATE TABLE `BorrowCheckout` (
  `id`                   VARCHAR(191) NOT NULL,
  `borrowerId`           VARCHAR(191) NOT NULL,
  `lenderId`             VARCHAR(191) NOT NULL,
  `productId`            VARCHAR(191) NOT NULL,
  `lentItemId`           VARCHAR(191) NULL,
  `borrowRequestOfferId` VARCHAR(191) NULL,
  `originType`           VARCHAR(191) NOT NULL,
  `startDate`            DATETIME(3)  NULL,
  `endDate`              DATETIME(3)  NULL,
  `totalPrice`           INTEGER      NULL,
  `deposit`              INTEGER      NULL,
  `notes`                TEXT         NULL,
  `damageReport`         JSON         NULL,
  `returnedAt`           DATETIME(3)  NULL,
  `cancelledBy`          VARCHAR(191) NULL,
  `status`               VARCHAR(191) NOT NULL DEFAULT 'pending',
  `createdAt`            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `BorrowCheckout_borrowRequestOfferId_key`(`borrowRequestOfferId`),
  INDEX `BorrowCheckout_borrowerId_idx`(`borrowerId`),
  INDEX `BorrowCheckout_lenderId_idx`(`lenderId`),
  INDEX `BorrowCheckout_productId_idx`(`productId`),
  INDEX `BorrowCheckout_lentItemId_idx`(`lentItemId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 12. Create NidVerification ────────────────────────────────────────────────

CREATE TABLE `NidVerification` (
  `id`             VARCHAR(191) NOT NULL,
  `userId`         VARCHAR(191) NOT NULL,
  `frontImage`     LONGBLOB     NULL,
  `backImage`      LONGBLOB     NULL,
  `selfieImage`    LONGBLOB     NULL,
  `frontMimeType`  VARCHAR(191) NULL,
  `backMimeType`   VARCHAR(191) NULL,
  `selfieMimeType` VARCHAR(191) NULL,
  `faceMatchScore` DOUBLE       NULL,
  `status`         VARCHAR(191) NOT NULL DEFAULT 'pending',
  `submittedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `reviewedAt`     DATETIME(3)  NULL,

  UNIQUE INDEX `NidVerification_userId_key`(`userId`),
  INDEX `NidVerification_userId_idx`(`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 13. Foreign keys for new tables and updated columns ───────────────────────

ALTER TABLE `ItemTrailEntry`
  ADD CONSTRAINT `ItemTrailEntry_borrowCheckoutId_fkey`
  FOREIGN KEY (`borrowCheckoutId`) REFERENCES `BorrowCheckout`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `BorrowRequest`
  ADD CONSTRAINT `BorrowRequest_requesterId_fkey`
  FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `BorrowRequestOffer`
  ADD CONSTRAINT `BorrowRequestOffer_borrowRequestId_fkey`
  FOREIGN KEY (`borrowRequestId`) REFERENCES `BorrowRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `BorrowRequestOffer`
  ADD CONSTRAINT `BorrowRequestOffer_productId_fkey`
  FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `BorrowRequestOffer`
  ADD CONSTRAINT `BorrowRequestOffer_lenderId_fkey`
  FOREIGN KEY (`lenderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `BorrowCheckout`
  ADD CONSTRAINT `BorrowCheckout_borrowerId_fkey`
  FOREIGN KEY (`borrowerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `BorrowCheckout`
  ADD CONSTRAINT `BorrowCheckout_lenderId_fkey`
  FOREIGN KEY (`lenderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `BorrowCheckout`
  ADD CONSTRAINT `BorrowCheckout_productId_fkey`
  FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `BorrowCheckout`
  ADD CONSTRAINT `BorrowCheckout_lentItemId_fkey`
  FOREIGN KEY (`lentItemId`) REFERENCES `LentItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `BorrowCheckout`
  ADD CONSTRAINT `BorrowCheckout_borrowRequestOfferId_fkey`
  FOREIGN KEY (`borrowRequestOfferId`) REFERENCES `BorrowRequestOffer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `NidVerification`
  ADD CONSTRAINT `NidVerification_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
