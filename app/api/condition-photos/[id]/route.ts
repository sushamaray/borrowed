import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const photo = await prisma.conditionPhoto.findUnique({
    where: { id },
    select: {
      data: true,
      mimeType: true,
      checkout: { select: { borrowerId: true, lenderId: true } },
    },
  });

  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = session.user.id;
  const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin === true;
  if (
    !isAdmin &&
    photo.checkout.borrowerId !== userId &&
    photo.checkout.lenderId !== userId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return new NextResponse(photo.data, {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
