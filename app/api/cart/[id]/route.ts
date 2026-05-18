import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { days } = body;

    if (!days || days < 1) {
      return NextResponse.json({ error: "days must be >= 1" }, { status: 400 });
    }

    const cartItem = await prisma.cartItem.findUnique({ where: { id } });
    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }
    if (cartItem.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { days },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/cart/[id]:", error);
    return NextResponse.json({ error: "Failed to update cart item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const cartItem = await prisma.cartItem.findUnique({ where: { id } });
    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }
    if (cartItem.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.cartItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/cart/[id]:", error);
    return NextResponse.json({ error: "Failed to remove cart item" }, { status: 500 });
  }
}
