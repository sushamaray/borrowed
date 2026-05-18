import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? "s" : ""} ago`;
}

function computeBadges(entries: { tags: unknown; location: string | null }[]) {
  const allTags = entries.flatMap((e) => (Array.isArray(e.tags) ? (e.tags as string[]) : []));
  const locations = [...new Set(entries.map((e) => e.location).filter(Boolean))];

  const badges: { id: string; label: string; description: string }[] = [];

  if (allTags.some((t) => ["wedding", "event", "ceremony", "celebration"].includes(t.toLowerCase()))) {
    badges.push({ id: "wedding-veteran", label: "Wedding Veteran", description: "Used at weddings & celebrations" });
  }
  if (allTags.some((t) => ["travel", "outdoor", "camping", "mountain", "adventure", "hiking"].includes(t.toLowerCase()))) {
    badges.push({ id: "adventure-gear", label: "Adventure Gear", description: "Trusted for outdoor adventures" });
  }
  if (allTags.some((t) => ["photography", "film", "design", "art", "creative", "work", "project"].includes(t.toLowerCase()))) {
    badges.push({ id: "creators-fav", label: "Creator's Favourite", description: "Loved by creators & professionals" });
  }
  if (locations.length >= 3) {
    badges.push({ id: "well-travelled", label: "Well-Travelled", description: `Visited ${locations.length} places` });
  }
  if (entries.length >= 5) {
    badges.push({ id: "popular", label: "Popular Item", description: `Borrowed ${entries.length} times` });
  }

  return badges;
}

export async function GET(
  _req: Request,
  props: { params: Promise<{ slug: string }> },
) {
  const { slug } = await props.params;
  const session = await auth().catch(() => null);
  const userId = session?.user?.id ?? null;

  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await prisma.itemTrailEntry.findMany({
    where: { productId: product.id, isPublic: true },
    include: {
      borrower: { select: { id: true, name: true, userName: true, profilePicture: true } },
      reactions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const shaped = entries.map((e) => {
    const reactionMap: Record<string, number> = {};
    let myReaction: string | null = null;
    for (const r of e.reactions) {
      reactionMap[r.type] = (reactionMap[r.type] ?? 0) + 1;
      if (r.userId === userId) myReaction = r.type;
    }

    const displayName = e.anonymous
      ? "Anonymous Borrower"
      : (e.borrower?.name ?? e.borrower?.userName ?? "Unknown");
    const handle = e.anonymous ? null : (e.borrower?.userName ? `@${e.borrower.userName}` : null);
    const initials = displayName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return {
      id: e.id,
      displayName,
      handle,
      initials,
      useFor: e.useFor,
      location: e.location,
      tags: Array.isArray(e.tags) ? e.tags : [],
      itemRating: e.itemRating,
      photoUrls: Array.isArray(e.photoUrls) ? e.photoUrls : [],
      when: relativeTime(e.createdAt),
      reactions: reactionMap,
      myReaction,
    };
  });

  const badges = computeBadges(entries.map((e) => ({ tags: e.tags, location: e.location })));
  const locations = [...new Set(entries.map((e) => e.location).filter(Boolean))];

  return NextResponse.json({ entries: shaped, badges, locations, total: entries.length });
}
