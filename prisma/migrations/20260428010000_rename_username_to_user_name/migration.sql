ALTER TABLE `User`
    DROP INDEX `User_username_key`,
    CHANGE COLUMN `username` `userName` VARCHAR(191) NOT NULL AFTER `lastName`,
    ADD UNIQUE INDEX `User_userName_key` (`userName`);
