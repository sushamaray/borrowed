import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [agg, groups] = await Promise.all([
      prisma.borrowerReview.aggregate({
        where: { borrowerId: id },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.borrowerReview.groupBy({
        by: ["rating"],
        where: { borrowerId: id },
        _count: true,
      }),
    ]);

    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const g of groups) {
      breakdown[g.rating] = g._count;
    }

    return NextResponse.json({
      count: agg._count,
      average: agg._avg.rating,
      breakdown,
    });
  } catch (error) {
    console.error("GET /api/user/[id]/borrower-rating:", error);
    return NextResponse.json({ error: "Failed to fetch borrower rating" }, { status: 500 });
  }
}
