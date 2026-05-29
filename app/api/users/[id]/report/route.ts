import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const VALID_REASONS = ["spam", "scam", "harassment", "fake_listing", "inappropriate", "other"] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reportedUserId } = await params;

    if (session.user.id === reportedUserId) {
      return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
    }

    const body = (await request.json()) as { reason?: unknown; description?: unknown };
    const reason = body.reason as string;

    if (!VALID_REASONS.includes(reason as typeof VALID_REASONS[number])) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }

    const description = typeof body.description === "string" ? body.description.trim() || null : null;

    await prisma.userReport.create({
      data: {
        reporterId:     session.user.id,
        reportedUserId,
        reason,
        description,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/users/[id]/report:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
