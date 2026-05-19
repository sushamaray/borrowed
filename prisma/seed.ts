import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

const mentors = [
  {
    name: "Arif Hossain",
    handle: "@arif_photo",
    avatar: "AH",
    specialty: "DSLR & Mirrorless Cameras",
    category: "Cameras",
    bio: "Professional photographer with 8 years of experience. I teach composition, lighting, and advanced camera settings in plain language.",
    tags: ["Canon", "Sony", "Nikon"],
    rating: 4.9,
    sessions: 47,
    pricePerSession: 500,
    available: true,
    responseTime: "Usually replies in 1hr",
  },
  {
    name: "Nadia Islam",
    handle: "@nadia_lens",
    avatar: "NI",
    specialty: "Landscape & Portrait Photography",
    category: "Cameras",
    bio: "Award-winning portrait photographer. I help beginners get stunning results from day one with any mirrorless or DSLR.",
    tags: ["Portrait", "Lighting", "Editing"],
    rating: 4.8,
    sessions: 31,
    pricePerSession: 400,
    available: true,
    responseTime: "Usually replies in 2hr",
  },
  {
    name: "Tanvir Ahmed",
    handle: "@tanvir_dev",
    avatar: "TA",
    specialty: "macOS, Final Cut Pro & DaVinci",
    category: "Tech & Electronics",
    bio: "Apple-certified professional. I teach video editing workflows, macOS productivity, and creative software from scratch.",
    tags: ["MacBook", "Final Cut", "DaVinci"],
    rating: 4.7,
    sessions: 22,
    pricePerSession: 300,
    available: true,
    responseTime: "Usually replies in 30min",
  },
  {
    name: "Alex Smith",
    handle: "@alexsmith",
    avatar: "AL",
    specialty: "Acoustic Guitar & Songwriting",
    category: "Musical Instruments",
    bio: "Music teacher with 12 years of experience. I take students from complete beginner to playing their first song in one session.",
    tags: ["Acoustic", "Classical", "Songwriting"],
    rating: 4.9,
    sessions: 63,
    pricePerSession: 350,
    available: true,
    responseTime: "Usually replies in 1hr",
  },
  {
    name: "Rahul Sharma",
    handle: "@rahulsharma",
    avatar: "RS",
    specialty: "Drone Piloting & Aerial Photography",
    category: "Cameras",
    bio: "CAA certified drone pilot. I cover safety regulations, flight controls, and cinematic techniques for professional aerial footage.",
    tags: ["DJI", "Aerial", "Safety"],
    rating: 4.9,
    sessions: 19,
    pricePerSession: 800,
    available: true,
    responseTime: "Usually replies in 3hr",
  },
  {
    name: "Sara Khan",
    handle: "@sarakhan_dev",
    avatar: "SK",
    specialty: "Video Production & Lighting",
    category: "Tech & Electronics",
    bio: "Freelance video producer specializing in corporate content. I teach lighting setups, camera movement, and post-production basics.",
    tags: ["Video", "Lighting", "Production"],
    rating: 4.6,
    sessions: 14,
    pricePerSession: 450,
    available: false,
    responseTime: "Currently unavailable",
  },
  {
    name: "Mike Davis",
    handle: "@mikedavis",
    avatar: "MD",
    specialty: "Power Tools & Home Renovation",
    category: "Tools & Equipment",
    bio: "Licensed contractor with 15 years of experience. I make power tools approachable and safe for complete beginners.",
    tags: ["Drill", "Safety", "DIY"],
    rating: 4.6,
    sessions: 38,
    pricePerSession: 250,
    available: true,
    responseTime: "Usually replies in 1hr",
  },
  {
    name: "Priya Patel",
    handle: "@priyapatel",
    avatar: "PP",
    specialty: "Mirrorless Systems & Event Photography",
    category: "Cameras",
    bio: "Wedding and event photographer. I specialise in fast-paced shooting, autofocus systems, and colour grading for memorable results.",
    tags: ["Sony", "Events", "Colour"],
    rating: 4.8,
    sessions: 26,
    pricePerSession: 550,
    available: true,
    responseTime: "Usually replies in 2hr",
  },
];

