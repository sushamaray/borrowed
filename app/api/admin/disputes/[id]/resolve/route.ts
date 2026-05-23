import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { DecisionType } from "@/lib/generated/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as {
      decisionType: string;
      amountToLender?: number;
      amountToBorrower?: number;
      justification: string;
    };

    const { decisionType, amountToLender, amountToBorrower, justification } = body;

    if (!decisionType || !justification?.trim() || justification.trim().length < 20) {
      return NextResponse.json(
        { error: "decisionType and justification (min 20 chars) are required" },
        { status: 400 }
      );
    }

    const validDecisions: string[] = ["RELEASE_TO_LENDER", "RETURN_TO_BORROWER", "SPLIT"];
    if (!validDecisions.includes(decisionType)) {
      return NextResponse.json({ error: "Invalid decisionType" }, { status: 400 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        checkout: {
          select: { product: { select: { name: true } } },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }
    if (dispute.status === "RESOLVED" || dispute.status === "CLOSED") {
      return NextResponse.json({ error: "Dispute is already resolved" }, { status: 409 });
    }

    const [resolution] = await prisma.$transaction([
      prisma.disputeResolution.create({
        data: {
          disputeId:        id,
          resolvedById:     session.user.id,
          decisionType:     decisionType as DecisionType,
          amountToLender:   amountToLender  ?? null,
          amountToBorrower: amountToBorrower ?? null,
          justification:    justification.trim(),
        },
      }),
      prisma.dispute.update({
        where: { id },
        data: { status: "RESOLVED" },
      }),
      prisma.borrowCheckout.update({
        where: { id: dispute.checkoutId },
        data: {
          damageReport: {
            disputeId:    id,
            decisionType,
            amountToLender:   amountToLender  ?? null,
            amountToBorrower: amountToBorrower ?? null,
            resolvedAt:   new Date().toISOString(),
            resolvedBy:   session.user.id,
          },
        },
      }),
      prisma.disputeEvent.create({
        data: {
          disputeId: id,
          actorRole: "admin",
          type:      "resolved",
          body:      justification.trim(),
        },
      }),
    ]);

    await prisma.notification.createMany({
      data: [
        {
          userId: dispute.borrowerId,
          type:   "dispute_resolved",
          title:  "Dispute resolved",
          body:   `Admin has resolved the dispute for "${dispute.checkout.product.name}"`,
          link:   "/dashboard/my-borrows",
        },
        {
          userId: dispute.lenderId,
          type:   "dispute_resolved",
          title:  "Dispute resolved",
          body:   `Admin has resolved the dispute regarding "${dispute.checkout.product.name}"`,
          link:   "/dashboard/my-items",
        },
      ],
    });

    return NextResponse.json({ ok: true, resolutionId: resolution.id });
  } catch (error) {
    console.error("POST /api/admin/disputes/[id]/resolve:", error);
    return NextResponse.json({ error: "Failed to record decision" }, { status: 500 });
  }
}
