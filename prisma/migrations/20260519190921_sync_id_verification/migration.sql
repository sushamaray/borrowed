-- Queries 1-4 were already applied in a prior partial run.
-- Only the index renames remain (MariaDB: drop + recreate).
ALTER TABLE `NidVerification` DROP INDEX `NidVerification_userId_idx`;
ALTER TABLE `NidVerification` ADD INDEX `IdVerification_userId_idx` (`userId`);

ALTER TABLE `NidVerification` DROP INDEX `NidVerification_userId_key`;
ALTER TABLE `NidVerification` ADD UNIQUE INDEX `IdVerification_userId_key` (`userId`);
