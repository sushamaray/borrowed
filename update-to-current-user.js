const { PrismaClient } = require("./lib/generated/prisma");

const prisma = new PrismaClient();

async function updateToCurrentUser() {
  try {
    // Fetch current user from the debug API
    const response = await fetch('http://localhost:3000/api/debug-user');
    const data = await response.json();

    console.log("Current session data:", data);

    if (!data.userId) {
      console.log("No active session found. Please log in first.");
      return;
    }

    const currentUserId = data.userId;
    console.log(`Updating lent items to use current user ID: ${currentUserId}`);

    // Update all lent items to use the current user's ID
    const result = await prisma.lentItem.updateMany({
      data: { lenderId: currentUserId }
    });

    console.log(`Updated ${result.count} lent items`);

    // Verify the update
    const items = await prisma.lentItem.findMany({
      where: { lenderId: currentUserId },
      include: { lender: true }
    });

    console.log(`\nLent items for current user (${currentUserId}):`);
    items.forEach(item => {
      console.log(`- ${item.title}`);
    });

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

updateToCurrentUser();