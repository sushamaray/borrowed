-- Rename NidVerification table to IdVerification
RENAME TABLE `NidVerification` TO `IdVerification`;

-- Rename nidVerified column to idVerified on User table
ALTER TABLE `User` RENAME COLUMN `nidVerified` TO `idVerified`;
