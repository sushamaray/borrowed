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
      include: { product: { select: { name: true } } },
    });

    if (!checkout) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (checkout.lenderId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (checkout.status !== "pending") return NextResponse.json({ error: "Not pending" }, { status: 409 });

    await prisma.borrowCheckout.update({
      where: { id },
      data: { status: "rejected", cancelledBy: "lender" },
    });

    await prisma.notification.create({
      data: {
        userId: checkout.borrowerId,
        type: "borrow_rejected",
        title: "Borrow request declined",
        body: `Your request for "${checkout.product.name}" was not accepted.`,
        link: "/dashboard/my-borrows",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/borrow-orders/[id]/reject:", error);
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }
}