const trailEntries = [
  // Canon EOS R5 DSLR — cameras
  {
    productId: "prod_canon_dslr",
    useFor: "a wedding shoot in Sylhet — captured the ceremony, reception and all the candid moments",
    location: "Sylhet",
    tags: ["wedding", "event", "portrait"],
    itemRating: 5,
    anonymous: false,
    displayName: "Rafi Ahmed",
    initials: "RA",
    createdDaysAgo: 18,
  },
  {
    productId: "prod_canon_dslr",
    useFor: "a mountain hiking trip to Bandarban — landscape and nature shots",
    location: "Bandarban",
    tags: ["travel", "outdoor", "adventure"],
    itemRating: 5,
    anonymous: false,
    displayName: "Nadia Sultana",
    initials: "NS",
    createdDaysAgo: 34,
  },
  {
    productId: "prod_canon_dslr",
    useFor: "a product launch event and brand shoot for a startup",
    location: "Gulshan, Dhaka",
    tags: ["work", "event", "creative"],
    itemRating: 4,
    anonymous: false,
    displayName: "Arif Hasan",
    initials: "AH",
    createdDaysAgo: 62,
  },
  {
    productId: "prod_canon_dslr",
    useFor: "filming a short documentary about Old Dhaka street food",
    location: "Old Dhaka",
    tags: ["film", "creative", "travel"],
    itemRating: 5,
    anonymous: true,
    displayName: "Anonymous Borrower",
    initials: "AB",
    createdDaysAgo: 90,
  },

  // DJI Drone
  {
    productId: "prod_dji_drone",
    useFor: "aerial coverage for a beach wedding in Cox's Bazar",
    location: "Cox's Bazar",
    tags: ["wedding", "travel", "film"],
    itemRating: 5,
    anonymous: false,
    displayName: "Nadia Sultana",
    initials: "NS",
    createdDaysAgo: 8,
  },
  {
    productId: "prod_dji_drone",
    useFor: "filming a resort promotional video in Rangamati",
    location: "Rangamati",
    tags: ["work", "film", "creative"],
    itemRating: 5,
    anonymous: false,
    displayName: "Tanvir Alam",
    initials: "TA",
    createdDaysAgo: 25,
  },
  {
    productId: "prod_dji_drone",
    useFor: "aerial photography for a real estate project",
    location: "Bashundhara, Dhaka",
    tags: ["work", "project"],
    itemRating: 4,
    anonymous: false,
    displayName: "Sakib Hossain",
    initials: "SH",
    createdDaysAgo: 50,
  },

  // Mountain Bike
  {
    productId: "prod_bicycle",
    useFor: "a 3-day cycling trail through Cox's Bazar beach road",
    location: "Cox's Bazar",
    tags: ["travel", "adventure", "outdoor"],
    itemRating: 5,
    anonymous: false,
    displayName: "Sakib Rahman",
    initials: "SR",
    createdDaysAgo: 6,
  },
  {
    productId: "prod_bicycle",
    useFor: "weekend trail riding around Savar and Ashulia",
    location: "Savar, Dhaka",
    tags: ["outdoor", "fitness", "adventure"],
    itemRating: 4,
    anonymous: false,
    displayName: "Mira Islam",
    initials: "MI",
    createdDaysAgo: 22,
  },
  {
    productId: "prod_bicycle",
    useFor: "commuting around Mirpur for a week while my bike was getting repaired",
    location: "Mirpur, Dhaka",
    tags: ["work"],
    itemRating: 4,
    anonymous: true,
    displayName: "Anonymous Borrower",
    initials: "AB",
    createdDaysAgo: 45,
  },

  // Camping Tent
  {
    productId: "prod_camping_tent",
    useFor: "a 4-day camping trip to the Sundarbans mangrove forest",
    location: "Sundarbans",
    tags: ["camping", "adventure", "outdoor", "travel"],
    itemRating: 5,
    anonymous: false,
    displayName: "Kabir Uddin",
    initials: "KU",
    createdDaysAgo: 4,
  },
  {
    productId: "prod_camping_tent",
    useFor: "a group camping night at Hum Hum waterfall in Moulvibazar",
    location: "Moulvibazar",
    tags: ["camping", "travel", "outdoor"],
    itemRating: 5,
    anonymous: false,
    displayName: "Puja Dey",
    initials: "PD",
    createdDaysAgo: 30,
  },

  // Sony Mirrorless
  {
    productId: "prod_sony_mirrorless_camera",
    useFor: "a graduation photoshoot for a friend at Dhaka University campus",
    location: "Dhaka University",
    tags: ["portrait", "event", "creative"],
    itemRating: 5,
    anonymous: false,
    displayName: "Omar Faruq",
    initials: "OF",
    createdDaysAgo: 12,
  },
  {
    productId: "prod_sony_mirrorless_camera",
    useFor: "shooting lookbook photos for a fashion brand's Instagram campaign",
    location: "Dhanmondi, Dhaka",
    tags: ["creative", "work", "art"],
    itemRating: 5,
    anonymous: false,
    displayName: "Priya Roy",
    initials: "PR",
    createdDaysAgo: 40,
  },

  // GoPro Hero
  {
    productId: "prod_gopro_hero",
    useFor: "surfing and beach activities documentation in Cox's Bazar",
    location: "Cox's Bazar",
    tags: ["travel", "adventure", "outdoor"],
    itemRating: 5,
    anonymous: false,
    displayName: "Hassan Khan",
    initials: "HK",
    createdDaysAgo: 9,
  },
  {
    productId: "prod_gopro_hero",
    useFor: "recording a motorcycle road trip from Dhaka to Sylhet",
    location: "Sylhet",
    tags: ["travel", "adventure"],
    itemRating: 4,
    anonymous: false,
    displayName: "Arif Hasan",
    initials: "AH",
    createdDaysAgo: 28,
  },
  {
    productId: "prod_gopro_hero",
    useFor: "underwater snorkeling footage at Saint Martin's Island",
    location: "Saint Martin's Island",
    tags: ["travel", "outdoor", "adventure"],
    itemRating: 5,
    anonymous: false,
    displayName: "Rafi Ahmed",
    initials: "RA",
    createdDaysAgo: 55,
  },
];

