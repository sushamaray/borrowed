import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { expandQueryWithAI, fallbackKeywords, buildItemSearchOR } from "@/lib/ai-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const type = searchParams.get("type") ?? "all";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "4"), 10);
  const useAI = searchParams.get("ai") === "true";

  if (!q) {
    return NextResponse.json({ items: [], requests: [], users: [], aiMatched: false });
  }

  const session = await auth();
  const currentUserId = session?.user?.id;

  const plainKeywords = q.includes(" ") ? [q, ...fallbackKeywords(q)] : [q];

  let keywords = plainKeywords;
  let aiCategories: string[] = [];
  let aiMatched = false;

  if (useAI) {
    const expanded = await expandQueryWithAI(q);
    keywords = expanded.keywords;
    aiCategories = expanded.categories;
    aiMatched = true;
  }

  const itemSearchOR = buildItemSearchOR(keywords, aiCategories);

  const reqSearchOR = [
    ...keywords.flatMap((kw) => [
      { title: { contains: kw } },
      { category: { contains: kw } },
      { description: { contains: kw } },
    ]),
    ...(aiCategories.length > 0 ? [{ category: { in: aiCategories } }] : []),
  ];

  const userSearchTerms = [q, ...keywords].slice(0, 4);
  const userSearchOR = userSearchTerms.flatMap((kw) => [
    { firstName: { contains: kw } },
    { lastName: { contains: kw } },
    { userName: { contains: kw } },
  ]);

  const [rawItems, rawRequests, rawUsers] = await Promise.all([
    type === "all" || type === "items"
      ? prisma.lentItem.findMany({
          where: {
            status: "active",
            ...(currentUserId ? { lenderId: { not: currentUserId } } : {}),
            OR: itemSearchOR,
          },
          include: {
            product: true,
            lender: { select: { firstName: true, lastName: true, userName: true } },
          },
          take: limit,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),

    type === "all" || type === "requests"
      ? prisma.borrowRequest.findMany({
          where: {
            status: "open",
            ...(currentUserId ? { requesterId: { not: currentUserId } } : {}),
            OR: reqSearchOR,
          },
          take: limit,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),

    type === "all" || type === "users"
      ? prisma.user.findMany({
          where: {
            ...(currentUserId ? { id: { not: currentUserId } } : {}),
            OR: userSearchOR,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
            location: true,
            _count: { select: { lentItems: { where: { status: "active" } } } },
          },
          take: limit,
        })
      : Promise.resolve([]),
  ]);

  const items = rawItems.map((item) => ({
    id: item.id,
    title: item.product.name,
    category: item.product.category,
    imageUrl: item.product.imageUrl,
    pricePerDay: item.product.pricePerDay,
    location: item.product.location,
    lenderName:
      item.lender.firstName && item.lender.lastName
        ? `${item.lender.firstName} ${item.lender.lastName}`
        : (item.lender.userName ?? "Unknown"),
  }));

  const requests = rawRequests.map((req) => ({
    id: req.id,
    title: req.title,
    category: req.category,
    neededFrom: req.neededFrom.toISOString(),
    neededUntil: req.neededUntil.toISOString(),
    budgetPerDay: req.budgetPerDay,
  }));

  const users = rawUsers.map((u) => {
    const fullName =
      u.firstName && u.lastName
        ? `${u.firstName} ${u.lastName}`
        : (u.userName ?? "User");
    return {
      id: u.id,
      name: fullName,
      userName: u.userName,
      avatarLabel: fullName.charAt(0).toUpperCase(),
      location: u.location,
      itemCount: u._count.lentItems,
    };
  });

  return NextResponse.json({ items, requests, users, aiMatched });
}
