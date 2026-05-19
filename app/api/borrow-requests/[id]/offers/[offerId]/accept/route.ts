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
        product: { select: { id: true, name: true } },
        lender: { select: { name: true, firstName: true, lastName: true, userName: true } },
      },
    });

    if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (offer.borrowRequestId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (offer.borrowRequest.requesterId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (offer.borrowRequest.status !== "open") return NextResponse.json({ error: "Request is not open" }, { status: 409 });
    if (offer.status !== "pending") return NextResponse.json({ error: "Offer is not pending" }, { status: 409 });

    const checkout = await prisma.$transaction(async (tx) => {
      const newCheckout = await tx.borrowCheckout.create({
        data: {
          borrowerId:           offer.borrowRequest.requesterId,
          lenderId:             offer.lenderId,
          productId:            offer.productId,
          borrowRequestOfferId: offerId,
          originType:           "borrow_request",
          status:               "pending",
        },
      });

      await tx.borrowRequestOffer.update({
        where: { id: offerId },
        data: { status: "accepted" },
      });

      await tx.borrowRequestOffer.updateMany({
        where: { borrowRequestId: id, id: { not: offerId }, status: "pending" },
        data: { status: "rejected" },
      });

      await tx.borrowRequest.update({
        where: { id },
        data: { status: "fulfilled" },
      });

      return newCheckout;
    });

    const lenderName =
      offer.lender.firstName ?? offer.lender.name ?? offer.lender.userName ?? "The borrower";

    await prisma.notification.create({
      data: {
        userId: offer.lenderId,
        type: "offer_accepted",
        title: "Your offer was accepted",
        body: `${lenderName} accepted your offer for "${offer.borrowRequest.title}"`,
        link: "/dashboard/my-items",
      },
    });

    return NextResponse.json({ ok: true, checkoutId: checkout.id });
  } catch (error) {
    console.error("PATCH /api/borrow-requests/[id]/offers/[offerId]/accept:", error);
    return NextResponse.json({ error: "Failed to accept offer" }, { status: 500 });
  }
}
