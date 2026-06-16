import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { UserDetail, UserCheckout, UserDispute } from "@/lib/admin/users/types";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const u = await prisma.user.findUnique({
      where: { id },
      include: {
        idVerification: {
          select: {
            status: true,
            faceMatchScore: true,
            submittedAt: true,
            reviewedAt: true,
            frontMimeType: true,
            backMimeType: true,
            selfieMimeType: true,
          },
        },
        products: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            category: true,
            pricePerDay: true,
            imageUrl: true,
            createdAt: true,
          },
        },
        lentItems: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            createdAt: true,
            product: { select: { name: true } },
          },
        },
        checkoutsAsBorrower: {
          take: 50,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            totalPrice: true,
            createdAt: true,
            product: { select: { name: true } },
            lender: { select: { name: true, firstName: true, userName: true } },
          },
        },
        checkoutsAsLender: {
          take: 50,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            totalPrice: true,
            createdAt: true,
            product: { select: { name: true } },
            borrower: { select: { name: true, firstName: true, userName: true } },
          },
        },
        borrowRequests: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            category: true,
            budgetPerDay: true,
            neededFrom: true,
            neededUntil: true,
            status: true,
          },
        },
        borrowRequestOffers: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            createdAt: true,
            product: { select: { name: true } },
            borrowRequest: { select: { title: true } },
          },
        },
        disputesAsBorrower: {
          orderBy: { raisedAt: "desc" },
          select: {
            id: true,
            status: true,
            depositAmount: true,
            raisedAt: true,
            title: true,
            checkout: { select: { product: { select: { name: true } } } },
          },
        },
        disputesAsLender: {
          orderBy: { raisedAt: "desc" },
          select: {
            id: true,
            status: true,
            depositAmount: true,
            raisedAt: true,
            title: true,
            checkout: { select: { product: { select: { name: true } } } },
          },
        },
        trailEntries: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            itemRating: true,
            useFor: true,
            location: true,
            tags: true,
            isPublic: true,
            anonymous: true,
            createdAt: true,
            product: { select: { name: true } },
          },
        },
        mentorBookings: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            sessionFormat: true,
            scheduledAt: true,
            status: true,
            mentor: { select: { name: true } },
          },
        },
        cartItems: {
          select: {
            id: true,
            days: true,
            addedAt: true,
            lentItem: { select: { product: { select: { name: true } } } },
          },
        },
        reportsReceived: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            reason: true,
            description: true,
            status: true,
            readByAdmin: true,
            createdAt: true,
            reporter: { select: { id: true, name: true, firstName: true, userName: true } },
          },
        },
        _count: {
          select: {
            products: true,
            checkoutsAsBorrower: true,
            checkoutsAsLender: true,
            disputesRaised: true,
            borrowRequests: true,
            trailEntries: true,
            reportsReceived: true,
          },
        },
      },
    });

    if (!u) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const name = displayName(u);

    const borrowerDisputes: UserDispute[] = u.disputesAsBorrower.map((d) => ({
      id: d.id,
      status: d.status,
      depositAmount: d.depositAmount,
      raisedAt: d.raisedAt.toISOString(),
      title: d.title,
      itemName: d.checkout.product.name,
      role: "borrower",
    }));

    const lenderDisputes: UserDispute[] = u.disputesAsLender.map((d) => ({
      id: d.id,
      status: d.status,
      depositAmount: d.depositAmount,
      raisedAt: d.raisedAt.toISOString(),
      title: d.title,
      itemName: d.checkout.product.name,
      role: "lender",
    }));

    const allDisputes = [...borrowerDisputes, ...lenderDisputes].sort(
      (a, b) => new Date(b.raisedAt).getTime() - new Date(a.raisedAt).getTime()
    );

    const checkoutsAsBorrower: UserCheckout[] = u.checkoutsAsBorrower.map((c) => ({
      id: c.id,
      status: c.status,
      startDate: c.startDate?.toISOString() ?? null,
      endDate: c.endDate?.toISOString() ?? null,
      totalPrice: c.totalPrice,
      createdAt: c.createdAt.toISOString(),
      itemName: c.product.name,
      counterpartyName: displayName(c.lender),
    }));

    const checkoutsAsLender: UserCheckout[] = u.checkoutsAsLender.map((c) => ({
      id: c.id,
      status: c.status,
      startDate: c.startDate?.toISOString() ?? null,
      endDate: c.endDate?.toISOString() ?? null,
      totalPrice: c.totalPrice,
      createdAt: c.createdAt.toISOString(),
      itemName: c.product.name,
      counterpartyName: displayName(c.borrower),
    }));

    const detail: UserDetail = {
      id: u.id,
      name,
      initials: initials(name),
      email: u.email,
      phoneNumber: u.phoneNumber,
      location: u.location,
      profilePicture: u.profilePicture ?? u.image,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt.toISOString(),
      trustScore: computeTrustScore(u),
      verifications: {
        identity: u.identityVerified,
        contact:  u.contactVerified,
        id:       u.idVerified,
        address:  u.addressVerified,
        meetup:   u.meetupVerified,
        verifiedAt: u.verifiedAt?.toISOString() ?? null,
      },
      idVerification: u.idVerification
        ? {
            status: u.idVerification.status,
            faceMatchScore: u.idVerification.faceMatchScore,
            submittedAt: u.idVerification.submittedAt.toISOString(),
            reviewedAt: u.idVerification.reviewedAt?.toISOString() ?? null,
            hasFront: !!u.idVerification.frontMimeType,
            hasBack: !!u.idVerification.backMimeType,
            hasSelfie: !!u.idVerification.selfieMimeType,
          }
        : null,
      products: u.products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        pricePerDay: p.pricePerDay,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt.toISOString(),
      })),
      lentItems: u.lentItems.map((li) => ({
        id: li.id,
        productName: li.product.name,
        status: li.status,
        createdAt: li.createdAt.toISOString(),
      })),
      checkoutsAsBorrower,
      checkoutsAsLender,
      borrowRequests: u.borrowRequests.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        budgetPerDay: r.budgetPerDay,
        neededFrom: r.neededFrom.toISOString(),
        neededUntil: r.neededUntil.toISOString(),
        status: r.status,
      })),
      borrowRequestOffers: u.borrowRequestOffers.map((o) => ({
        id: o.id,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        productName: o.product.name,
        requestTitle: o.borrowRequest.title,
      })),
      disputes: allDisputes,
      reports: u.reportsReceived.map((r) => ({
        id: r.id,
        reason: r.reason,
        description: r.description,
        status: r.status,
        readByAdmin: r.readByAdmin,
        createdAt: r.createdAt.toISOString(),
        reporterName: displayName(r.reporter),
        reporterId: r.reporter.id,
      })),
      trailEntries: u.trailEntries.map((t) => ({
        id: t.id,
        itemRating: t.itemRating,
        useFor: t.useFor,
        location: t.location,
        tags: t.tags,
        isPublic: t.isPublic,
        anonymous: t.anonymous,
        createdAt: t.createdAt.toISOString(),
        productName: t.product?.name ?? null,
      })),
      mentorBookings: u.mentorBookings.map((b) => ({
        id: b.id,
        sessionFormat: b.sessionFormat,
        scheduledAt: b.scheduledAt?.toISOString() ?? null,
        status: b.status,
        mentorName: b.mentor.name,
      })),
      cartItems: u.cartItems.map((ci) => ({
        id: ci.id,
        days: ci.days,
        addedAt: ci.addedAt.toISOString(),
        itemName: ci.lentItem.product.name,
      })),
      counts: {
        products:      u._count.products,
        borrows:       u._count.checkoutsAsBorrower,
        lends:         u._count.checkoutsAsLender,
        disputes:      u._count.disputesRaised,
        borrowRequests: u._count.borrowRequests,
        trailEntries:  u._count.trailEntries,
        reports:       u._count.reportsReceived,
      },
    };

    return NextResponse.json(detail);
  } catch (error) {
    console.error("GET /api/admin/users/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
