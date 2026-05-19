import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const borrowRequest = await prisma.borrowRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, firstName: true, lastName: true, userName: true } },
        offers: {
          include: {
            lender: { select: { id: true, name: true, firstName: true, lastName: true, userName: true } },
            product: { select: { id: true, slug: true, name: true, category: true, pricePerDay: true, deposit: true, imageUrl: true, location: true, description: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!borrowRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(borrowRequest);
  } catch (error) {
    console.error("GET /api/borrow-requests/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 });
  }
}
