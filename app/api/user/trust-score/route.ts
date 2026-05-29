import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const SCORE_WEIGHTS = {
  email: 16,
  contact: 16,
  id: 16,
  identity: 16,
  address: 16,
  reviews: 20,
} as const;

function reviewScore(entries: { itemRating: number }[]): number {
  const n = entries.length;
  if (n === 0) return 0;
  if (n < 3) return 10;
  if (n < 5) return 15;
  const avg = entries.reduce((s, e) => s + e.itemRating, 0) / n;
  return avg >= 4 ? 20 : 15;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, trailEntries] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          identityVerified: true,
          contactVerified: true,
          idVerified: true,
          addressVerified: true,
          meetupVerified: true,
        },
      }),
      prisma.itemTrailEntry.findMany({
        where: { borrowerId: session.user.id, isPublic: true },
        select: { itemRating: true },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const breakdown = {
      email: SCORE_WEIGHTS.email,
      contact: user.contactVerified ? SCORE_WEIGHTS.contact : 0,
      id: user.idVerified ? SCORE_WEIGHTS.id : 0,
      identity: user.identityVerified ? SCORE_WEIGHTS.identity : 0,
      address: user.addressVerified ? SCORE_WEIGHTS.address : 0,
      reviews: reviewScore(trailEntries),
    };

    const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

    return NextResponse.json({ score, max: 100, breakdown });
  } catch (error) {
    console.error("GET /api/user/trust-score:", error);
    return NextResponse.json({ error: "Failed to calculate trust score" }, { status: 500 });
  }
}
