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

    const formData = await request.formData();

    const existingProductId = formData.get("existingProductId") as string | null;
    const name              = formData.get("name") as string | null;
    const category          = formData.get("category") as string | null;
    const subcategory       = formData.get("subcategory") as string | null;
    const location          = formData.get("location") as string | null;
    const pricePerDay       = formData.get("pricePerDay") as string | null;
    const deposit           = formData.get("deposit") as string | null;
    const description       = formData.get("description") as string | null;
    const compensationMajor = formData.get("compensationMajor") as string | null;
    const compensationMinor = formData.get("compensationMinor") as string | null;
    const lenderNote        = formData.get("lenderNote") as string | null;
    const featuresRaw       = formData.get("features") as string | null;
    const drawbacksRaw      = formData.get("drawbacks") as string | null;
    const imageFiles        = formData.getAll("images") as File[];

    const features  = featuresRaw  ? (JSON.parse(featuresRaw)  as string[]) : [];
    const drawbacks = drawbacksRaw ? (JSON.parse(drawbacksRaw) as string[]) : [];

    let productId: string;

    if (existingProductId) {
      const existing = await prisma.product.findUnique({ where: { id: existingProductId } });
      if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      if (existing.createdById !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
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
      if (!pricePerDay || Number(pricePerDay) <= 0) {
        return NextResponse.json({ error: "Price per day is required" }, { status: 400 });
      }

      const product = await prisma.product.create({
        data: {
          slug:              generateSlug(name.trim()),
          name:              name.trim(),
          category:          category?.trim() ?? "Miscellaneous",
          subcategory:       subcategory?.trim() ?? null,
          location:          location?.trim() ?? "",
          pricePerDay:       Number(pricePerDay),
          deposit:           deposit ? Number(deposit) : null,
          description:       description?.trim() ?? "",
          features:          Array.isArray(features) ? features : [],
          drawbacks:         Array.isArray(drawbacks) ? drawbacks : [],
          compensationMajor: compensationMajor?.trim() ?? null,
          compensationMinor: compensationMinor?.trim() ?? null,
          lenderNote:        lenderNote?.trim() ?? null,
          createdById:       session.user.id,
        },
      });
      productId = product.id;

      // Save uploaded images
      if (imageFiles.length > 0) {
        await Promise.all(
          imageFiles.map(async (file, index) => {
            const buffer = Buffer.from(await file.arrayBuffer());
            await prisma.productImage.create({
              data: { productId, data: buffer, mimeType: file.type || "image/jpeg", order: index },
            });
          }),
        );
      }
    }

    const lentItem = await prisma.lentItem.create({
      data: { productId, lenderId: session.user.id, status: "active" },
      include: { product: { include: { images: { select: { id: true, order: true }, orderBy: { order: "asc" } } } } },
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
      include: {
        product: {
          include: { images: { select: { id: true, order: true }, orderBy: { order: "asc" } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(lentItems);
  } catch (error) {
    console.error("GET /api/lent-items:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}
