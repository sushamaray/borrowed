import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");   // "lender" | "borrower"
    const status = searchParams.get("status");

    const include = {
      product:  { select: { id: true, name: true, imageUrl: true, category: true, slug: true, location: true, pricePerDay: true, deposit: true, description: true } },
      lentItem: { select: { id: true, status: true } },
      borrower: { select: { id: true, name: true, firstName: true, lastName: true, userName: true } },
      lender:   { select: { id: true, name: true, firstName: true, lastName: true, userName: true } },
      trailEntry:     { select: { id: true, useFor: true, itemRating: true } },
      borrowerReview: { select: { id: true } },
      dispute:        { select: { id: true, status: true } },
    };

    const whereBase = status ? { status } : {};

    if (role === "lender") {
      const orders = await prisma.borrowCheckout.findMany({
        where: { lenderId: userId, ...whereBase },
        include,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(orders);
    }

    if (role === "borrower") {
      const orders = await prisma.borrowCheckout.findMany({
        where: { borrowerId: userId, ...whereBase },
        include,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(orders);
    }

    const [asLender, asBorrower] = await Promise.all([
      prisma.borrowCheckout.findMany({ where: { lenderId: userId }, include, orderBy: { createdAt: "desc" } }),
      prisma.borrowCheckout.findMany({ where: { borrowerId: userId }, include, orderBy: { createdAt: "desc" } }),
    ]);
    return NextResponse.json({ asLender, asBorrower });
  } catch (error) {
    console.error("GET /api/borrow-orders:", error);
    return NextResponse.json({ error: "Failed to fetch checkouts" }, { status: 500 });
  }
}
