import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const d = await prisma.dispute.findUnique({
      where: { id },
      include: {
        checkout: {
          select: {
            product: { select: { name: true, imageUrl: true, category: true } },
          },
        },
        borrower: {
          select: {
            id: true, name: true, firstName: true, userName: true,
            identityVerified: true, contactVerified: true,
            idVerified: true, addressVerified: true, meetupVerified: true,
            createdAt: true,
            checkoutsAsBorrower: { select: { id: true } },
            checkoutsAsLender:   { select: { id: true } },
          },
        },
        lender: {
          select: {
            id: true, name: true, firstName: true, userName: true,
            identityVerified: true, contactVerified: true,
            idVerified: true, addressVerified: true, meetupVerified: true,
            createdAt: true,
            checkoutsAsBorrower: { select: { id: true } },
            checkoutsAsLender:   { select: { id: true } },
          },
        },
        events: { orderBy: { createdAt: "asc" } },
        resolution: {
          include: {
            resolvedBy: { select: { name: true, firstName: true, userName: true } },
          },
        },
      },
    });

    if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const borrowerName = displayName(d.borrower);
    const lenderName   = displayName(d.lender);
    const since = (u: { createdAt: Date }) =>
      u.createdAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" });

    const detail = {
      id:            d.id,
      status:        d.status,
      title:         d.title,
      description:   d.description,
      depositAmount: d.depositAmount,
      raisedAt:      d.raisedAt.toISOString(),
      itemName:      d.checkout.product.name,
      itemCategory:  d.checkout.product.category,
      itemImageUrl:  d.checkout.product.imageUrl,
      aiVerdict:     d.aiVerdict,
      aiConfidence:  d.aiConfidence,
      aiNotes:       d.aiNotes,
      beforePhotoUrl: d.beforePhotoUrl,
      afterPhotoUrl:  d.afterPhotoUrl,
      borrower: {
        id:          d.borrower.id,
        name:        borrowerName,
        initials:    initials(borrowerName),
        trustScore:  computeTrustScore(d.borrower),
        borrowCount: d.borrower.checkoutsAsBorrower.length,
        lendCount:   d.borrower.checkoutsAsLender.length,
        memberSince: since(d.borrower),
      },
      lender: {
        id:          d.lender.id,
        name:        lenderName,
        initials:    initials(lenderName),
        trustScore:  computeTrustScore(d.lender),
        borrowCount: d.lender.checkoutsAsBorrower.length,
        lendCount:   d.lender.checkoutsAsLender.length,
        memberSince: since(d.lender),
      },
      events: d.events.map((e) => ({
        id:        e.id,
        type:      e.type,
        actorRole: e.actorRole,
        actorName: e.actorRole === "system" ? "System"
                 : e.actorRole === "admin"  ? "Admin"
                 : e.actorRole === "lender" ? lenderName
                 : borrowerName,
        body:      e.body,
        createdAt: e.createdAt.toISOString(),
      })),
      resolution: d.resolution
        ? {
            decisionType:     d.resolution.decisionType,
            amountToLender:   d.resolution.amountToLender,
            amountToBorrower: d.resolution.amountToBorrower,
            justification:    d.resolution.justification,
            resolvedAt:       d.resolution.resolvedAt.toISOString(),
            resolvedByName:   displayName(d.resolution.resolvedBy),
          }
        : null,
    };

    return NextResponse.json(detail);
  } catch (error) {
    console.error("GET /api/admin/disputes/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch dispute" }, { status: 500 });
  }
}
