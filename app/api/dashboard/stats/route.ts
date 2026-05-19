import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function dueLabel(endDate: Date): { dueIn: number; dueDate: string; status: "due-today" | "due-soon" | "safe" } {
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const dueIn = Math.ceil((endDate.getTime() - now.getTime()) / msPerDay);

  let status: "due-today" | "due-soon" | "safe";
  let dueDate: string;

  if (dueIn <= 0) {
    status = "due-today";
    dueDate = "Today";
  } else if (dueIn <= 3) {
    status = "due-soon";
    dueDate = dueIn === 1 ? "Tomorrow" : endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } else {
    status = "safe";
    dueDate = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return { dueIn, dueDate, status };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const [itemsCount, cartCount, activeBorrows, unreadMessages, notifications] = await Promise.all([
      prisma.lentItem.count({ where: { lenderId: userId } }),

      prisma.cartItem.count({ where: { userId } }),

      prisma.borrowCheckout.findMany({
        where: { borrowerId: userId, status: { in: ["active", "accepted"] } },
        include: {
          product: { select: { name: true } },
          lender: { select: { name: true, firstName: true, lastName: true } },
        },
        orderBy: { endDate: "asc" },
      }),

      prisma.message.count({
        where: {
          readAt: null,
          senderId: { not: userId },
          conversation: {
            participants: { some: { userId } },
          },
        },
      }),

      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const borrows = activeBorrows.map((c) => {
      const lenderName = c.lender.firstName
        ? `${c.lender.firstName}${c.lender.lastName ? " " + c.lender.lastName : ""}`
        : (c.lender.name ?? "Unknown");
      const { dueIn, dueDate, status } = c.endDate
        ? dueLabel(c.endDate)
        : { dueIn: 99, dueDate: "TBD", status: "safe" as const };
      return { id: c.id, item: c.product.name, from: lenderName, dueIn, dueDate, status };
    });

    const activity = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      subtitle: n.body,
      timestamp: relativeTime(n.createdAt),
      status: "active" as const,
    }));

    const firstName = session.user.name?.split(" ")[0] ?? "there";

    return NextResponse.json({
      userName: firstName,
      itemsCount,
      borrowsCount: activeBorrows.length,
      messagesCount: unreadMessages,
      cartCount,
      activeBorrows: borrows,
      recentActivity: activity,
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
