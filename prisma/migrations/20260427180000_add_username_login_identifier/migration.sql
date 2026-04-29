ALTER TABLE `User`
    ADD COLUMN `username` VARCHAR(191) NULL;

UPDATE `User`
SET `username` = LOWER(SUBSTRING_INDEX(`email`, '@', 1))
WHERE `username` IS NULL;

ALTER TABLE `User`
    MODIFY `username` VARCHAR(191) NOT NULL;

CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);
