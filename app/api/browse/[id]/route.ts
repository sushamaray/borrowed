import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await props.params;

    const item = await prisma.lentItem.findUnique({
      where: { id },
      include: {
        product: true,
        lender: {
          select: { id: true, firstName: true, lastName: true, userName: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const lenderName =
      item.lender.firstName && item.lender.lastName
        ? `${item.lender.firstName} ${item.lender.lastName}`
        : (item.lender.userName ?? "Unknown");

    return NextResponse.json({
      id: item.id,
      productId: item.product.id,
      slug: item.product.slug,
      title: item.product.name,
      category: item.product.category,
      location: item.product.location,
      pricePerDay: item.product.pricePerDay,
      deposit: item.product.deposit,
      description: item.product.description,
      features: item.product.features,
      imageUrl: item.product.imageUrl,
      compensationMajor: item.product.compensationMajor,
      compensationMinor: item.product.compensationMinor,
      lenderNote: item.product.lenderNote,
      status: item.status,
      lenderId: item.lender.id,
      lenderName,
    });
  } catch (error) {
    console.error("GET /api/browse/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}
