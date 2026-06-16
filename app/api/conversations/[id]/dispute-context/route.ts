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

    const { id: conversationId } = await params;
    const userId = session.user.id;

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { userId: true } } },
    });

    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const participantIds = conv.participants.map((p) => p.userId);
    if (!participantIds.includes(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const otherId = participantIds.find((id) => id !== userId);
    if (!otherId) {
      return NextResponse.json({ dispute: null, eligibleCheckout: null });
    }

    // Active (non-resolved) dispute between these two users
    const dispute = await prisma.dispute.findFirst({
      where: {
        OR: [
          { lenderId: userId, borrowerId: otherId },
          { lenderId: otherId, borrowerId: userId },
        ],
        status: { not: "RESOLVED" },
      },
      select: { id: true, status: true, title: true },
    });

    // Eligible checkout: current user is lender, other is borrower, returned, no dispute
    const eligibleCheckout = dispute
      ? null
      : await prisma.borrowCheckout.findFirst({
          where: {
            lenderId: userId,
            borrowerId: otherId,
            status: "returned",
            dispute: null,
          },
          select: {
            id: true,
            deposit: true,
            product: { select: { name: true } },
            conditionPhotos: { select: { id: true, role: true } },
          },
        });

    return NextResponse.json({ dispute, eligibleCheckout });
  } catch (error) {
    console.error("GET /api/conversations/[id]/dispute-context:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
