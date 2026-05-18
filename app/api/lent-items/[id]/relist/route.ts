import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const item = await prisma.lentItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (item.lenderId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (item.status !== "borrowed") {
      return NextResponse.json({ error: "Item is not in borrowed state" }, { status: 409 });
    }

    const updated = await prisma.lentItem.update({
      where: { id },
      data: { status: "active" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/lent-items/[id]/relist:", error);
    return NextResponse.json({ error: "Failed to re-list item" }, { status: 500 });
  }
}
