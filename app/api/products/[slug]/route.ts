import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // The segment is named "slug" but the client passes the product ID
    const { slug: id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (product.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();

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
    const deleteImageIds    = formData.get("deleteImageIds") as string | null;
    const newImageFiles     = formData.getAll("images") as File[];

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!pricePerDay || Number(pricePerDay) <= 0) {
      return NextResponse.json({ error: "Price per day is required" }, { status: 400 });
    }

    const features  = featuresRaw  ? (JSON.parse(featuresRaw)  as string[]) : [];
    const drawbacks = drawbacksRaw ? (JSON.parse(drawbacksRaw) as string[]) : [];

    if (deleteImageIds) {
      const ids = JSON.parse(deleteImageIds) as string[];
      if (ids.length > 0) {
        await prisma.productImage.deleteMany({
          where: { id: { in: ids }, productId: id },
        });
      }
    }

    const existingImages = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { order: "desc" },
      take: 1,
      select: { order: true },
    });
    let nextOrder = existingImages.length > 0 ? existingImages[0].order + 1 : 0;

    if (newImageFiles.length > 0) {
      await Promise.all(
        newImageFiles.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          await prisma.productImage.create({
            data: { productId: id, data: buffer, mimeType: file.type || "image/jpeg", order: nextOrder++ },
          });
        }),
      );
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name:              name.trim(),
        category:          category?.trim() ?? product.category,
        subcategory:       subcategory?.trim() || null,
        location:          location?.trim() ?? product.location,
        pricePerDay:       Number(pricePerDay),
        deposit:           deposit ? Number(deposit) : null,
        description:       description?.trim() ?? "",
        features,
        drawbacks,
        compensationMajor: compensationMajor?.trim() || null,
        compensationMinor: compensationMinor?.trim() || null,
        lenderNote:        lenderNote?.trim() || null,
      },
      include: {
        images: { select: { id: true, order: true }, orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/products/[slug]:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
