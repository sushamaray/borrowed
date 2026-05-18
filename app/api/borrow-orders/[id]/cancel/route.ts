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

    const checkout = await prisma.borrowCheckout.findUnique({ where: { id } });

    if (!checkout) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (checkout.borrowerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (checkout.status !== "pending") {
      return NextResponse.json({ error: "Cannot cancel — already accepted or completed." }, { status: 409 });
    }

    await prisma.borrowCheckout.update({
      where: { id },
      data: { status: "cancelled", cancelledBy: "borrower" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/borrow-orders/[id]/cancel:", error);
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }
}
