import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      // Option A: reuse an existing product
      existingProductId,
      // Option B: create a new product (all fields required)
      name,
      category,
      location,
      pricePerDay,
      deposit,
      description,
      features,
      imageUrl,
      compensationMajor,
      compensationMinor,
      lenderNote,
    } = body;

    let productId: string;

    if (existingProductId) {
      // Reuse — verify it belongs to this user
      const existing = await prisma.product.findUnique({ where: { id: existingProductId } });
      if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      if (existing.createdById !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // Make sure there's no current active/borrowed listing for this product
      const activeListing = await prisma.lentItem.findFirst({
        where: { productId: existingProductId, status: { in: ["active", "borrowed"] } },
      });
      if (activeListing) {
        return NextResponse.json({ error: "This item is already listed" }, { status: 409 });
      }
      productId = existingProductId;
    } else {
      if (!name?.trim()) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      if (!pricePerDay || pricePerDay <= 0) {
        return NextResponse.json({ error: "Price per day is required" }, { status: 400 });
      }

      const product = await prisma.product.create({
        data: {
          slug:             generateSlug(name.trim()),
          name:             name.trim(),
          category:         category?.trim() ?? "Miscellaneous",
          location:         location?.trim() ?? "",
          pricePerDay:      Number(pricePerDay),
          deposit:          deposit ? Number(deposit) : null,
          description:      description?.trim() ?? "",
          features:         Array.isArray(features) ? features : [],
          imageUrl:         imageUrl?.trim() ?? null,
          compensationMajor: compensationMajor?.trim() ?? null,
          compensationMinor: compensationMinor?.trim() ?? null,
          lenderNote:       lenderNote?.trim() ?? null,
          createdById:      session.user.id,
        },
      });
      productId = product.id;
    }

    const lentItem = await prisma.lentItem.create({
      data: {
        productId,
        lenderId: session.user.id,
        status: "active",
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(lentItem, { status: 201 });
  } catch (error) {
    console.error("POST /api/lent-items:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lentItems = await prisma.lentItem.findMany({
      where: { lenderId: session.user.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(lentItems);
  } catch (error) {
    console.error("GET /api/lent-items:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}
