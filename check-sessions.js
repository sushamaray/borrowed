const { PrismaClient } = require("./lib/generated/prisma");

const prisma = new PrismaClient();

async function checkSessions() {
  try {
    const sessions = await prisma.session.findMany({
      include: { user: true },
      orderBy: { expires: 'desc' }
    });

    console.log(`Found ${sessions.length} sessions:`);
    sessions.forEach(session => {
      console.log(`- User ID: ${session.userId}`);
      console.log(`  User Email: ${session.user?.email || 'unknown'}`);
      console.log(`  Expires: ${session.expires}`);
      console.log('');
    });

    if (sessions.length > 0) {
      const currentUserId = sessions[0].userId;
      console.log(`Most recent user ID: ${currentUserId}`);

      // Update lent items to use this user ID
      const result = await prisma.lentItem.updateMany({
        data: { lenderId: currentUserId }
      });

      console.log(`Updated ${result.count} lent items to use user ID: ${currentUserId}`);

      // Verify
      const items = await prisma.lentItem.findMany({
        where: { lenderId: currentUserId }
      });
      console.log(`User now has ${items.length} lent items`);
    }

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

checkSessions();