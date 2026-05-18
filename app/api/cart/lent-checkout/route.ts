import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const borrowerName =
      (session.user as { firstName?: string }).firstName ??
      session.user.name ??
      "Someone";

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        lentItem: {
          include: { product: { select: { id: true, name: true } } },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const checkouts = await prisma.$transaction(
      cartItems.map((item) =>
        prisma.borrowCheckout.create({
          data: {
            borrowerId:  userId,
            lenderId:    item.lentItem.lenderId,
            productId:   item.lentItem.productId,
            lentItemId:  item.lentItemId,
            originType:  "lent_item",
            status:      "pending",
          },
        }),
      ),
    );

    await prisma.cartItem.deleteMany({ where: { userId } });

    // Notify each unique lender
    const lenderMap = new Map<string, string>();
    for (const item of cartItems) {
      if (!lenderMap.has(item.lentItem.lenderId)) {
        lenderMap.set(item.lentItem.lenderId, item.lentItem.product.name);
      }
    }

    await prisma.notification.createMany({
      data: Array.from(lenderMap.entries()).map(([lenderId, firstName]) => ({
        userId: lenderId,
        type: "new_borrow_request",
        title: "New borrow request",
        body: `${borrowerName} wants to borrow your "${firstName}"`,
        link: "/dashboard/my-items",
      })),
    });

    await prisma.notification.create({
      data: {
        userId,
        type: "order_placed",
        title: "Order placed",
        body: `Your borrow request for ${cartItems.length} item(s) has been sent.`,
        link: "/dashboard/my-borrows",
      },
    });

    return NextResponse.json({ checkouts, count: checkouts.length }, { status: 201 });
  } catch (error) {
    console.error("POST /api/cart/lent-checkout:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
