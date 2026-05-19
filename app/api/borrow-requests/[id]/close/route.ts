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

    const borrowRequest = await prisma.borrowRequest.findUnique({ where: { id } });

    if (!borrowRequest) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (borrowRequest.requesterId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (borrowRequest.status !== "open") return NextResponse.json({ error: "Request is not open" }, { status: 409 });

    await prisma.borrowRequest.update({ where: { id }, data: { status: "closed" } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/borrow-requests/[id]/close:", error);
    return NextResponse.json({ error: "Failed to close request" }, { status: 500 });
  }
}
