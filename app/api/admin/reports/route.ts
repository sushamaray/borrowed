import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function displayName(u: { name?: string | null; firstName?: string | null; userName?: string | null }) {
  return u.name ?? u.firstName ?? u.userName ?? "Unknown";
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reports = await prisma.userReport.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reason: true,
        description: true,
        status: true,
        readByAdmin: true,
        createdAt: true,
        reporter: { select: { id: true, name: true, firstName: true, userName: true } },
        reported: { select: { id: true, name: true, firstName: true, userName: true } },
      },
    });

    return NextResponse.json(
      reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        description: r.description,
        status: r.status,
        readByAdmin: r.readByAdmin,
        createdAt: r.createdAt.toISOString(),
        reporterId: r.reporter.id,
        reporterName: displayName(r.reporter),
        reportedUserId: r.reported.id,
        reportedName: displayName(r.reported),
      }))
    );
  } catch (error) {
    console.error("GET /api/admin/reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
