import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        checkout: {
          select: {
            id: true,
            product: { select: { name: true, imageUrl: true, category: true } },
          },
        },
        borrower: {
          select: {
            id: true, name: true, firstName: true, lastName: true, userName: true,
            identityVerified: true, contactVerified: true, idVerified: true,
            addressVerified: true, meetupVerified: true, createdAt: true,
            checkoutsAsBorrower: { select: { id: true } },
            checkoutsAsLender:   { select: { id: true } },
          },
        },
        lender: {
          select: {
            id: true, name: true, firstName: true, lastName: true, userName: true,
            identityVerified: true, contactVerified: true, idVerified: true,
            addressVerified: true, meetupVerified: true, createdAt: true,
            checkoutsAsBorrower: { select: { id: true } },
            checkoutsAsLender:   { select: { id: true } },
          },
        },
        events:     { orderBy: { createdAt: "asc" } },
        resolution: {
          include: {
            resolvedBy: { select: { name: true, firstName: true, userName: true } },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isInvolved =
      dispute.borrowerId === userId ||
      dispute.lenderId === userId ||
      session.user.isAdmin;

    if (!isInvolved) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(dispute);
  } catch (error) {
    console.error("GET /api/disputes/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch dispute" }, { status: 500 });
  }
}
