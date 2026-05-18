import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const items = await prisma.lentItem.findMany({
      where: {
        status: "active",
        ...(currentUserId ? { lenderId: { not: currentUserId } } : {}),
      },
      include: {
        product: true,
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
      imageUrl: item.product.imageUrl,
      lenderName:
        item.lender.firstName && item.lender.lastName
          ? `${item.lender.firstName} ${item.lender.lastName}`
          : (item.lender.userName ?? "Unknown"),
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("GET /api/browse:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}
