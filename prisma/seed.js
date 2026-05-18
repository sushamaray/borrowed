const { PrismaClient } = require("../lib/generated/prisma");

const prisma = new PrismaClient();

async function main() {
  try {
    // Seed users
    console.log("Creating users...");
    const users = await prisma.user.createMany({
      data: [
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          email: "sarah@example.com",
          userName: "sarah_khan",
          firstName: "Sarah",
          lastName: "Khan",
          identityVerified: true,
          contactVerified: true,
          nidVerified: true,
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          email: "john@example.com",
          userName: "john_doe",
          firstName: "John",
          lastName: "Doe",
          identityVerified: true,
          contactVerified: true,
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440003",
          email: "ria@example.com",
          userName: "ria_patel",
          firstName: "Ria",
          lastName: "Patel",
          contactVerified: true,
        },
      ],
      skipDuplicates: true,
    });
    console.log(`Created ${users.count} users`);

    // Seed lent items
    console.log("Creating lent items...");
    const lentItems = await prisma.lentItem.createMany({
      data: [
        {
          id: "lent_001",
          lenderId: "550e8400-e29b-41d4-a716-446655440001",
          title: "MacBook Pro 16\"",
          description:
            "Lightly used 2024 MacBook Pro with M3 Max chip, 36GB RAM, and 512GB storage. Perfect condition, includes charger and original box.",
          imageUrl: "/products/macbook-pro.svg",
          category: "Electronics",
          location: "Dhanmondi, Dhaka",
          status: "active",
        },
        {
          id: "lent_002",
          lenderId: "550e8400-e29b-41d4-a716-446655440001",
          title: "Canon EOS R5 Camera",
          description:
            "Professional mirrorless camera with RF 24-105mm lens. Excellent for photography and videography. All accessories included.",
          imageUrl: "/products/camera.svg",
          category: "Photography",
          location: "Dhanmondi, Dhaka",
          status: "active",
        },
        {
          id: "lent_003",
          lenderId: "550e8400-e29b-41d4-a716-446655440001",
          title: "DJI Air 3S Drone",
          description:
            "Advanced drone with 4K camera, 46-minute flight time, and intelligent obstacle avoidance. Comes with 3 batteries and ND filters.",
          imageUrl: "/products/drone.svg",
          category: "Electronics",
          location: "Dhanmondi, Dhaka",
          status: "borrowed",
        },
        {
          id: "lent_004",
          lenderId: "550e8400-e29b-41d4-a716-446655440002",
          title: "Sony WH-1000XM5 Headphones",
          description:
            "Premium noise-cancelling wireless headphones with 30-hour battery life. Nearly new condition.",
          imageUrl: "/products/headphones.svg",
          category: "Electronics",
          location: "Banani, Dhaka",
          status: "active",
        },
        {
          id: "lent_005",
          lenderId: "550e8400-e29b-41d4-a716-446655440002",
          title: "iPad Pro 12.9\" with Apple Pencil",
          description:
            "Latest generation iPad Pro with Magic Keyboard and Apple Pencil Pro. Perfect for design and creative work.",
          imageUrl: "/products/ipad.svg",
          category: "Electronics",
          location: "Banani, Dhaka",
          status: "active",
        },
        {
          id: "lent_006",
          lenderId: "550e8400-e29b-41d4-a716-446655440003",
          title: "Fujifilm X-T5 Camera",
          description:
            "Compact mirrorless camera with beautiful film simulations. Comes with 18-55mm kit lens and extra battery.",
          imageUrl: "/products/fujifilm.svg",
          category: "Photography",
          location: "Mirpur, Dhaka",
          status: "active",
        },
        {
          id: "lent_007",
          lenderId: "550e8400-e29b-41d4-a716-446655440003",
          title: "Rode Wireless GO II Microphone",
          description:
            "Professional wireless lavalier microphone system. Great for content creation, interviews, and streaming.",
          imageUrl: "/products/microphone.svg",
          category: "Audio Equipment",
          location: "Mirpur, Dhaka",
          status: "active",
        },
        {
          id: "lent_008",
          lenderId: "550e8400-e29b-41d4-a716-446655440002",
          title: "Anker Powerbank 737 (240W)",
          description:
            "High-capacity power bank with fast charging capability. Perfect for travels and outdoor events.",
          imageUrl: "/products/powerbank.svg",
          category: "Electronics",
          location: "Banani, Dhaka",
          status: "active",
        },
      ],
      skipDuplicates: true,
    });
    console.log(`Created ${lentItems.count} lent items`);

    console.log("Seed completed successfully!");
  } catch (e) {
    console.error("Seeding failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
