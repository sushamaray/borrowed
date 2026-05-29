import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { ProductDetail } from "@/lib/admin/products/types";

function displayName(u: { name?: string | null; firstName?: string | null; userName?: string | null }) {
  return u.name ?? u.firstName ?? u.userName ?? "Unknown";
}

function parseJson(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const p = await prisma.product.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, firstName: true, userName: true, email: true, location: true },
        },
        lentItems: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            lender: { select: { id: true, name: true, firstName: true, userName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        checkouts: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            totalPrice: true,
            createdAt: true,
            borrower: { select: { id: true, name: true, firstName: true, userName: true } },
            lender:   { select: { id: true, name: true, firstName: true, userName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        trailEntries: {
          select: {
            id: true,
            useFor: true,
            location: true,
            tags: true,
            itemRating: true,
            isPublic: true,
            anonymous: true,
            createdAt: true,
            borrower: { select: { id: true, name: true, firstName: true, userName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const activeLentItems = p.lentItems.filter((li) => li.status === "active").length;
    const totalRevenue = p.checkouts.reduce((sum, c) => {
      if ((c.status === "returned" || c.status === "accepted" || c.status === "active") && c.totalPrice) {
        return sum + c.totalPrice;
      }
      return sum;
    }, 0);

    const detail: ProductDetail = {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      location: p.location,
      pricePerDay: p.pricePerDay,
      deposit: p.deposit,
      description: p.description,
      features: parseJson(p.features),
      drawbacks: parseJson(p.drawbacks),
      imageUrl: p.imageUrl,
      compensationMajor: p.compensationMajor,
      compensationMinor: p.compensationMinor,
      lenderNote: p.lenderNote,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      createdBy: {
        id: p.createdBy.id,
        name: displayName(p.createdBy),
        email: p.createdBy.email,
        location: p.createdBy.location,
      },
      lentItems: p.lentItems.map((li) => ({
        id: li.id,
        status: li.status,
        createdAt: li.createdAt.toISOString(),
        lender: { id: li.lender.id, name: displayName(li.lender) },
      })),
      checkouts: p.checkouts.map((c) => ({
        id: c.id,
        status: c.status,
        startDate: c.startDate?.toISOString() ?? null,
        endDate: c.endDate?.toISOString() ?? null,
        totalPrice: c.totalPrice,
        createdAt: c.createdAt.toISOString(),
        borrower: { id: c.borrower.id, name: displayName(c.borrower) },
        lender:   { id: c.lender.id,   name: displayName(c.lender)   },
      })),
      trailEntries: p.trailEntries.map((t) => ({
        id: t.id,
        useFor: t.useFor,
        location: t.location,
        tags: t.tags,
        itemRating: t.itemRating,
        isPublic: t.isPublic,
        anonymous: t.anonymous,
        createdAt: t.createdAt.toISOString(),
        borrower: t.borrower ? { id: t.borrower.id, name: displayName(t.borrower) } : null,
      })),
      counts: {
        lentItems: p.lentItems.length,
        activeLentItems,
        checkouts: p.checkouts.length,
        trailEntries: p.trailEntries.length,
        totalRevenue,
      },
    };

    return NextResponse.json(detail);
  } catch (error) {
    console.error("GET /api/admin/products/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
