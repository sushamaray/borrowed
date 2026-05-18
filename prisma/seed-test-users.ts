import { PrismaClient } from "../lib/generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const PASSWORD = "test1234";

const USERS = [
  {
    id: "test_user_alice",
    email: "alice@test.com",
    userName: "alice_rahman",
    firstName: "Alice",
    lastName: "Rahman",
    location: "Dhanmondi, Dhaka",
    latitude: 23.7461,
    longitude: 90.3742,
  },
  {
    id: "test_user_bob",
    email: "bob@test.com",
    userName: "bob_hossain",
    firstName: "Bob",
    lastName: "Hossain",
    location: "Banani, Dhaka",
    latitude: 23.7937,
    longitude: 90.4066,
  },
  {
    id: "test_user_carol",
    email: "carol@test.com",
    userName: "carol_ahmed",
    firstName: "Carol",
    lastName: "Ahmed",
    location: "Gulshan, Dhaka",
    latitude: 23.7808,
    longitude: 90.4156,
  },
  {
    id: "test_user_dave",
    email: "dave@test.com",
    userName: "dave_islam",
    firstName: "Dave",
    lastName: "Islam",
    location: "Uttara, Dhaka",
    latitude: 23.8759,
    longitude: 90.3795,
  },
];

// Products (item info) — one per lent item
const PRODUCTS = [
  {
    id: "test_prod_alice_1",
    slug: "canon-eos-r5-alice",
    name: "Canon EOS R5 Camera",
    category: "Photography",
    location: "Dhanmondi, Dhaka",
    pricePerDay: 800,
    deposit: 5000,
    description:
      "Professional mirrorless camera with RF 24-105mm f/4L lens. 45MP sensor, 8K video capable. Includes 2 batteries, charger, and camera bag.",
    features: ["45MP Full-Frame Sensor", "8K RAW Video", "RF 24-105mm f/4L Lens", "2 Batteries", "Camera Bag"],
    compensationMajor: "TK 80,000",
    compensationMinor: "TK 5,000",
    lenderNote: "Please handle with care. Clean the lens before returning.",
    createdById: "test_user_alice",
  },
  {
    id: "test_prod_alice_2",
    slug: "camping-tent-alice",
    name: "4-Person Camping Tent",
    category: "Outdoor",
    location: "Dhanmondi, Dhaka",
    pricePerDay: 350,
    deposit: 1500,
    description:
      "Waterproof dome tent with separate sleeping and living areas. Easy 10-minute setup. Includes rainfly, stakes, and carry bag.",
    features: ["4-Person Capacity", "Waterproof", "Quick Setup", "Rainfly Included", "Stakes & Bag"],
    compensationMajor: "TK 8,000",
    compensationMinor: "TK 1,000",
    lenderNote: "Please dry before packing. Return in carry bag.",
    createdById: "test_user_alice",
  },
  {
    id: "test_prod_bob_1",
    slug: "yamaha-guitar-bob",
    name: "Yamaha F310 Acoustic Guitar",
    category: "Musical Instruments",
    location: "Banani, Dhaka",
    pricePerDay: 200,
    deposit: 800,
    description:
      "Full-size acoustic guitar in excellent condition. Great for beginners and intermediate players. Includes gig bag and extra strings.",
    features: ["Full-Size Dreadnought", "Spruce Top", "Gig Bag", "Extra Strings Set"],
    compensationMajor: "TK 6,000",
    compensationMinor: "TK 500",
    lenderNote: "Tune before returning. Handle the neck carefully.",
    createdById: "test_user_bob",
  },
  {
    id: "test_prod_bob_2",
    slug: "sony-headphones-bob",
    name: "Sony WH-1000XM5 Headphones",
    category: "Electronics",
    location: "Banani, Dhaka",
    pricePerDay: 300,
    deposit: 2000,
    description:
      "Industry-leading noise cancelling wireless headphones. 30-hour battery, multipoint connection, crystal-clear call quality.",
    features: ["30-Hour Battery", "Noise Cancelling", "Multipoint Connection", "USB-C Charging", "Case Included"],
    compensationMajor: "TK 35,000",
    compensationMinor: "TK 2,000",
    lenderNote: "Charge to 100% before returning. Do not bend the headband.",
    createdById: "test_user_bob",
  },
  {
    id: "test_prod_carol_1",
    slug: "bosch-drill-carol",
    name: "Bosch Power Drill Set",
    category: "Tools",
    location: "Gulshan, Dhaka",
    pricePerDay: 400,
    deposit: 2500,
    description:
      "Professional 18V cordless drill with 2 batteries and full accessory kit (50 bits and drill heads). Perfect for home improvement projects.",
    features: ["18V Cordless", "2 Batteries", "50-Piece Bit Set", "Carrying Case", "LED Work Light"],
    compensationMajor: "TK 15,000",
    compensationMinor: "TK 1,500",
    lenderNote: "Return all bits. Charge batteries before returning.",
    createdById: "test_user_carol",
  },
  {
    id: "test_prod_carol_2",
    slug: "dji-drone-carol",
    name: "DJI Air 3S Drone",
    category: "Electronics",
    location: "Gulshan, Dhaka",
    pricePerDay: 1200,
    deposit: 8000,
    description:
      "Advanced drone with 4K/120fps camera, 46-minute flight time, and omnidirectional obstacle sensing. Comes with 3 batteries and ND filter kit.",
    features: ["4K/120fps Camera", "46-Min Flight Time", "Obstacle Sensing", "3 Batteries", "ND Filter Kit"],
    compensationMajor: "TK 120,000",
    compensationMinor: "TK 10,000",
    lenderNote: "Must have drone licence. Return all batteries charged.",
    createdById: "test_user_carol",
  },
  {
    id: "test_prod_dave_1",
    slug: "trek-bicycle-dave",
    name: "Trek Marlin 5 Mountain Bicycle",
    category: "Sports",
    location: "Uttara, Dhaka",
    pricePerDay: 500,
    deposit: 3000,
    description:
      "Versatile hardtail mountain bike with 21-speed Shimano drivetrain. Suitable for trails and urban commuting. Helmet and lock included.",
    features: ["21-Speed Shimano", "Hardtail Frame", "Disc Brakes", "Helmet Included", "Lock Included"],
    compensationMajor: "TK 40,000",
    compensationMinor: "TK 2,000",
    lenderNote: "Return clean. Lock the bike when not in use.",
    createdById: "test_user_dave",
  },
  {
    id: "test_prod_dave_2",
    slug: "ipad-pro-dave",
    name: "iPad Pro 12.9\" (M2)",
    category: "Electronics",
    location: "Uttara, Dhaka",
    pricePerDay: 600,
    deposit: 4000,
    description:
      "Latest iPad Pro with Apple Pencil 2nd gen and Magic Keyboard. 256GB storage, Wi-Fi + Cellular. Ideal for design, drawing, and video editing.",
    features: ["M2 Chip", "256GB Storage", "Apple Pencil 2nd Gen", "Magic Keyboard", "Wi-Fi + Cellular"],
    compensationMajor: "TK 120,000",
    compensationMinor: "TK 8,000",
    lenderNote: "Return with full charge. Do not install apps without permission.",
    createdById: "test_user_dave",
  },
];