async function main() {
  console.log("Seeding mentors…");

  for (const mentor of mentors) {
    await prisma.mentor.upsert({
      where: { handle: mentor.handle },
      update: {
        name: mentor.name,
        avatar: mentor.avatar,
        specialty: mentor.specialty,
        category: mentor.category,
        bio: mentor.bio,
        tags: mentor.tags,
        rating: mentor.rating,
        sessions: mentor.sessions,
        pricePerSession: mentor.pricePerSession,
        available: mentor.available,
        responseTime: mentor.responseTime,
      },
      create: {
        name: mentor.name,
        handle: mentor.handle,
        avatar: mentor.avatar,
        specialty: mentor.specialty,
        category: mentor.category,
        bio: mentor.bio,
        tags: mentor.tags,
        rating: mentor.rating,
        sessions: mentor.sessions,
        pricePerSession: mentor.pricePerSession,
        available: mentor.available,
        responseTime: mentor.responseTime,
      },
    });
    console.log(`  ✓ ${mentor.name}`);
  }

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    console.log("Skipping trail entries — no products in DB yet.");
  } else {
    console.log("Seeding trail entries…");

    for (const entry of trailEntries) {
      const createdAt = new Date(Date.now() - entry.createdDaysAgo * 86400000);

      const existing = await prisma.itemTrailEntry.findFirst({
        where: { productId: entry.productId, useFor: entry.useFor },
        select: { id: true },
      });
      if (existing) {
        console.log(`  ↩ skip existing: ${entry.useFor.slice(0, 50)}`);
        continue;
      }

      await prisma.itemTrailEntry.create({
        data: {
          productId: entry.productId,
          useFor: entry.useFor,
          location: entry.location,
          tags: entry.tags,
          itemRating: entry.itemRating,
          anonymous: entry.anonymous,
          isPublic: true,
          createdAt,
        },
      });
      console.log(`  ✓ ${entry.productId}: ${entry.useFor.slice(0, 50)}…`);
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
