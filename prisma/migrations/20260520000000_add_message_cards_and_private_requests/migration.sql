-- Message: add type and metadata for card messages
ALTER TABLE `Message`
  ADD COLUMN `type`     VARCHAR(191) NOT NULL DEFAULT 'text',
  ADD COLUMN `metadata` JSON         NULL;

-- BorrowRequest: add private-request fields
ALTER TABLE `BorrowRequest`
  ADD COLUMN `isPrivate`    BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN `targetUserId` VARCHAR(191) NULL;
