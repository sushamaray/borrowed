import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Auto-create return reminders for checkouts due today or tomorrow
    const now = new Date();
    const tomorrowEnd = new Date(now);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const dueSoon = await prisma.borrowCheckout.findMany({
      where: {
        borrowerId: userId,
        status: { in: ["accepted", "active"] },
        endDate: { lte: tomorrowEnd },
      },
      include: { product: { select: { name: true } } },
    });

    for (const checkout of dueSoon) {
      if (!checkout.endDate) continue;
      const end = new Date(checkout.endDate);
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const label = diffDays <= 0 ? "is due today" : "is due tomorrow";

      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          type: "return_reminder",
          body: { contains: checkout.product.name },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            userId,
            type: "return_reminder",
            title: "Return reminder",
            body: `Your ${checkout.product.name} ${label}`,
            link: "/dashboard/my-borrows",
          },
        });
      }
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("GET /api/notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
