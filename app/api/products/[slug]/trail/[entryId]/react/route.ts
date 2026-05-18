import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ slug: string; entryId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entryId } = await props.params;
  const { type } = (await req.json()) as { type: string };
  const validTypes = ["heart", "fire", "star", "wow"];
  if (!validTypes.includes(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const entry = await prisma.itemTrailEntry.findUnique({ where: { id: entryId }, select: { id: true } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.trailReaction.findUnique({
    where: { trailEntryId_userId: { trailEntryId: entryId, userId: session.user.id } },
  });

  if (existing?.type === type) {
    // Toggle off
    await prisma.trailReaction.delete({
      where: { trailEntryId_userId: { trailEntryId: entryId, userId: session.user.id } },
    });
    return NextResponse.json({ myReaction: null });
  }

  await prisma.trailReaction.upsert({
    where: { trailEntryId_userId: { trailEntryId: entryId, userId: session.user.id } },
    update: { type },
    create: { trailEntryId: entryId, userId: session.user.id, type },
  });

  return NextResponse.json({ myReaction: type });
}