// LentItem rows — link lender + product
const LENT_ITEMS = [
  { id: "test_lent_alice_1", productId: "test_prod_alice_1", lenderId: "test_user_alice", status: "active" },
  { id: "test_lent_alice_2", productId: "test_prod_alice_2", lenderId: "test_user_alice", status: "active" },
  { id: "test_lent_bob_1",   productId: "test_prod_bob_1",   lenderId: "test_user_bob",   status: "active" },
  { id: "test_lent_bob_2",   productId: "test_prod_bob_2",   lenderId: "test_user_bob",   status: "active" },
  { id: "test_lent_carol_1", productId: "test_prod_carol_1", lenderId: "test_user_carol", status: "active" },
  { id: "test_lent_carol_2", productId: "test_prod_carol_2", lenderId: "test_user_carol", status: "active" },
  { id: "test_lent_dave_1",  productId: "test_prod_dave_1",  lenderId: "test_user_dave",  status: "active" },
  { id: "test_lent_dave_2",  productId: "test_prod_dave_2",  lenderId: "test_user_dave",  status: "active" },
];

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

const today = new Date();
today.setHours(0, 0, 0, 0);

// BorrowCheckout rows — cross-lending between the 4 users
const CHECKOUTS = [
  {
    id: "test_checkout_1",
    borrowerId: "test_user_bob",
    lenderId: "test_user_alice",
    productId: "test_prod_alice_1",
    lentItemId: "test_lent_alice_1",
    originType: "lent_item",
    status: "accepted",
    startDate: today,
    endDate: daysFromNow(3),
    totalPrice: 2400,
    deposit: 5000,
    notes: "Will pick up from your place in Dhanmondi.",
  },
  {
    id: "test_checkout_2",
    borrowerId: "test_user_carol",
    lenderId: "test_user_alice",
    productId: "test_prod_alice_2",
    lentItemId: "test_lent_alice_2",
    originType: "lent_item",
    status: "pending",
    startDate: daysFromNow(2),
    endDate: daysFromNow(7),
    totalPrice: 1750,
    deposit: 1500,
    notes: "Need it for a camping trip to Sundarbans.",
  },
  {
    id: "test_checkout_3",
    borrowerId: "test_user_alice",
    lenderId: "test_user_bob",
    productId: "test_prod_bob_1",
    lentItemId: "test_lent_bob_1",
    originType: "lent_item",
    status: "accepted",
    startDate: daysAgo(1),
    endDate: daysFromNow(1),
    totalPrice: 400,
    deposit: 800,
    notes: "Learning to play for a small event next week.",
  },
  {
    id: "test_checkout_4",
    borrowerId: "test_user_carol",
    lenderId: "test_user_bob",
    productId: "test_prod_bob_2",
    lentItemId: "test_lent_bob_2",
    originType: "lent_item",
    status: "returned",
    startDate: daysAgo(10),
    endDate: daysAgo(6),
    returnedAt: daysAgo(6),
    totalPrice: 1200,
    deposit: 2000,
    notes: "Used for a 4-day conference. Item returned in perfect condition.",
  },
  {
    id: "test_checkout_5",
    borrowerId: "test_user_alice",
    lenderId: "test_user_carol",
    productId: "test_prod_carol_1",
    lentItemId: "test_lent_carol_1",
    originType: "lent_item",
    status: "pending",
    startDate: daysFromNow(3),
    endDate: daysFromNow(4),
    totalPrice: 400,
    deposit: 2500,
    notes: "Need to hang some shelves at home.",
  },
  {
    id: "test_checkout_6",
    borrowerId: "test_user_dave",
    lenderId: "test_user_carol",
    productId: "test_prod_carol_2",
    lentItemId: "test_lent_carol_2",
    originType: "lent_item",
    status: "accepted",
    startDate: today,
    endDate: daysFromNow(7),
    totalPrice: 8400,
    deposit: 8000,
    notes: "Filming a resort promo video in Rangamati.",
  },
  {
    id: "test_checkout_7",
    borrowerId: "test_user_bob",
    lenderId: "test_user_dave",
    productId: "test_prod_dave_1",
    lentItemId: "test_lent_dave_1",
    originType: "lent_item",
    status: "pending",
    startDate: daysFromNow(5),
    endDate: daysFromNow(8),
    totalPrice: 1500,
    deposit: 3000,
    notes: "Weekend trail ride around Savar.",
  },
  {
    id: "test_checkout_8",
    borrowerId: "test_user_alice",
    lenderId: "test_user_dave",
    productId: "test_prod_dave_2",
    lentItemId: "test_lent_dave_2",
    originType: "lent_item",
    status: "accepted",
    startDate: daysAgo(2),
    endDate: daysFromNow(3),
    totalPrice: 3000,
    deposit: 4000,
    notes: "Designing UI mockups for a client project.",
  },
];

