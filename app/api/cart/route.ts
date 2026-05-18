import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        lentItem: {
          include: {
            product: true,
            lender: { select: { id: true, name: true, userName: true } },
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    const shaped = items.map((item) => {
      const product = item.lentItem.product;
      const lenderName = item.lentItem.lender.name ?? item.lentItem.lender.userName ?? "Unknown";

      return {
        id: item.id,
        lentItemId: item.lentItemId,
        productId: product.id,
        slug: product.slug,
        title: product.name,
        name: product.name,
        category: product.category,
        location: product.location,
        lender: lenderName,
        lenderName,
        days: item.days,
        pricePerDay: product.pricePerDay,
        priceAmount: product.pricePerDay,
        deposit: product.deposit ?? 0,
        image: product.imageUrl ?? null,
        imageUrl: product.imageUrl ?? "",
        startDate: null,
        endDate: null,
      };
    });

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("GET /api/cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, days } = body;
    let { lentItemId } = body;

    if (!lentItemId && !productId) {
      return NextResponse.json({ error: "lentItemId or productId is required" }, { status: 400 });
    }

    if (!lentItemId && productId) {
      const activeItem = await prisma.lentItem.findFirst({
        where: { productId, status: "active" },
        orderBy: { createdAt: "desc" },
      });

      if (!activeItem) {
        return NextResponse.json({ error: "No active listing found for this item" }, { status: 404 });
      }

      lentItemId = activeItem.id;
    }

    const lentItem = await prisma.lentItem.findUnique({ where: { id: lentItemId } });
    if (!lentItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (lentItem.lenderId === session.user.id) {
      return NextResponse.json({ error: "Cannot add your own item to cart" }, { status: 400 });
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_lentItemId: {
          userId: session.user.id,
          lentItemId,
        },
      },
      update: { days: days ?? 1 },
      create: {
        userId: session.user.id,
        lentItemId,
        days: days ?? 1,
      },
    });

    return NextResponse.json(cartItem, { status: 201 });
  } catch (error) {
    console.error("POST /api/cart:", error);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}
