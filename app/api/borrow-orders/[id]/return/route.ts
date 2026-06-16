import { auth } from "@/auth";
import { detectDamage } from "@/lib/ai/damage-detection";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const formData = await request.formData();

    const useFor = (formData.get("useFor") as string | null)?.trim() ?? "";
    const location = (formData.get("location") as string | null)?.trim() || null;
    const tagsRaw = formData.get("tags") as string | null;
    const tags: string[] = tagsRaw ? (JSON.parse(tagsRaw) as string[]) : [];
    const itemRatingRaw = formData.get("itemRating") as string | null;
    const itemRating = itemRatingRaw ? parseInt(itemRatingRaw, 10) : 5;
    const anonymous = formData.get("anonymous") === "true";
    const afterFile = formData.get("afterPhoto") as File | null;

    if (!useFor) {
      return NextResponse.json({ error: "useFor is required" }, { status: 400 });
    }
    if (!afterFile) {
      return NextResponse.json(
        { error: "afterPhoto is required" },
        { status: 400 },
      );
    }
    if (!afterFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid image type" },
        { status: 400 },
      );
    }
    if (afterFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large (max 10MB)" },
        { status: 400 },
      );
    }

    const checkout = await prisma.borrowCheckout.findUnique({
      where: { id },
      include: {
        product:    { select: { name: true } },
        borrower:   { select: { name: true, firstName: true, lastName: true, userName: true } },
        trailEntry: { select: { id: true } },
        conditionPhotos: {
          where: { role: "before" },
          select: { data: true, mimeType: true },
          take: 1,
        },
      },
    });

    if (!checkout) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (checkout.borrowerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (checkout.status !== "accepted") return NextResponse.json({ error: "Not active" }, { status: 409 });
    if (checkout.trailEntry) return NextResponse.json({ error: "Already returned" }, { status: 409 });

    const afterBuffer = Buffer.from(await afterFile.arrayBuffer());

    // Persist the after photo before the AI call so it's never lost even if AI times out
    const savedAfter = await prisma.conditionPhoto.create({
      data: {
        checkoutId: id,
        role: "after",
        data: afterBuffer,
        mimeType: afterFile.type || "image/jpeg",
      },
    });

    // Run AI damage detection (graceful degradation — never throws)
    const beforePhoto = checkout.conditionPhotos[0] ?? null;
    let aiVerdict: string | null = null;
    let aiConfidence: number | null = null;
    let aiNotes: string | null = null;

    if (beforePhoto) {
      const aiResult = await detectDamage(
        beforePhoto.data as Buffer,
        beforePhoto.mimeType,
        savedAfter.data as Buffer,
        savedAfter.mimeType,
      );
      aiVerdict = aiResult.verdict;
      aiConfidence = aiResult.confidence;
      aiNotes = aiResult.notes;
    }

    const rating = Math.min(5, Math.max(1, itemRating));

    await prisma.$transaction([
      prisma.itemTrailEntry.create({
        data: {
          productId:        checkout.productId,
          lentItemId:       checkout.lentItemId ?? undefined,
          borrowCheckoutId: id,
          borrowerId:       session.user.id,
          useFor,
          location,
          tags,
          itemRating:  rating,
          anonymous,
        },
      }),
      prisma.borrowCheckout.update({
        where: { id },
        data: {
          status: "returned",
          returnedAt: new Date(),
          ...(aiVerdict !== null && {
            aiDamageVerdict:    aiVerdict,
            aiDamageConfidence: aiConfidence,
            aiDamageNotes:      aiNotes,
            aiDamageCheckedAt:  new Date(),
          }),
        },
      }),
      ...(checkout.lentItemId
        ? [prisma.lentItem.update({ where: { id: checkout.lentItemId }, data: { status: "active" } })]
        : []),
    ]);

    const borrowerName =
      checkout.borrower.firstName ??
      checkout.borrower.name ??
      checkout.borrower.userName ??
      "Someone";

    const damageInfo = aiVerdict === "damaged" ? " ⚠️ AI detected possible damage." : "";

    await prisma.notification.create({
      data: {
        userId: checkout.lenderId,
        type: "item_returned",
        title: "Item returned",
        body: `${borrowerName} has returned "${checkout.product.name}"${damageInfo}`,
        link: "/dashboard/my-items",
      },
    });

    return NextResponse.json({ ok: true, aiVerdict });
  } catch (error) {
    console.error("POST /api/borrow-orders/[id]/return:", error);
    return NextResponse.json({ error: "Failed to submit return" }, { status: 500 });
  }
}
