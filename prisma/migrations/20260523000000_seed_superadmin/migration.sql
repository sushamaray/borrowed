-- Migration: seed_superadmin
-- Ensures the isAdmin column exists on User, then upserts the superadmin account.

ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `isAdmin` BOOLEAN NOT NULL DEFAULT false;

INSERT INTO `User` (
  `id`,
  `email`,
  `userName`,
  `firstName`,
  `lastName`,
  `password`,
  `isAdmin`,
  `identityVerified`,
  `contactVerified`,
  `createdAt`,
  `updatedAt`
) VALUES (
  'test_user_superadmin',
  'superadmin@test.com',
  'superadmin',
  'Super',
  'Admin',
  '$2b$10$xNSHkBY8EC20dvJXHlC61OF1JcJnUE5XfKK7luqRCc2.yh37vbi4e',
  true,
  true,
  true,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  `userName`          = VALUES(`userName`),
  `firstName`         = VALUES(`firstName`),
  `lastName`          = VALUES(`lastName`),
  `password`          = VALUES(`password`),
  `isAdmin`           = true,
  `identityVerified`  = true,
  `contactVerified`   = true,
  `updatedAt`         = NOW();
