"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Star, ShieldCheck, ShoppingCart,
  Calendar, MessageSquare, Sparkles, ChevronRight, Check,
  Flame, Gem, Heart, Mountain, Palette, Plane, Sprout, Target,
  CheckCircle2, XCircle,
} from "lucide-react";
import UserProfileModal from "@/components/dashboard/UserProfileModal";
import FallbackImage from "@/components/FallbackImage";
import type { ProductWithFeatureList } from "@/lib/products";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrailEntry {
  id: string;
  displayName: string;
  handle: string | null;
  initials: string;
  useFor: string;
  location: string | null;
  tags: string[];
  itemRating: number;
  photoUrls: string[];
  when: string;
  reactions: Record<string, number>;
  myReaction: string | null;
}

interface Badge {
  id: string;
  label: string;
  description: string;
}

interface TrailData {
  entries: TrailEntry[];
  badges: Badge[];
  locations: string[];
  total: number;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  const sizeClass = size === 40 ? "h-10 w-10 text-[13.6px]" : "h-9 w-9 text-[12.24px]";

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] font-black text-white shadow-[0_2px_8px_rgba(47,35,106,0.25)] ${sizeClass}`}
    >
      {initials}
    </div>
  );
}

function LenderAvatar({ name, imageUrl, size = 40 }: { name: string; imageUrl?: string | null; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const sizeClass = size === 64 ? "h-16 w-16 text-xl" : "h-10 w-10 text-[13.6px]";

  if (imageUrl) {
    return (
      <div className={`relative flex-shrink-0 overflow-hidden rounded-full bg-[#f2eefb] ${sizeClass}`}>
        <FallbackImage src={imageUrl} alt={name} fill sizes={`${size}px`} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] font-black text-white shadow-[0_2px_8px_rgba(47,35,106,0.25)] ${sizeClass}`}
    >
      {initials}
    </div>
  );
}

function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24"
          fill={n <= rating ? "#f59e0b" : "none"}
          stroke={n <= rating ? "#f59e0b" : "#e3dcf3"} strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

const REACTION_ICONS = {
  heart: Heart,
  fire: Flame,
  star: Star,
  wow: Sparkles,
};

const BADGE_ICONS = {
  "wedding-veteran": Gem,
  "adventure-gear": Mountain,
  "creators-fav": Palette,
  "well-travelled": Plane,
};

function ReactionBar({ entryId, slug, reactions, myReaction, onChange }: {
  entryId: string; slug: string;
  reactions: Record<string, number>; myReaction: string | null;
  onChange: (entryId: string, type: string | null) => void;
}) {
  const [pending, setPending] = useState(false);

  const react = async (type: string) => {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(`/api/products/${slug}/trail/${entryId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const data = await res.json() as { myReaction: string | null };
        onChange(entryId, data.myReaction);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
      {Object.entries(REACTION_ICONS).map(([type, Icon]) => {
        const count = reactions[type] ?? 0;
        const isActive = myReaction === type;
        return (
          <button
            key={type}
            onClick={() => react(type)}
            disabled={pending}
            className={`flex items-center gap-1 rounded-full border-[1.5px] px-2.5 py-1 text-[0.72rem] font-bold transition-all disabled:opacity-60 ${
              isActive
                ? "border-[#3b2a80] bg-[#f2eefb] text-[#31236a]"
                : "border-[#e3dcf3] bg-[#f8f7fc] text-[#9187b0]"
            }`}
          >
            <Icon size={13} fill={isActive ? "currentColor" : "none"} strokeWidth={2.2} />
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ItemDetailClient({
  product,
  similarProducts,
  lentItemId,
  backHref = "/dashboard/browse",
  backLabel = "Back to Browse",
}: {
  product: ProductWithFeatureList;
  similarProducts: ProductWithFeatureList[];
  lentItemId?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const [tab, setTab] = useState<"description" | "trail" | "mentor">("description");
  const [trail, setTrail] = useState<TrailData | null>(null);
  const [trailLoading, setTrailLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cartAdded, setCartAdded] = useState(false);
  const [cartPending, setCartPending] = useState(false);
  const [cartError, setCartError] = useState("");
  const [lenderOpen, setLenderOpen] = useState(false);

  const days = startDate && endDate
    ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 0;

  const priceFormatter = new Intl.NumberFormat("en-BD");
  const fmt = (n: number) => `TK ${priceFormatter.format(n)}`;

  // Load trail when tab switches to "trail"
  useEffect(() => {
    if (tab !== "trail" || trail !== null) return;
    setTrailLoading(true);
    fetch(`/api/products/${product.slug}/trail`)
      .then((r) => r.json())
      .then((data: TrailData) => setTrail(data))
      .catch(() => {})
      .finally(() => setTrailLoading(false));
  }, [tab, trail, product.slug]);

  const handleReactionChange = (entryId: string, newType: string | null) => {
    setTrail((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.map((e) => {
          if (e.id !== entryId) return e;
          const updatedReactions = { ...e.reactions };
          if (e.myReaction && e.myReaction !== newType) {
            updatedReactions[e.myReaction] = Math.max(0, (updatedReactions[e.myReaction] ?? 1) - 1);
            if (updatedReactions[e.myReaction] === 0) delete updatedReactions[e.myReaction];
          }
          if (newType) {
            updatedReactions[newType] = (updatedReactions[newType] ?? 0) + 1;
          }
          return { ...e, reactions: updatedReactions, myReaction: newType };
        }),
      };
    });
  };

  const addToCart = async () => {
    if (cartPending || cartAdded) return;
    setCartPending(true);
    setCartError("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lentItemId,
          productId: product.id,
          days: days > 0 ? days : 1,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });
      if (res.ok) {
        setCartAdded(true);
      } else {
        const data = await res.json() as { error?: string };
        setCartError(data.error ?? "Failed to add to cart");
      }
    } catch {
      setCartError("Network error, please try again");
    } finally {
      setCartPending(false);
    }
  };

  const trailCount = trail?.total ?? 0;

  const TABS = [
    { id: "description", label: "Description" },
    { id: "trail", label: `Item Trail${trailCount > 0 ? ` (${trailCount})` : ""}` },
  ] as const;

  return (
    <main className="mx-auto max-w-[1140px] px-8 py-7">
      {/* Back */}
      <Link
        href={backHref}
        className="mb-5 inline-flex items-center gap-1.5 font-bold text-[0.88rem] text-[var(--primary)] no-underline"
      >
        <ArrowLeft size={16} />
        {backLabel}
      </Link>

      {/* Hero grid */}
      <div className="mb-6 grid grid-cols-[1fr_380px] gap-6">

        {/* Left panel */}
        <div className="rounded-[20px] border border-[#e3dcf3] bg-white p-7 shadow-[0_12px_40px_rgba(59,42,128,0.07)]">

          {/* Image */}
          <div className="relative mb-6 h-[280px] overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#ece7fa,#f2eefb)]">
            <FallbackImage
              src={product.imageUrl ?? ""}
              alt={product.name}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              className="object-cover"
            />
            {/* Borrow count chip */}
            <div className="absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[0.72rem] font-semibold text-white/90">
              {trailCount} borrow{trailCount !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Category pill */}
          <span className="rounded-full bg-[#f2eefb] px-3 py-[3px] text-[0.75rem] font-extrabold text-[#31236a]">
            {product.category}
          </span>

          {/* Title */}
          <h1 className="my-3 text-[clamp(1.5rem,3vw,2.1rem)] font-black leading-[1.1] tracking-[-0.03em] text-[#1b1530]">
            {product.name}
          </h1>

          {/* Meta */}
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-[5px] text-[0.88rem] font-semibold text-(--text-secondary)">
              <MapPin size={14} />
              {product.location}
            </div>
            <div className="flex items-center gap-1.5">
              <StarRow rating={Math.round(Number(product.lenderRating))} size={13} />
              <span className="text-[0.88rem] font-semibold text-(--text-secondary)">{product.lenderRating.toString()}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-5 flex gap-1 border-b-2 border-(--border)">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`mb-[-2px] cursor-pointer border-b-2 bg-transparent px-4 py-[0.6rem] text-[0.85rem] font-bold transition-colors ${
                  tab === t.id ? "border-[#31236a] text-[#31236a]" : "border-transparent text-[#9187b0]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Description */}
          {tab === "description" && (
            <div>
              <p className="mb-5 leading-[1.8] text-(--text-secondary)">{product.description}</p>

              {(product.featureList.length > 0 || product.drawbackList.length > 0) && (
                <div className="mt-1 grid grid-cols-2 gap-4">
                  {product.featureList.length > 0 && (
                    <div className="rounded-2xl border border-(--border) bg-(--surface-soft) p-4">
                      <div className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-[#1b1530]">
                        <CheckCircle2 className="h-4 w-4 text-(--success)" />
                        Features
                      </div>
                      <ul className="grid list-none gap-2 p-0">
                        {product.featureList.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-[0.85rem] text-(--text-secondary)">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-(--success)" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {product.drawbackList.length > 0 && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <div className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-[#1b1530]">
                        <XCircle className="h-4 w-4 text-(--danger)" />
                        Known Drawbacks
                      </div>
                      <ul className="grid list-none gap-2 p-0">
                        {product.drawbackList.map((d) => (
                          <li key={d} className="flex items-start gap-2 text-[0.85rem] text-(--text-secondary)">
                            <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-(--danger)" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Trail */}
          {tab === "trail" && (
            <div>
              {/* Header */}
              <div className="mb-4">
                <div className="mb-1 text-base font-extrabold text-[#1b1530]">Social Item Trail</div>
                <div className="text-[0.82rem] text-[#9187b0]">Every borrow tells a story. See how this item has traveled.</div>
              </div>

              {/* Achievement badges */}
              {trail && trail.badges.length > 0 && (
                <div className="mb-5">
                  <div className="mb-2 flex items-center gap-1.5 text-[0.82rem] font-extrabold text-[#1b1530]">
                    <Sparkles size={14} color="#3b2a80" /> Item Achievements
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trail.badges.map((b) => (
                      <div key={b.id} title={b.description} className="flex items-center gap-[5px] rounded-full border border-[#e3dcf3] bg-[linear-gradient(135deg,#f2eefb,#ece7fa)] px-3 py-1 text-[0.75rem] font-extrabold text-[#31236a]">
                        {(() => {
                          const BadgeIcon = BADGE_ICONS[b.id as keyof typeof BADGE_ICONS] ?? Sparkles;
                          return <BadgeIcon size={13} strokeWidth={2.3} />;
                        })()}
                        {b.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location journey */}
              {trail && trail.locations.length > 0 && (
                <div className="mb-5 rounded-[14px] border border-[#e3dcf3] bg-[#f8f7fc] px-4 py-[0.85rem]">
                  <div className="mb-2 flex items-center gap-1.5 text-[0.82rem] font-extrabold text-[#1b1530]">
                    <MapPin size={14} color="#3b2a80" /> Journey Map
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {trail.locations.map((loc, i) => (
                      <span key={loc} className="flex items-center gap-1 text-[0.78rem] font-semibold text-(--text-secondary)">
                        {i > 0 && <ChevronRight size={11} color="#9187b0" />}
                        <span className="rounded-full border border-[#e3dcf3] bg-white px-2.5 py-0.5">{loc}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading */}
              {trailLoading && (
                <div className="flex flex-col gap-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--surface-soft)]" />
                  ))}
                </div>
              )}

              {/* Empty */}
              {!trailLoading && trail?.entries.length === 0 && (
                <div className="p-8 text-center text-[#9187b0]">
                  <Sprout size={32} className="mx-auto mb-2" strokeWidth={1.8} />
                  <div className="font-bold">Be the first to borrow!</div>
                  <div className="mt-1 text-[0.82rem]">This item&apos;s story starts with you.</div>
                </div>
              )}

              {/* Entries */}
              {!trailLoading && trail && trail.entries.length > 0 && (
                <div className="relative">
                  {trail.entries.map((entry, i) => (
                    <div key={entry.id} className={`relative flex gap-4 ${i < trail.entries.length - 1 ? "mb-4" : ""}`}>
                      {/* Timeline line */}
                      {i < trail.entries.length - 1 && (
                        <div className="absolute left-[17px] top-[38px] h-[calc(100%+0.25rem)] w-0.5 bg-[linear-gradient(180deg,#e3dcf3,transparent)]" />
                      )}
                      <Avatar initials={entry.initials} size={36} />
                      <div className="flex-1 rounded-[14px] border border-[#e3dcf3] bg-(--surface-soft) px-4 py-[0.85rem]">
                        <div className="mb-1 flex items-center justify-between">
                          <div>
                            <span className="text-[0.88rem] font-extrabold text-[#31236a]">{entry.displayName}</span>
                            {entry.handle && (
                              <span className="ml-1.5 text-[0.75rem] text-[#9187b0]">{entry.handle}</span>
                            )}
                          </div>
                          <span className="text-[0.75rem] text-[#9187b0]">{entry.when}</span>
                        </div>
                        <div className="mb-1 text-[0.85rem] text-(--text-secondary)">
                          Used for <em className="font-bold not-italic text-[#1b1530]">{entry.useFor}</em>
                          {entry.location && (
                            <span className="text-[#9187b0]"> · {entry.location}</span>
                          )}
                        </div>
                        {entry.tags.length > 0 && (
                          <div className="mb-1 flex flex-wrap gap-1">
                            {entry.tags.map((tag) => (
                              <span key={tag} className="rounded-full bg-[#f2eefb] px-2 py-px text-[0.7rem] font-bold text-[#3b2a80]">#{tag}</span>
                            ))}
                          </div>
                        )}
                        <StarRow rating={entry.itemRating} size={11} />
                        <ReactionBar
                          entryId={entry.id}
                          slug={product.slug}
                          reactions={entry.reactions}
                          myReaction={entry.myReaction}
                          onChange={handleReactionChange}
                        />
                        {/* Borrow for similar reason */}
                        <div className="mt-2">
                          <Link
                            href={`/products/${product.slug}`}
                            className="inline-flex items-center gap-1 text-[0.72rem] font-bold text-[var(--primary)] no-underline hover:underline"
                          >
                            <ChevronRight size={11} /> Borrow for a similar reason
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA to borrow */}
              <div className="mt-4 flex items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-(--border) bg-(--surface-soft) px-4 py-[0.85rem] text-center text-[0.82rem] text-(--text-secondary)">
                <Target size={15} strokeWidth={2.2} /> Borrow this item and add your story to the trail
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Price card */}
          <div className="rounded-[20px] bg-[linear-gradient(160deg,#31236a,#6d5bba)] p-6 shadow-[0_16px_48px_rgba(59,42,128,0.3)]">
            <div className="text-[0.78rem] font-bold uppercase tracking-[0.1em] text-white/70">Rental Price</div>
            <div className="mb-[0.15rem] mt-[0.4rem] text-[2.2rem] font-black leading-[1.1] tracking-[-0.04em] text-white">
              {fmt(product.pricePerDay)}
            </div>
            <div className="mb-5 text-[0.8rem] text-white/65">per borrowing cycle</div>

            {/* Date pickers */}
            <div className="mb-4 grid gap-[0.65rem]">
              <div>
                <label className="mb-1 block text-[0.75rem] font-semibold text-white/70">
                  <Calendar size={12} className="mr-1 inline" />Start Date
                </label>
                <input
                  type="date" value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full box-border rounded-[10px] border border-white/20 bg-white/12 px-[0.85rem] py-[0.6rem] text-[0.85rem] text-white outline-none [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[0.75rem] font-semibold text-white/70">
                  <Calendar size={12} className="mr-1 inline" />End Date
                </label>
                <input
                  type="date" value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full box-border rounded-[10px] border border-white/20 bg-white/12 px-[0.85rem] py-[0.6rem] text-[0.85rem] text-white outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Duration summary */}
            {days > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-xl bg-white/12 p-3">
                <span className="text-[0.82rem] text-white/80">{days} day{days > 1 ? "s" : ""}</span>
                <span className="text-[1.05rem] font-black text-white">{fmt(product.pricePerDay * days)}</span>
              </div>
            )}

            {cartError && (
              <div className="mb-3 rounded-[10px] bg-[rgba(220,38,38,0.12)] px-[0.85rem] py-2 text-[0.8rem] font-semibold text-[#fca5a5]">
                {cartError}
              </div>
            )}

            {cartAdded ? (
              <div className="flex flex-col gap-2">
                <div className="flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/15 p-[0.85rem] text-[0.9rem] font-black text-white">
                  <Check size={16} /> Added to Cart
                </div>
                <Link
                  href="/dashboard/cart"
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-white p-[0.85rem] text-[0.95rem] font-black text-[#31236a] no-underline"
                >
                  <ShoppingCart size={18} /> View Cart →
                </Link>
              </div>
            ) : (
              <button
                onClick={addToCart}
                disabled={cartPending}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-white p-[0.85rem] text-[0.95rem] font-black text-[#31236a] disabled:opacity-70"
              >
                <ShoppingCart size={18} />
                {cartPending ? "Adding…" : "Add to Cart"}
              </button>
            )}
          </div>

          {/* Lender card */}
          <div className="rounded-[18px] border border-[#e3dcf3] bg-white p-5 shadow-[0_8px_24px_rgba(59,42,128,0.06)]">
            <div className="mb-[0.85rem] flex items-center justify-between font-extrabold text-[#1b1530]">
              Lender Details
              <span className="rounded-full bg-[#d1fae5] px-[9px] py-[3px] text-[0.72rem] font-extrabold text-[#059669]">
                <Star size={10} className="inline" /> {String(product.lenderRating)}
              </span>
            </div>
            <div className="mb-[0.85rem] flex items-center gap-2.5">
              <LenderAvatar name={product.lenderName} imageUrl={product.lender.imageUrl} />
              <div>
                <button
                  type="button"
                  onClick={() => setLenderOpen(true)}
                  className="cursor-pointer border-0 bg-transparent p-0 text-left font-extrabold text-[#1b1530] underline-offset-4 hover:text-[#3b2a80] hover:underline"
                >
                  {product.lenderName}
                </button>
                <div className="text-[0.78rem] text-[#9187b0]">Verified Lender</div>
              </div>
            </div>
            {product.lenderNote && (
              <p className="mb-[0.85rem] text-[0.82rem] leading-[1.6] text-(--text-secondary)">{product.lenderNote}</p>
            )}
            <Link
              href={`/dashboard/messages?userId=${product.lender.id}`}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-(--surface-soft) p-[0.65rem] text-[0.85rem] font-bold text-[#31236a] no-underline"
            >
              <MessageSquare size={15} /> Message Lender
            </Link>
          </div>

          {/* Compensation card */}
          <div className="rounded-[18px] border border-[#e3dcf3] bg-white p-5 shadow-[0_8px_24px_rgba(59,42,128,0.06)]">
            <div className="mb-[0.85rem] flex items-center gap-1.5 text-[0.92rem] font-extrabold text-[#1b1530]">
              <ShieldCheck size={15} color="#3b2a80" /> Compensation Fees
            </div>
            <div className="grid gap-[0.7rem]">
              <div className="flex justify-between border-b border-(--border) pb-[0.7rem]">
                <div className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#9187b0]">If lost or major damage</div>
                <div className="text-[0.92rem] font-black text-[#dc2626]">{product.compensationMajor ?? "Contact lender"}</div>
              </div>
              <div className="flex justify-between">
                <div className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#9187b0]">If minor damage</div>
                <div className="text-[0.92rem] font-black text-[#d97706]">{product.compensationMinor ?? "Contact lender"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar products */}
      {similarProducts.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[0.78rem] font-bold uppercase tracking-[0.1em] text-[#9187b0]">More from this category</div>
              <h2 className="mt-0.5 text-[1.2rem] font-black text-[#1b1530]">Similar Products</h2>
            </div>
            <Link href="/dashboard/browse" className="text-[0.85rem] font-bold text-[#31236a] no-underline">See all →</Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {similarProducts.map((p) => (
              <Link key={p.id} href={p.lentItemId ? `/dashboard/items/${p.lentItemId}` : `/products/${p.slug}`} className="block overflow-hidden rounded-2xl border border-[#e3dcf3] bg-white no-underline shadow-[0_4px_16px_rgba(59,42,128,0.06)]">
                <div className="relative h-[140px] bg-[#f2eefb]">
                  <FallbackImage src={p.imageUrl ?? ""} alt={p.name} fill sizes="22vw" className="object-cover" />
                </div>
                <div className="p-4">
                  <div className="mb-1 text-[0.9rem] font-extrabold text-[#1b1530]">{p.name}</div>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.78rem] text-[#9187b0]">{p.description.slice(0, 80)}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[0.92rem] font-black text-[#31236a]">TK {p.pricePerDay.toLocaleString()}</span>
                    <ChevronRight size={16} color="#9187b0" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {lenderOpen && (
        <UserProfileModal userId={product.lender.id} onClose={() => setLenderOpen(false)} />
      )}
    </main>
  );
}
