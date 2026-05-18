const { PrismaClient } = require("./lib/generated/prisma");

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log("=== LENT ITEMS ===");
    const items = await prisma.lentItem.findMany({
      include: { lender: true }
    });
    console.log(`Found ${items.length} lent items:`);
    items.forEach(item => {
      console.log(`- ID: ${item.id}, Lender: ${item.lenderId} (${item.lender?.email || 'no email'})`);
    });

    console.log("\n=== USERS ===");
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}`);
    });

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();