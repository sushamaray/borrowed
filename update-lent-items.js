const { PrismaClient } = require("./lib/generated/prisma");

const prisma = new PrismaClient();

async function updateLentItems() {
  try {
    // Get all users
    const users = await prisma.user.findMany();
    console.log("Available users:");
    users.forEach(user => {
      console.log(`- ${user.email}: ${user.id}`);
    });

    if (users.length === 0) {
      console.log("No users found. Please create a user first.");
      return;
    }

    // Use the first user as the lender for all items
    const lenderId = users[0].id;
    console.log(`\nUpdating all lent items to use lender ID: ${lenderId}`);

    const result = await prisma.lentItem.updateMany({
      data: { lenderId: lenderId }
    });

    console.log(`Updated ${result.count} lent items`);

    // Verify the update
    const items = await prisma.lentItem.findMany({
      include: { lender: true }
    });
    console.log("\nUpdated lent items:");
    items.forEach(item => {
      console.log(`- ${item.title}: ${item.lender?.email || 'no lender'}`);
    });

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

updateLentItems();