import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; offerId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, offerId } = await params;

    const offer = await prisma.borrowRequestOffer.findUnique({
      where: { id: offerId },
      include: {
        borrowRequest: { select: { id: true, requesterId: true, status: true, title: true } },
        product: { select: { name: true } },
      },
    });

    if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (offer.borrowRequestId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (offer.borrowRequest.requesterId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (offer.status !== "pending") return NextResponse.json({ error: "Offer is not pending" }, { status: 409 });

    await prisma.borrowRequestOffer.update({
      where: { id: offerId },
      data: { status: "rejected" },
    });

    await prisma.notification.create({
      data: {
        userId: offer.lenderId,
        type: "offer_rejected",
        title: "Your offer was not accepted",
        body: `Your offer of "${offer.product.name}" for "${offer.borrowRequest.title}" was declined.`,
        link: "/dashboard/borrow-requests",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/borrow-requests/[id]/offers/[offerId]/reject:", error);
    return NextResponse.json({ error: "Failed to reject offer" }, { status: 500 });
  }
}
