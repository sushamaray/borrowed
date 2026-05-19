import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentor = await prisma.mentor.findUnique({
      where: { userId: session.user.id },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Not a mentor" }, { status: 404 });
    }

    return NextResponse.json(mentor);
  } catch (error) {
    console.error("GET /api/mentors/me:", error);
    return NextResponse.json({ error: "Failed to fetch mentor profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
    if (!mentor) {
      return NextResponse.json({ error: "Not a mentor" }, { status: 404 });
    }

    const body = await request.json();
    const { name, specialty, category, subcategories, bio, tags, pricePerSession, responseTime, available, avatar } = body;

    const updated = await prisma.mentor.update({
      where: { userId: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(specialty !== undefined && { specialty }),
        ...(category !== undefined && { category }),
        ...(subcategories !== undefined && { subcategories: Array.isArray(subcategories) ? subcategories : [] }),
        ...(bio !== undefined && { bio }),
        ...(tags !== undefined && { tags }),
        ...(pricePerSession !== undefined && { pricePerSession: Number(pricePerSession) }),
        ...(responseTime !== undefined && { responseTime }),
        ...(available !== undefined && { available: Boolean(available) }),
        ...(avatar !== undefined && { avatar }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/mentors/me:", error);
    return NextResponse.json({ error: "Failed to update mentor profile" }, { status: 500 });
  }
}
