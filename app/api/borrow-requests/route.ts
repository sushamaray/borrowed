import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "true";

    const where = mine
      ? { requesterId: session.user.id }
      : { status: "open", NOT: { requesterId: session.user.id } };

    const requests = await prisma.borrowRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, firstName: true, lastName: true, userName: true } },
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/borrow-requests:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      title: string;
      category?: string;
      description?: string;
      location?: string;
      neededFrom: string;
      neededUntil: string;
      budgetPerDay?: number;
    };

    const { title, category, description, location, neededFrom, neededUntil, budgetPerDay } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!neededFrom || !neededUntil) {
      return NextResponse.json({ error: "neededFrom and neededUntil are required" }, { status: 400 });
    }

    const borrowRequest = await prisma.borrowRequest.create({
      data: {
        requesterId: session.user.id,
        title: title.trim(),
        category: category ?? null,
        description: description?.trim() ?? null,
        location: location?.trim() ?? null,
        neededFrom: new Date(neededFrom),
        neededUntil: new Date(neededUntil),
        budgetPerDay: budgetPerDay ?? null,
        status: "open",
      },
    });

    return NextResponse.json(borrowRequest, { status: 201 });
  } catch (error) {
    console.error("POST /api/borrow-requests:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
