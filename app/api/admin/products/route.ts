import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { ProductListItem, ProductPage } from "@/lib/admin/products/types";
import type { Prisma } from "@/lib/generated/prisma";

const PAGE_SIZE = 20;

function displayName(u: { name?: string | null; firstName?: string | null; userName?: string | null }) {
  return u.name ?? u.firstName ?? u.userName ?? "Unknown";
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const cursor        = searchParams.get("cursor")        ?? "";
    const search        = searchParams.get("search")        ?? "";
    const category      = searchParams.get("category")      ?? "";
    const subcategory   = searchParams.get("subcategory")   ?? "";
    const listingStatus = searchParams.get("listingStatus") ?? "";

    const where: Prisma.ProductWhereInput = {
      ...(search ? {
        OR: [
          { name: { contains: search } },
          { id:   { contains: search } },
        ],
      } : {}),
      ...(category    ? { category }    : {}),
      ...(subcategory ? { subcategory } : {}),
      ...(listingStatus === "active"   ? { lentItems: { some: { status: "active" } } }   : {}),
      ...(listingStatus === "borrowed" ? { lentItems: { some: { status: "borrowed" } } } : {}),
      ...(listingStatus === "inactive" ? {
        lentItems: { some: {} },
        NOT: { lentItems: { some: { status: { in: ["active", "borrowed"] } } } },
      } : {}),
      ...(listingStatus === "unlisted" ? { lentItems: { none: {} } } : {}),
    };

    const products = await prisma.product.findMany({
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        subcategory: true,
        location: true,
        pricePerDay: true,
        deposit: true,
        imageUrl: true,
        images: { select: { id: true, order: true }, orderBy: { order: "asc" }, take: 1 },
        createdAt: true,
        createdBy: {
          select: { id: true, name: true, firstName: true, userName: true },
        },
        _count: { select: { lentItems: true, checkouts: true } },
        lentItems: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = products.length > PAGE_SIZE;
    const page = hasMore ? products.slice(0, PAGE_SIZE) : products;

    const items: ProductListItem[] = page.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      subcategory: p.subcategory,
      location: p.location,
      pricePerDay: p.pricePerDay,
      deposit: p.deposit,
      imageUrl: p.imageUrl,
      images: p.images,
      createdAt: p.createdAt.toISOString(),
      createdBy: { id: p.createdBy.id, name: displayName(p.createdBy) },
      lentItemCount: p._count.lentItems,
      activeLentItems: p.lentItems.filter((li) => li.status === "active").length,
      checkoutCount: p._count.checkouts,
    }));

    const response: ProductPage = {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/admin/products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
