import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { UserListItem } from "@/lib/admin/users/types";

function computeTrustScore(u: {
  identityVerified: boolean;
  contactVerified: boolean;
  idVerified: boolean;
  addressVerified: boolean;
  meetupVerified: boolean;
}) {
  let score = 0;
  if (u.identityVerified) score += 20;
  if (u.contactVerified)  score += 20;
  if (u.idVerified)       score += 20;
  if (u.addressVerified)  score += 20;
  if (u.meetupVerified)   score += 20;
  return score;
}

function displayName(u: { name?: string | null; firstName?: string | null; userName?: string | null }) {
  return u.name ?? u.firstName ?? u.userName ?? "Unknown";
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        firstName: true,
        userName: true,
        email: true,
        location: true,
        isAdmin: true,
        createdAt: true,
        identityVerified: true,
        contactVerified: true,
        idVerified: true,
        addressVerified: true,
        meetupVerified: true,
        _count: {
          select: {
            products: true,
            checkoutsAsBorrower: true,
            checkoutsAsLender: true,
            disputesRaised: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const list: UserListItem[] = users.map((u) => {
      const name = displayName(u);
      const verifications = {
        identity: u.identityVerified,
        contact:  u.contactVerified,
        id:       u.idVerified,
        address:  u.addressVerified,
        meetup:   u.meetupVerified,
      };
      const verificationCount = Object.values(verifications).filter(Boolean).length;
      return {
        id: u.id,
        name,
        initials: initials(name),
        email: u.email,
        location: u.location,
        isAdmin: u.isAdmin,
        trustScore: computeTrustScore(u),
        verificationCount,
        verifications,
        counts: {
          products: u._count.products,
          borrows:  u._count.checkoutsAsBorrower,
          lends:    u._count.checkoutsAsLender,
          disputes: u._count.disputesRaised,
        },
        joinedAt: u.createdAt.toISOString(),
      };
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error("GET /api/admin/users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
