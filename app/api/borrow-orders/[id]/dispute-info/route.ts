import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const checkout = await prisma.borrowCheckout.findUnique({
      where: { id },
      select: {
        id: true,
        deposit: true,
        returnedAt: true,
        lenderId: true,
        product: { select: { name: true } },
        conditionPhotos: { select: { id: true, role: true } },
        dispute: { select: { id: true } },
      },
    });

    if (!checkout) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (checkout.lenderId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: checkout.id,
      deposit: checkout.deposit,
      returnedAt: checkout.returnedAt?.toISOString() ?? null,
      hasDispute: !!checkout.dispute,
      product: checkout.product,
      conditionPhotos: checkout.conditionPhotos,
    });
  } catch (error) {
    console.error("GET /api/borrow-orders/[id]/dispute-info:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
