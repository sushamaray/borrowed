import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      userName: true,
      location: true,
      identityVerified: true,
      contactVerified: true,
      createdAt: true,
      lentItems: {
        where: { status: "active" },
        include: { product: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
      _count: { select: { lentItems: { where: { status: "active" } } } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isCurrentUser = user.id === currentUserId;

  return NextResponse.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    userName: user.userName,
    location: user.location,
    identityVerified: user.identityVerified,
    contactVerified: user.contactVerified,
    memberSince: user.createdAt.toISOString(),
    itemCount: user._count.lentItems,
    isCurrentUser,
    items: user.lentItems.map((li) => ({
      id: li.id,
      title: li.product.name,
      category: li.product.category,
      pricePerDay: li.product.pricePerDay,
      imageUrl: li.product.imageUrl,
      location: li.product.location,
    })),
  });
}
