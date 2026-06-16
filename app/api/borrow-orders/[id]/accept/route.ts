import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const photoFile = formData.get("beforePhoto") as File | null;

    if (!photoFile) {
      return NextResponse.json(
        { error: "beforePhoto is required" },
        { status: 400 },
      );
    }
    if (!photoFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid image type" },
        { status: 400 },
      );
    }
    if (photoFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large (max 10MB)" },
        { status: 400 },
      );
    }

    const { id } = await params;

    const checkout = await prisma.borrowCheckout.findUnique({
      where: { id },
      include: {
        product:  { select: { name: true } },
        lender:   { select: { name: true, firstName: true, lastName: true, userName: true } },
        lentItem: { select: { id: true } },
      },
    });

    if (!checkout) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (checkout.lenderId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (checkout.status !== "pending") return NextResponse.json({ error: "Not pending" }, { status: 409 });

    const photoBuffer = Buffer.from(await photoFile.arrayBuffer());

    await prisma.$transaction([
      prisma.borrowCheckout.update({ where: { id }, data: { status: "accepted" } }),
      prisma.conditionPhoto.create({
        data: {
          checkoutId: id,
          role: "before",
          data: photoBuffer,
          mimeType: photoFile.type || "image/jpeg",
        },
      }),
      ...(checkout.lentItemId
        ? [prisma.lentItem.update({ where: { id: checkout.lentItemId }, data: { status: "borrowed" } })]
        : []),
    ]);

    const lenderName =
      checkout.lender.firstName ?? checkout.lender.name ?? checkout.lender.userName ?? "Lender";

    await prisma.notification.create({
      data: {
        userId: checkout.borrowerId,
        type: "borrow_accepted",
        title: "Borrow request accepted",
        body: `${lenderName} accepted your request for "${checkout.product.name}"`,
        link: "/dashboard/my-borrows",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/borrow-orders/[id]/accept:", error);
    return NextResponse.json({ error: "Failed to accept" }, { status: 500 });
  }
}
