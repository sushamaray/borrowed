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
    const role = searchParams.get("role"); // "lender" | "borrower"

    const include = {
      checkout: {
        select: {
          id: true,
          product: { select: { name: true, imageUrl: true, category: true } },
        },
      },
      resolution: { select: { decisionType: true, resolvedAt: true } },
    };

    if (role === "lender") {
      const disputes = await prisma.dispute.findMany({
        where: { lenderId: userId },
        include,
        orderBy: { raisedAt: "desc" },
      });
      return NextResponse.json(disputes);
    }

    if (role === "borrower") {
      const disputes = await prisma.dispute.findMany({
        where: { borrowerId: userId },
        include,
        orderBy: { raisedAt: "desc" },
      });
      return NextResponse.json(disputes);
    }

    const disputes = await prisma.dispute.findMany({
      where: { OR: [{ lenderId: userId }, { borrowerId: userId }] },
      include,
      orderBy: { raisedAt: "desc" },
    });
    return NextResponse.json(disputes);
  } catch (error) {
    console.error("GET /api/disputes:", error);
    return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      checkoutId: string;
      title: string;
      description: string;
      beforePhotoUrl?: string;
      afterPhotoUrl?: string;
    };

    const { checkoutId, title, description, beforePhotoUrl, afterPhotoUrl } = body;

    if (!checkoutId?.trim() || !title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "checkoutId, title, and description are required" },
        { status: 400 }
      );
    }

    const checkout = await prisma.borrowCheckout.findUnique({
      where: { id: checkoutId },
      include: {
        product:  { select: { name: true } },
        borrower: { select: { name: true, firstName: true, userName: true } },
        dispute:  { select: { id: true } },
      },
    });

    if (!checkout) {
      return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
    }
    if (checkout.lenderId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (checkout.status !== "returned") {
      return NextResponse.json(
        { error: "Can only dispute returned items" },
        { status: 409 }
      );
    }
    if (checkout.dispute) {
      return NextResponse.json(
        { error: "A dispute already exists for this checkout" },
        { status: 409 }
      );
    }

    const depositAmount = checkout.deposit ?? 0;

    const [dispute] = await prisma.$transaction([
      prisma.dispute.create({
        data: {
          checkoutId,
          raisedById: session.user.id,
          borrowerId: checkout.borrowerId,
          lenderId: checkout.lenderId,
          title: title.trim(),
          description: description.trim(),
          depositAmount,
          beforePhotoUrl: beforePhotoUrl ?? null,
          afterPhotoUrl: afterPhotoUrl ?? null,
        },
      }),
    ]);

    await prisma.$transaction([
      prisma.disputeEvent.create({
        data: {
          disputeId: dispute.id,
          actorRole: "lender",
          type: "raised",
          body: description.trim(),
        },
      }),
      prisma.notification.create({
        data: {
          userId: checkout.borrowerId,
          type: "dispute_raised",
          title: "Dispute raised",
          body: `The lender has raised a dispute for "${checkout.product.name}"`,
          link: "/dashboard/my-borrows",
        },
      }),
    ]);

    return NextResponse.json({ disputeId: dispute.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/disputes:", error);
    return NextResponse.json({ error: "Failed to create dispute" }, { status: 500 });
  }
}
