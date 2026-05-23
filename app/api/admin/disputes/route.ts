import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function computeTrustScore(user: {
  identityVerified: boolean;
  contactVerified: boolean;
  idVerified: boolean;
  addressVerified: boolean;
  meetupVerified: boolean;
}) {
  let score = 0;
  if (user.identityVerified) score += 20;
  if (user.contactVerified)  score += 20;
  if (user.idVerified)       score += 20;
  if (user.addressVerified)  score += 20;
  if (user.meetupVerified)   score += 20;
  return score;
}

function displayName(u: { name?: string | null; firstName?: string | null; userName?: string | null }) {
  return u.name ?? u.firstName ?? u.userName ?? "Unknown";
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const disputes = await prisma.dispute.findMany({
      include: {
        checkout: {
          select: {
            product: { select: { name: true, category: true } },
          },
        },
        borrower: { select: { name: true, firstName: true, userName: true } },
        lender:   { select: { name: true, firstName: true, userName: true } },
        resolution: { select: { decisionType: true } },
      },
      orderBy: { raisedAt: "desc" },
    });

    const list = disputes.map((d) => {
      const borrowerName = displayName(d.borrower);
      const lenderName   = displayName(d.lender);
      return {
        id:            d.id,
        status:        d.status,
        itemName:      d.checkout.product.name,
        itemCategory:  d.checkout.product.category,
        depositAmount: d.depositAmount,
        raisedAt:      d.raisedAt.toISOString(),
        borrower:      { name: borrowerName, initials: initials(borrowerName) },
        lender:        { name: lenderName,   initials: initials(lenderName)   },
        aiVerdict:     d.aiVerdict,
      };
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error("GET /api/admin/disputes:", error);
    return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}
