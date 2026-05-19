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
    const body = await request.json() as { productId: string; message?: string };
    const { productId, message } = body;

    if (!productId?.trim()) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const borrowRequest = await prisma.borrowRequest.findUnique({ where: { id } });
    if (!borrowRequest) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (borrowRequest.requesterId === session.user.id) {
      return NextResponse.json({ error: "Cannot offer on your own request" }, { status: 403 });
    }
    if (borrowRequest.status !== "open") {
      return NextResponse.json({ error: "Request is not open" }, { status: 409 });
    }

    const existing = await prisma.borrowRequestOffer.findFirst({
      where: { borrowRequestId: id, lenderId: session.user.id },
    });
    if (existing) {
      return NextResponse.json({ error: "You already submitted an offer" }, { status: 409 });
    }

    const offer = await prisma.borrowRequestOffer.create({
      data: {
        borrowRequestId: id,
        productId,
        lenderId: session.user.id,
        message: message?.trim() ?? null,
        status: "pending",
      },
      include: {
        product: { select: { name: true } },
        lender: { select: { name: true, firstName: true, lastName: true, userName: true } },
      },
    });

    const lenderName =
      (session.user as { firstName?: string }).firstName ??
      session.user.name ??
      "A lender";

    await prisma.notification.create({
      data: {
        userId: borrowRequest.requesterId,
        type: "new_offer",
        title: "New offer on your request",
        body: `${lenderName} offered "${offer.product.name}" for your request "${borrowRequest.title}"`,
        link: `/dashboard/borrow-requests/${id}`,
      },
    });

    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    console.error("POST /api/borrow-requests/[id]/offers:", error);
    return NextResponse.json({ error: "Failed to submit offer" }, { status: 500 });
  }
}
