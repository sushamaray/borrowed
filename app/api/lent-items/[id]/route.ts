import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

async function getOwnedItem(id: string, userId: string) {
  const item = await prisma.lentItem.findUnique({ where: { id } });
  if (!item) return { error: "Item not found", status: 404 };
  if (item.lenderId !== userId) return { error: "Forbidden", status: 403 };
  return { item };
}

// Toggle active ↔ inactive
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await getOwnedItem(id, session.user.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { item } = result;
    if (item.status === "borrowed") {
      return NextResponse.json(
        { error: "Cannot change status while item is borrowed" },
        { status: 409 },
      );
    }

    const newStatus = item.status === "active" ? "inactive" : "active";
    const updated = await prisma.lentItem.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/lent-items/[id]:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}

// Remove listing (only if not currently borrowed)
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await getOwnedItem(id, session.user.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { item } = result;
    if (item.status === "borrowed") {
      return NextResponse.json(
        { error: "Cannot remove an item that is currently borrowed" },
        { status: 409 },
      );
    }

    await prisma.lentItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/lent-items/[id]:", error);
    return NextResponse.json({ error: "Failed to remove listing" }, { status: 500 });
  }
}
