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
        conditionPhotos: { select: { id: true, role: true } },
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

    // Auto-derive photo URLs from stored condition photos if not supplied by client
    const beforePhoto = checkout.conditionPhotos.find((p) => p.role === "before");
    const afterPhoto  = checkout.conditionPhotos.find((p) => p.role === "after");
    const resolvedBeforeUrl = beforePhotoUrl ?? (beforePhoto ? `/api/condition-photos/${beforePhoto.id}` : null);
    const resolvedAfterUrl  = afterPhotoUrl  ?? (afterPhoto  ? `/api/condition-photos/${afterPhoto.id}`  : null);

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
          beforePhotoUrl: resolvedBeforeUrl,
          afterPhotoUrl:  resolvedAfterUrl,
          // Auto-populate AI damage analysis from the checkout
          aiVerdict:    checkout.aiDamageVerdict    ?? null,
          aiConfidence: checkout.aiDamageConfidence ?? null,
          aiNotes:      checkout.aiDamageNotes      ?? null,
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

    // Copy existing lender–borrower conversation messages into the dispute as
    // DisputeEvent rows so the admin chat log shows real communication history
    // instead of the MOCK_CHAT placeholder.
    const conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: checkout.lenderId } } },
          { participants: { some: { userId: checkout.borrowerId } } },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
          select: { senderId: true, content: true, createdAt: true },
        },
      },
    });

    if (conversation && conversation.messages.length > 0) {
      // Only include messages from the "damage-context" session (after item was returned)
      const relevantMessages = checkout.returnedAt
        ? conversation.messages.filter((m) => m.createdAt >= checkout.returnedAt!)
        : conversation.messages;

      if (relevantMessages.length > 0) {
        await prisma.disputeEvent.createMany({
          data: relevantMessages.map((m) => ({
            disputeId: dispute.id,
            actorRole: m.senderId === checkout.lenderId ? "lender" : "borrower",
            type: "message",
            body: m.content,
            createdAt: m.createdAt,
          })),
        });
      }
    }

    return NextResponse.json({ disputeId: dispute.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/disputes:", error);
    return NextResponse.json({ error: "Failed to create dispute" }, { status: 500 });
  }
}
