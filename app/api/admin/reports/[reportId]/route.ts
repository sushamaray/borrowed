import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const VALID_STATUSES = ["reviewed", "dismissed"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { reportId } = await params;
    const body = (await request.json()) as { status?: unknown; readByAdmin?: unknown };

    const data: { status?: string; readByAdmin?: boolean } = {};

    if (body.status !== undefined) {
      const status = body.status as string;
      if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
        return NextResponse.json({ error: "status must be 'reviewed' or 'dismissed'" }, { status: 400 });
      }
      data.status = status;
      data.readByAdmin = true;
    }

    if (body.readByAdmin !== undefined) {
      data.readByAdmin = Boolean(body.readByAdmin);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await prisma.userReport.update({
      where: { id: reportId },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    console.error("PATCH /api/admin/reports/[reportId]:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
