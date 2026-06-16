import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { expandQueryWithAI, fallbackKeywords, buildItemSearchOR } from "@/lib/ai-search";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const lenderId = searchParams.get("lender") ?? "";
    const useAI = searchParams.get("ai") === "true";

    const session = await auth();
    const currentUserId = session?.user?.id;

    let itemSearchOR: object[] | undefined;
    let aiMatched = false;

    if (q) {
      let keywords: string[];
      let aiCategories: string[] = [];

      if (useAI) {
        const expanded = await expandQueryWithAI(q);
        keywords = expanded.keywords;
        aiCategories = expanded.categories;
        aiMatched = true;
      } else {
        keywords = q.includes(" ") ? [q, ...fallbackKeywords(q)] : [q];
      }

      itemSearchOR = buildItemSearchOR(keywords, aiCategories);
    }

    const items = await prisma.lentItem.findMany({
      where: {
        status: "active",
        ...(lenderId ? { lenderId } : currentUserId ? { lenderId: { not: currentUserId } } : {}),
        ...(itemSearchOR ? { OR: itemSearchOR } : {}),
      },
      include: {
        product: {
          include: { images: { select: { id: true }, orderBy: { order: "asc" }, take: 1 } },
        },
        lender: {
          select: { firstName: true, lastName: true, userName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const shaped = items.map((item) => ({
      id: item.id,
      productId: item.product.id,
      slug: item.product.slug,
      title: item.product.name,
      category: item.product.category,
      location: item.product.location,
      pricePerDay: item.product.pricePerDay,
      deposit: item.product.deposit,
      description: item.product.description,
      imageUrl: item.product.images[0]
        ? `/api/products/images/${item.product.images[0].id}`
        : item.product.imageUrl,
      lenderName:
        item.lender.firstName && item.lender.lastName
          ? `${item.lender.firstName} ${item.lender.lastName}`
          : (item.lender.userName ?? "Unknown"),
    }));

    return NextResponse.json({ items: shaped, aiMatched });
  } catch (error) {
    console.error("GET /api/browse:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}
