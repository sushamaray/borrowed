import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";

    const mentors = await prisma.mentor.findMany({
      where: {
        ...(category && category !== "All" ? { category } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { specialty: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: [{ available: "desc" }, { rating: "desc" }],
    });

    return NextResponse.json(mentors);
  } catch (error) {
    console.error("GET /api/mentors:", error);
    return NextResponse.json({ error: "Failed to fetch mentors" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
    if (existing) {
      return NextResponse.json({ error: "Already a mentor" }, { status: 409 });
    }

    const body = await request.json();
    const { name, handle, specialty, category, subcategories, bio, tags, pricePerSession, responseTime, avatar } = body;

    if (!name || !handle || !specialty || !bio || !pricePerSession || !responseTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const handleExists = await prisma.mentor.findUnique({ where: { handle } });
    if (handleExists) {
      return NextResponse.json({ error: "Handle already taken" }, { status: 409 });
    }

    const mentor = await prisma.mentor.create({
      data: {
        userId: session.user.id,
        name,
        handle,
        specialty,
        category: category ?? "",
        subcategories: Array.isArray(subcategories) ? subcategories : [],
        bio,
        tags: tags ?? [],
        pricePerSession: Number(pricePerSession),
        responseTime,
        avatar: avatar ?? "",
      },
    });

    return NextResponse.json(mentor, { status: 201 });
  } catch (error) {
    console.error("POST /api/mentors:", error);
    return NextResponse.json({ error: "Failed to create mentor profile" }, { status: 500 });
  }
}
