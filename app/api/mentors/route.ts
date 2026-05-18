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
