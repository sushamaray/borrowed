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
    const body = (await request.json()) as { rating?: unknown; comment?: unknown };

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be an integer from 1 to 5" }, { status: 400 });
    }

    const comment = typeof body.comment === "string" ? body.comment.trim() || null : null;

    const checkout = await prisma.borrowCheckout.findUnique({
      where: { id },
      include: {
        product:        { select: { name: true } },
        borrowerReview: { select: { id: true } },
      },
    });

    if (!checkout) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (checkout.lenderId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (checkout.status !== "returned") return NextResponse.json({ error: "Borrow must be returned first" }, { status: 409 });
    if (checkout.borrowerReview) return NextResponse.json({ error: "Already reviewed" }, { status: 409 });

    await prisma.$transaction([
      prisma.borrowerReview.create({
        data: {
          borrowCheckoutId: id,
          lenderId:  session.user.id,
          borrowerId: checkout.borrowerId,
          rating: Math.min(5, Math.max(1, Math.round(rating))),
          comment,
        },
      }),
      prisma.notification.create({
        data: {
          userId: checkout.borrowerId,
          type: "borrower_review",
          title: "You received a review",
          body: `Your lender left a rating for your borrow of "${checkout.product.name}"`,
          link: "/dashboard/my-borrows",
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/borrow-orders/[id]/review-borrower:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