async function main() {
  console.log("Hashing password…");
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  console.log("Seeding test users…");
  for (const user of USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        location: user.location,
        latitude: user.latitude,
        longitude: user.longitude,
        password: hashedPassword,
        identityVerified: true,
        contactVerified: true,
      },
      create: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        location: user.location,
        latitude: user.latitude,
        longitude: user.longitude,
        password: hashedPassword,
        identityVerified: true,
        contactVerified: true,
      },
    });
    console.log(`  ✓ ${user.firstName} ${user.lastName} (${user.email})`);
  }

  console.log("Seeding products…");
  for (const product of PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { id: product.id } });
    if (existing) {
      await prisma.product.update({ where: { id: product.id }, data: product });
    } else {
      await prisma.product.create({ data: product });
    }
    console.log(`  ✓ ${product.name}`);
  }

  console.log("Seeding lent items…");
  for (const item of LENT_ITEMS) {
    const existing = await prisma.lentItem.findUnique({ where: { id: item.id } });
    if (existing) {
      await prisma.lentItem.update({ where: { id: item.id }, data: item });
    } else {
      await prisma.lentItem.create({ data: item });
    }
    console.log(`  ✓ ${item.id}`);
  }

  console.log("Seeding checkouts…");
  for (const checkout of CHECKOUTS) {
    const existing = await prisma.borrowCheckout.findUnique({ where: { id: checkout.id } });
    if (existing) {
      await prisma.borrowCheckout.update({ where: { id: checkout.id }, data: checkout });
    } else {
      await prisma.borrowCheckout.create({ data: checkout });
    }
    console.log(`  ✓ ${checkout.id} [${checkout.status}]`);
  }

  console.log("\nTest seed complete!");
  console.log("─────────────────────────────────────────");
  console.log("Login credentials (password: test1234):");
  USERS.forEach((u) =>
    console.log(`  ${u.email.padEnd(20)} → ${u.firstName} ${u.lastName}`)
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
