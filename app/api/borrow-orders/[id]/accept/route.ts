import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const checkout = await prisma.borrowCheckout.findUnique({
      where: { id },
      include: {
        product:  { select: { name: true } },
        lender:   { select: { name: true, firstName: true, lastName: true, userName: true } },
        lentItem: { select: { id: true } },
      },
    });

    if (!checkout) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (checkout.lenderId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (checkout.status !== "pending") return NextResponse.json({ error: "Not pending" }, { status: 409 });

    await prisma.$transaction([
      prisma.borrowCheckout.update({ where: { id }, data: { status: "accepted" } }),
      ...(checkout.lentItemId
        ? [prisma.lentItem.update({ where: { id: checkout.lentItemId }, data: { status: "borrowed" } })]
        : []),
    ]);

    const lenderName =
      checkout.lender.firstName ?? checkout.lender.name ?? checkout.lender.userName ?? "Lender";

    await prisma.notification.create({
      data: {
        userId: checkout.borrowerId,
        type: "borrow_accepted",
        title: "Borrow request accepted",
        body: `${lenderName} accepted your request for "${checkout.product.name}"`,
        link: "/dashboard/my-borrows",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/borrow-orders/[id]/accept:", error);
    return NextResponse.json({ error: "Failed to accept" }, { status: 500 });
  }
}
