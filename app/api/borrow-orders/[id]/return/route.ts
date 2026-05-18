import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json() as {
      useFor: string;
      location?: string;
      tags?: string[];
      itemRating?: number;
      anonymous?: boolean;
    };

    const { useFor, location, tags, itemRating, anonymous } = body;
    if (!useFor?.trim()) {
      return NextResponse.json({ error: "useFor is required" }, { status: 400 });
    }

    const checkout = await prisma.borrowCheckout.findUnique({
      where: { id },
      include: {
        product:    { select: { name: true } },
        borrower:   { select: { name: true, firstName: true, lastName: true, userName: true } },
        trailEntry: { select: { id: true } },
      },
    });

    if (!checkout) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (checkout.borrowerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (checkout.status !== "accepted") return NextResponse.json({ error: "Not active" }, { status: 409 });
    if (checkout.trailEntry) return NextResponse.json({ error: "Already returned" }, { status: 409 });

    const rating = Math.min(5, Math.max(1, itemRating ?? 5));

    await prisma.$transaction([
      prisma.itemTrailEntry.create({
        data: {
          productId:       checkout.productId,
          lentItemId:      checkout.lentItemId ?? undefined,
          borrowCheckoutId: id,
          borrowerId:      session.user.id,
          useFor:          useFor.trim(),
          location:        location ?? null,
          tags:            tags ?? [],
          itemRating:      rating,
          anonymous:       anonymous ?? false,
        },
      }),
      prisma.borrowCheckout.update({
        where: { id },
        data: { status: "returned", returnedAt: new Date() },
      }),
      ...(checkout.lentItemId
        ? [prisma.lentItem.update({ where: { id: checkout.lentItemId }, data: { status: "active" } })]
        : []),
    ]);

    const borrowerName =
      checkout.borrower.firstName ??
      checkout.borrower.name ??
      checkout.borrower.userName ??
      "Someone";

    await prisma.notification.create({
      data: {
        userId: checkout.lenderId,
        type: "item_returned",
        title: "Item returned",
        body: `${borrowerName} has returned "${checkout.product.name}"`,
        link: "/dashboard/my-items",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/borrow-orders/[id]/return:", error);
    return NextResponse.json({ error: "Failed to submit return" }, { status: 500 });
  }
}
