import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { entryId } = await params;
    const body = (await request.json()) as { isPublic?: unknown };

    if (typeof body.isPublic !== "boolean") {
      return NextResponse.json({ error: "isPublic must be a boolean" }, { status: 400 });
    }

    await prisma.itemTrailEntry.update({
      where: { id: entryId },
      data: { isPublic: body.isPublic },
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    console.error("PATCH /api/admin/trail/[entryId]:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { entryId } = await params;

    await prisma.itemTrailEntry.delete({ where: { id: entryId } });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    console.error("DELETE /api/admin/trail/[entryId]:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
