-- RENAME TABLE already applied in prior partial run; skipped here.
-- RENAME COLUMN is not supported in MariaDB; use CHANGE COLUMN instead.
ALTER TABLE `User` CHANGE `nidVerified` `idVerified` BOOLEAN NOT NULL DEFAULT false;
