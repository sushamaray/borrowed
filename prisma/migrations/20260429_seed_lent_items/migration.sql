-- Create dummy users for testing
INSERT INTO `User` (
    `id`,
    `email`,
    `userName`,
    `firstName`,
    `lastName`,
    `location`,
    `createdAt`,
    `identityVerified`,
    `contactVerified`,
    `idVerified`,
    `addressVerified`,
    `meetupVerified`
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    'sarah@example.com',
    'sarah_khan',
    'Sarah',
    'Khan',
    'Dhanmondi, Dhaka',
    CURRENT_TIMESTAMP(3),
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'john@example.com',
    'john_doe',
    'John',
    'Doe',
    'Banani, Dhaka',
    CURRENT_TIMESTAMP(3),
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'ria@example.com',
    'ria_patel',
    'Ria',
    'Patel',
    'Mirpur, Dhaka',
    CURRENT_TIMESTAMP(3),
    FALSE,
    TRUE,
    FALSE,
    FALSE,
    FALSE
);

-- Seed dummy lent items
INSERT INTO `LentItem` (
    `id`,
    `lenderId`,
    `title`,
    `description`,
    `imageUrl`,
    `category`,
    `location`,
    `status`,
    `createdAt`,
    `updatedAt`
) VALUES
(
    'lent_001',
    '550e8400-e29b-41d4-a716-446655440001',
    'MacBook Pro 16"',
    'Lightly used 2024 MacBook Pro with M3 Max chip, 36GB RAM, and 512GB storage. Perfect condition, includes charger and original box.',
    '/products/macbook-pro.svg',
    'Electronics',
    'Dhanmondi, Dhaka',
    'active',
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
),
(
    'lent_002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Canon EOS R5 Camera',
    'Professional mirrorless camera with RF 24-105mm lens. Excellent for photography and videography. All accessories included.',
    '/products/camera.svg',
    'Photography',
    'Dhanmondi, Dhaka',
    'active',
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
),
(
    'lent_003',
    '550e8400-e29b-41d4-a716-446655440001',
    'DJI Air 3S Drone',
    'Advanced drone with 4K camera, 46-minute flight time, and intelligent obstacle avoidance. Comes with 3 batteries and ND filters.',
    '/products/drone.svg',
    'Electronics',
    'Dhanmondi, Dhaka',
    'borrowed',
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
),
(
    'lent_004',
    '550e8400-e29b-41d4-a716-446655440002',
    'Sony WH-1000XM5 Headphones',
    'Premium noise-cancelling wireless headphones with 30-hour battery life. Nearly new condition.',
    '/products/headphones.svg',
    'Electronics',
    'Banani, Dhaka',
    'active',
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
),
(
    'lent_005',
    '550e8400-e29b-41d4-a716-446655440002',
    'iPad Pro 12.9" with Apple Pencil',
    'Latest generation iPad Pro with Magic Keyboard and Apple Pencil Pro. Perfect for design and creative work.',
    '/products/ipad.svg',
    'Electronics',
    'Banani, Dhaka',
    'active',
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
),
(
    'lent_006',
    '550e8400-e29b-41d4-a716-446655440003',
    'Fujifilm X-T5 Camera',
    'Compact mirrorless camera with beautiful film simulations. Comes with 18-55mm kit lens and extra battery.',
    '/products/fujifilm.svg',
    'Photography',
    'Mirpur, Dhaka',
    'active',
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
),
(
    'lent_007',
    '550e8400-e29b-41d4-a716-446655440003',
    'Rode Wireless GO II Microphone',
    'Professional wireless lavalier microphone system. Great for content creation, interviews, and streaming.',
    '/products/microphone.svg',
    'Audio Equipment',
    'Mirpur, Dhaka',
    'active',
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
),
(
    'lent_008',
    '550e8400-e29b-41d4-a716-446655440002',
    'Anker Powerbank 737 (240W)',
    'High-capacity power bank with fast charging capability. Perfect for travels and outdoor events.',
    '/products/powerbank.svg',
    'Electronics',
    'Banani, Dhaka',
    'active',
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
);
