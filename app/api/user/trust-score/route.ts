import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Max score from verification alone is 80. The remaining 20 will come from
// user reviews (not implemented yet).
const SCORE_WEIGHTS = {
  email: 16,       // always awarded — user must be logged in
  contact: 16,     // contactVerified
  id: 16,          // idVerified
  identity: 16,    // identityVerified (face match)
  address: 16,     // addressVerified
} as const;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        identityVerified: true,
        contactVerified: true,
        idVerified: true,
        addressVerified: true,
        meetupVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const breakdown = {
      email: SCORE_WEIGHTS.email,
      contact: user.contactVerified ? SCORE_WEIGHTS.contact : 0,
      id: user.idVerified ? SCORE_WEIGHTS.id : 0,
      identity: user.identityVerified ? SCORE_WEIGHTS.identity : 0,
      address: user.addressVerified ? SCORE_WEIGHTS.address : 0,
    };

    const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

    return NextResponse.json({ score, max: 80, breakdown });
  } catch (error) {
    console.error("GET /api/user/trust-score:", error);
    return NextResponse.json({ error: "Failed to calculate trust score" }, { status: 500 });
  }
}
