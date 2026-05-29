"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Package, MapPin, Tag, Star, ArrowLeftRight,
  Activity, User, CheckCircle, XCircle, Clock,
  TrendingUp, ShoppingBag, Layers, FileText, Search, X, SlidersHorizontal, ExternalLink,
  ChevronDown, ChevronUp, Eye, EyeOff, Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import ListingStatusPicker from "@/components/admin/products/ListingStatusPicker";
import ProductQueue from "@/components/admin/products/ProductQueue";
import CategoryPicker from "@/components/dashboard/CategoryPicker";
import type { ProductListItem, ProductDetail, ProductPage } from "@/lib/admin/products/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: "bg-amber-50",   text: "text-amber-700",   label: "Pending"   },
  active:    { bg: "bg-emerald-50", text: "text-emerald-700", label: "Active"    },
  accepted:  { bg: "bg-blue-50",    text: "text-blue-700",    label: "Accepted"  },
  returned:  { bg: "bg-teal-50",    text: "text-teal-700",    label: "Returned"  },
  borrowed:  { bg: "bg-blue-50",    text: "text-blue-700",    label: "Borrowed"  },
  inactive:  { bg: "bg-gray-100",   text: "text-gray-500",    label: "Inactive"  },
  cancelled: { bg: "bg-gray-100",   text: "text-gray-500",    label: "Cancelled" },
  rejected:  { bg: "bg-red-50",     text: "text-red-600",     label: "Rejected"  },
  open:      { bg: "bg-amber-50",   text: "text-amber-700",   label: "Open"      },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "bg-gray-100", text: "text-gray-500", label: status };
  return (
    <span className={`text-[0.65rem] font-extrabold rounded-full px-2 py-0.5 capitalize ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Section({
  title, icon, children, count,
}: {
  title: string; icon: React.ReactNode; children: React.ReactNode; count?: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--border)]">
        <span className="text-[var(--text-muted)]">{icon}</span>
        <span className="font-extrabold text-[var(--ink)] text-sm flex-1">{title}</span>
        {count !== undefined && (
          <span className="text-[0.65rem] font-bold text-[var(--text-muted)] bg-[var(--surface-soft)] rounded-full px-2 py-0.5">
            {count}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-[var(--text-muted)] text-center py-4">{label}</p>;
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({ p }: { p: ProductDetail }) {
  // Semantic colors: same system as STATUS_STYLES badges — blue=transactional,
  // emerald=active/healthy, amber=engagement, primary=brand metric (revenue)
  const stats = [
    {
      label: "Total Checkouts",
      value: p.counts.checkouts,
      icon: <ShoppingBag className="h-4 w-4" />,
      card: "bg-blue-50 border-blue-100",
      accent: "text-blue-600",
    },
    {
      label: "Active Listings",
      value: p.counts.activeLentItems,
      icon: <Layers className="h-4 w-4" />,
      card: "bg-emerald-50 border-emerald-100",
      accent: "text-emerald-600",
    },
    {
      label: "Trail Posts",
      value: p.counts.trailEntries,
      icon: <Activity className="h-4 w-4" />,
      card: "bg-amber-50 border-amber-100",
      accent: "text-amber-600",
    },
    {
      label: "Revenue",
      value: `৳${p.counts.totalRevenue}`,
      icon: <TrendingUp className="h-4 w-4" />,
      card: "bg-(--primary-soft) border-(--primary)/20",
      accent: "text-(--primary)",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Hero card */}
      <div className="rounded-2xl border border-(--border) bg-(--surface) shadow-sm overflow-hidden">
        <div className="flex gap-5 p-5">
          {/* Product image / initial placeholder */}
          <div className="h-20 w-20 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center"
            style={{ background: p.imageUrl ? undefined : "linear-gradient(135deg,#3b2a80,#6d5bba)" }}
          >
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-white select-none">
                {p.name[0]?.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-(--ink) tracking-tight leading-tight mb-1">{p.name}</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
              <div className="flex items-center gap-1 text-xs text-(--text-muted)">
                <Tag className="h-3 w-3 shrink-0" />
                <span>{p.category}{p.subcategory ? ` · ${p.subcategory}` : ""}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-(--text-muted)">
                <MapPin className="h-3 w-3 shrink-0" />
                <span>{p.location}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black text-(--primary)">৳{p.pricePerDay}</span>
              <span className="text-sm text-(--text-muted) font-semibold">/ day</span>
              {p.deposit != null && (
                <span className="text-xs text-(--text-muted) bg-(--surface-soft) rounded-full px-2 py-0.5 font-semibold">
                  ৳{p.deposit} deposit
                </span>
              )}
            </div>
            <p className="text-[0.65rem] text-(--text-muted) mt-2">
              Listed {fmt(p.createdAt)} · Updated {fmt(p.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Semantic stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl border ${s.card} p-4 flex flex-col items-center gap-1 shadow-sm`}>
            <span className={s.accent}>{s.icon}</span>
            <span className={`text-xl font-black ${s.accent}`}>{s.value}</span>
            <span className={`text-[0.6rem] font-bold text-center ${s.accent} opacity-70`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Description */}
      <Section title="Description" icon={<FileText className="h-3.5 w-3.5" />}>
        <p className="text-sm text-(--ink) leading-relaxed whitespace-pre-wrap">{p.description}</p>
      </Section>

      {/* Features & Drawbacks */}
      {(p.features.length > 0 || p.drawbacks.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {p.features.length > 0 && (
            <div className="rounded-2xl border border-(--border) bg-(--surface) shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-(--border)">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-extrabold text-(--ink) text-sm">Features</span>
              </div>
              <ul className="p-4 space-y-1.5">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-(--ink)">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {p.drawbacks.length > 0 && (
            <div className="rounded-2xl border border-(--border) bg-(--surface) shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-(--border)">
                <XCircle className="h-3.5 w-3.5 text-red-400" />
                <span className="font-extrabold text-(--ink) text-sm">Drawbacks</span>
              </div>
              <ul className="p-4 space-y-1.5">
                {p.drawbacks.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-(--ink)">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Listed By — with admin action */}
      <Section title="Listed By" icon={<User className="h-3.5 w-3.5" />}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] flex items-center justify-center text-white text-sm font-black shrink-0">
            {p.createdBy.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-(--ink)">{p.createdBy.name}</p>
            <p className="text-xs text-(--text-muted)">{p.createdBy.email}</p>
            {p.createdBy.location && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 text-(--text-muted)" />
                <p className="text-xs text-(--text-muted)">{p.createdBy.location}</p>
              </div>
            )}
          </div>
          <Link
            href={`/admin/users?highlight=${p.createdBy.id}`}
            className="shrink-0 flex items-center gap-1.5 text-[0.7rem] font-bold text-(--primary) border border-(--primary)/30 rounded-lg px-2.5 py-1.5 hover:bg-(--primary-soft) transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View User
          </Link>
        </div>
      </Section>

      {/* Lender note / compensation */}
      {(p.lenderNote || p.compensationMajor) && (
        <div className="grid grid-cols-2 gap-3">
          {p.lenderNote && (
            <Section title="Lender Note" icon={<FileText className="h-3.5 w-3.5" />}>
              <p className="text-sm text-(--ink) leading-relaxed">{p.lenderNote}</p>
            </Section>
          )}
          {(p.compensationMajor || p.compensationMinor) && (
            <Section title="Compensation" icon={<TrendingUp className="h-3.5 w-3.5" />}>
              {p.compensationMajor && (
                <div className="mb-2">
                  <p className="text-[0.65rem] font-extrabold text-(--text-muted) uppercase tracking-widest mb-1">Major</p>
                  <p className="text-sm text-(--ink)">{p.compensationMajor}</p>
                </div>
              )}
              {p.compensationMinor && (
                <div>
                  <p className="text-[0.65rem] font-extrabold text-(--text-muted) uppercase tracking-widest mb-1">Minor</p>
                  <p className="text-sm text-(--ink)">{p.compensationMinor}</p>
                </div>
              )}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab: Listings ─────────────────────────────────────────────────────────────

function ListingsTab({ p }: { p: ProductDetail }) {
  return (
    <Section title="Lent Item Listings" icon={<Layers className="h-3.5 w-3.5" />} count={p.lentItems.length}>
      {p.lentItems.length === 0 ? (
        <EmptyState label="No listings for this product" />
      ) : (
        <div className="space-y-0">
          {p.lentItems.map((li) => (
            <div key={li.id} className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--ink)]">{li.lender.name}</p>
                <p className="text-xs text-[var(--text-muted)]">Listed {fmt(li.createdAt)}</p>
              </div>
              <StatusBadge status={li.status} />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ── Tab: Transactions ─────────────────────────────────────────────────────────

function TransactionsTab({ p }: { p: ProductDetail }) {
  return (
    <Section title="Borrow Checkouts" icon={<ArrowLeftRight className="h-3.5 w-3.5" />} count={p.checkouts.length}>
      {p.checkouts.length === 0 ? (
        <EmptyState label="No transactions yet" />
      ) : (
        <div className="space-y-0">
          {p.checkouts.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--ink)] truncate">
                  {c.borrower.name} <span className="font-normal text-[var(--text-muted)]">← {c.lender.name}</span>
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {c.startDate && c.endDate ? `${fmt(c.startDate)} – ${fmt(c.endDate)}` : fmt(c.createdAt)}
                </p>
              </div>
              <div className="shrink-0 text-right space-y-1">
                <StatusBadge status={c.status} />
                {c.totalPrice != null && (
                  <p className="text-xs font-bold text-[var(--ink)]">৳{c.totalPrice}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ── Tab: Trail ────────────────────────────────────────────────────────────────

type ProductTrailEntry = ProductDetail["trailEntries"][number];

function ProductTrailEntryRow({
  entry,
  onToggleVisibility,
  onDelete,
}: {
  entry: ProductTrailEntry;
  onToggleVisibility: (id: string, isPublic: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState<"visibility" | "delete" | null>(null);

  const tags = Array.isArray(entry.tags) ? (entry.tags as string[]) : [];

  async function toggleVisibility() {
    setPending("visibility");
    try {
      const res = await fetch(`/api/admin/trail/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !entry.isPublic }),
      });
      if (res.ok) {
        onToggleVisibility(entry.id, !entry.isPublic);
        toast.success(entry.isPublic ? "Review hidden" : "Review made public");
      } else {
        toast.error("Failed to update visibility");
      }
    } finally {
      setPending(null);
    }
  }

  async function handleDelete() {
    setPending("delete");
    try {
      const res = await fetch(`/api/admin/trail/${entry.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(entry.id);
        toast.success("Review deleted");
      } else {
        toast.error("Failed to delete review");
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="py-3 border-b border-(--border) last:border-0">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-(--ink) truncate">
            {entry.anonymous ? "Anonymous" : (entry.borrower?.name ?? "Unknown")}
          </p>
          <p className="text-xs text-(--text-muted) truncate">{entry.useFor}</p>
          {entry.location && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-2.5 w-2.5 text-(--text-muted)" />
              <p className="text-[0.65rem] text-(--text-muted)">{entry.location}</p>
            </div>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < entry.itemRating ? "text-amber-400 fill-amber-400" : "text-(--border)"}`}
              />
            ))}
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded-lg text-(--text-muted) hover:text-(--ink) hover:bg-(--surface-soft) transition-colors"
            title="View details"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={toggleVisibility}
            disabled={pending !== null}
            className="p-1 rounded-lg text-(--text-muted) hover:text-(--ink) hover:bg-(--surface-soft) transition-colors disabled:opacity-50"
            title={entry.isPublic ? "Hide review" : "Make public"}
          >
            {entry.isPublic ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleDelete}
            disabled={pending !== null}
            className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Delete review"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mt-1">
        {!entry.isPublic && (
          <span className="text-[0.58rem] font-bold bg-amber-50 text-amber-600 rounded px-1.5 py-0.5">Hidden</span>
        )}
        {entry.anonymous && (
          <span className="text-[0.58rem] font-bold bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">Anon</span>
        )}
        <span className="text-[0.6rem] text-(--text-muted)">{fmt(entry.createdAt)}</span>
      </div>

      {expanded && (
        <div className="mt-2 rounded-xl bg-(--surface-soft) p-3 space-y-1.5 text-xs text-(--text-muted)">
          <p><span className="font-semibold text-(--ink)">Used for:</span> {entry.useFor}</p>
          {entry.location && <p><span className="font-semibold text-(--ink)">Location:</span> {entry.location}</p>}
          {tags.length > 0 && (
            <p><span className="font-semibold text-(--ink)">Tags:</span> {tags.join(", ")}</p>
          )}
          {entry.borrower && !entry.anonymous && (
            <p><span className="font-semibold text-(--ink)">Borrower ID:</span> {entry.borrower.id}</p>
          )}
          <p><span className="font-semibold text-(--ink)">Posted:</span> {new Date(entry.createdAt).toISOString()}</p>
        </div>
      )}
    </div>
  );
}

function TrailTab({
  p,
  onUpdateTrail,
}: {
  p: ProductDetail;
  onUpdateTrail: (updater: (entries: ProductTrailEntry[]) => ProductTrailEntry[]) => void;
}) {
  function handleToggleVisibility(id: string, isPublic: boolean) {
    onUpdateTrail((entries) => entries.map((e) => (e.id === id ? { ...e, isPublic } : e)));
  }

  function handleDelete(id: string) {
    onUpdateTrail((entries) => entries.filter((e) => e.id !== id));
  }

  return (
    <Section title="Item Trail Posts" icon={<Activity className="h-3.5 w-3.5" />} count={p.trailEntries.length}>
      {p.trailEntries.length === 0 ? (
        <EmptyState label="No trail posts yet" />
      ) : (
        <div>
          {p.trailEntries.map((t) => (
            <ProductTrailEntryRow
              key={t.id}
              entry={t}
              onToggleVisibility={handleToggleVisibility}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </Section>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="px-6 py-5 space-y-4 animate-pulse">
      <div className="h-36 rounded-2xl bg-[var(--surface-soft)]" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-[var(--surface-soft)]" />)}
      </div>
      <div className="h-24 rounded-2xl bg-[var(--surface-soft)]" />
      <div className="h-32 rounded-2xl bg-[var(--surface-soft)]" />
    </div>
  );
}

// ── Side panel ────────────────────────────────────────────────────────────────

function SidePanel({ p }: { p: ProductDetail | null }) {
  if (!p) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[var(--surface-soft)] h-32 animate-pulse" />
        <div className="rounded-2xl bg-[var(--surface-soft)] h-24 animate-pulse" />
      </div>
    );
  }

  const listingRatio = p.counts.lentItems > 0
    ? Math.round((p.counts.activeLentItems / p.counts.lentItems) * 100)
    : 0;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <p className="text-[0.6rem] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Slug</p>
        <p className="text-xs font-mono text-[var(--ink)] break-all">{p.slug}</p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <p className="text-[0.6rem] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-2">Listing Health</p>
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-[var(--text-muted)]">Active listings</span>
          <span className="text-xs font-bold text-[var(--ink)]">{p.counts.activeLentItems} / {p.counts.lentItems}</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${listingRatio}%` }}
          />
        </div>
        <p className="text-[0.6rem] text-[var(--text-muted)] mt-1">{listingRatio}% active</p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <p className="text-[0.6rem] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-2">Revenue</p>
        <p className="text-2xl font-black text-[var(--ink)]">৳{p.counts.totalRevenue}</p>
        <p className="text-[0.65rem] text-[var(--text-muted)] mt-0.5">across {p.counts.checkouts} checkout{p.counts.checkouts !== 1 ? "s" : ""}</p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <p className="text-[0.6rem] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-2">Pricing</p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-[var(--text-muted)]">Per day</span>
            <span className="text-xs font-bold text-[var(--ink)]">৳{p.pricePerDay}</span>
          </div>
          {p.deposit != null && (
            <div className="flex justify-between">
              <span className="text-xs text-[var(--text-muted)]">Deposit</span>
              <span className="text-xs font-bold text-[var(--ink)]">৳{p.deposit}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Console ──────────────────────────────────────────────────────────────

type Tab = "overview" | "listings" | "transactions" | "trail";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",      label: "Overview",      icon: <Package className="h-3.5 w-3.5" /> },
  { id: "listings",      label: "Listings",       icon: <Layers className="h-3.5 w-3.5" /> },
  { id: "transactions",  label: "Transactions",   icon: <ArrowLeftRight className="h-3.5 w-3.5" /> },
  { id: "trail",         label: "Trail",          icon: <Activity className="h-3.5 w-3.5" /> },
];

export default function AdminProductsPage() {
  const [products, setProducts]               = useState<ProductListItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [loadingMore, setLoadingMore]         = useState(false);
  const [nextCursor, setNextCursor]           = useState<string | null>(null);
  const [hasMore, setHasMore]                 = useState(false);
  const [selectedId, setSelectedId]           = useState<string | null>(null);
  const [detail, setDetail]                   = useState<ProductDetail | null>(null);
  const [detailLoading, setDetailLoading]     = useState(false);
  const [activeTab, setActiveTab]             = useState<Tab>("overview");
  const fetchingMore = useRef(false);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filtersOpen, setFiltersOpen]     = useState(false);
  const [search, setSearch]               = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // filterSub[0] = selected subcategory (CategoryPicker single mode)
  const [filterSub, setFilterSub]         = useState<string[]>([]);
  const [filterStatus, setFilterStatus]   = useState("");

  const anyFilterActive = !!(search || filterSub.length > 0 || filterStatus);
  const anyNonSearchFilter = !!(filterSub.length > 0 || filterStatus);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Main fetch (resets on any filter change) ──────────────────────────────
  useEffect(() => {
    setProductsLoading(true);
    setProducts([]);
    setNextCursor(null);
    setHasMore(false);

    const params = new URLSearchParams();
    if (debouncedSearch)  params.set("search", debouncedSearch);
    if (filterSub[0])     params.set("subcategory", filterSub[0]);
    if (filterStatus)     params.set("listingStatus", filterStatus);

    fetch(`/api/admin/products?${params}`)
      .then((r) => r.ok ? r.json() as Promise<ProductPage> : Promise.reject())
      .then(({ items, nextCursor: nc }) => {
        setProducts(items);
        setNextCursor(nc);
        setHasMore(nc !== null);
        setSelectedId(items.length > 0 ? items[0].id : null);
      })
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [debouncedSearch, filterSub, filterStatus]);

  const loadMore = useCallback(() => {
    if (fetchingMore.current || !nextCursor) return;
    fetchingMore.current = true;
    setLoadingMore(true);

    const params = new URLSearchParams({ cursor: nextCursor });
    if (debouncedSearch)  params.set("search", debouncedSearch);
    if (filterSub[0])     params.set("subcategory", filterSub[0]);
    if (filterStatus)     params.set("listingStatus", filterStatus);

    fetch(`/api/admin/products?${params}`)
      .then((r) => r.ok ? r.json() as Promise<ProductPage> : Promise.reject())
      .then(({ items, nextCursor: nc }) => {
        setProducts((prev) => [...prev, ...items]);
        setNextCursor(nc);
        setHasMore(nc !== null);
      })
      .catch(() => {})
      .finally(() => {
        fetchingMore.current = false;
        setLoadingMore(false);
      });
  }, [nextCursor, debouncedSearch, filterSub, filterStatus]);

  const fetchDetail = useCallback((id: string) => {
    setDetailLoading(true);
    setDetail(null);
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.ok ? r.json() as Promise<ProductDetail> : Promise.reject())
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, []);

  useEffect(() => {
    if (selectedId) {
      setActiveTab("overview");
      fetchDetail(selectedId);
    }
  }, [selectedId, fetchDetail]);

  const clearFilters = () => {
    setSearch("");
    setFilterSub([]);
    setFilterStatus("");
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Product queue sidebar ──
           overflow-hidden is intentionally NOT on this outer div so the
           CategoryPicker dropdown can escape the sidebar bounds. The inner
           queue wrapper has its own overflow-hidden for scrolling.        */}
      {/* relative here lets z-100 on the filter bar create a proper stacking context */}
      <div className="relative w-72 shrink-0 flex flex-col bg-[#12082e] shadow-[1px_0_0_0_rgba(255,255,255,0.07)]">

        {/* ── Filter bar ── z-100 ensures dropdowns float above the product queue */}
        <div className="px-3 pt-3 pb-2.5 border-b border-white/10 shrink-0 relative z-100">

          {/* Row: search input + filter toggle button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white rounded-xl border border-gray-200 pl-8 pr-7 py-2 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-(--primary) shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter toggle — indicator dot when filters active but panel closed */}
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className={`relative shrink-0 rounded-xl border p-2 transition-all ${
                filtersOpen
                  ? "border-white/30 bg-white/15 text-white"
                  : "border-white/15 bg-white/8 text-white/50 hover:bg-white/12 hover:text-white/70"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {anyNonSearchFilter && !filtersOpen && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-(--primary)" />
              )}
            </button>
          </div>

          {/* Collapsible filter options — conditional render (no overflow-hidden wrapper
              so CategoryPicker and ListingStatusPicker dropdowns are never clipped) */}
          {filtersOpen && (
            <div className="mt-2.5 space-y-2">
              <CategoryPicker
                mode="single"
                value={filterSub}
                onChange={setFilterSub}
                placeholder="Filter by category…"
                variant="dark"
              />

              <ListingStatusPicker
                value={filterStatus}
                onChange={setFilterStatus}
              />

              {anyFilterActive && (
                <button
                  onClick={clearFilters}
                  className="text-[0.65rem] text-white/35 hover:text-white/60 transition-colors flex items-center gap-1"
                >
                  <X className="h-2.5 w-2.5" />
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Queue — overflow-hidden lives here so the filter bar above stays free ── */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {productsLoading ? (
            <div className="p-3 space-y-2 animate-pulse">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-white/25">No products found</p>
            </div>
          ) : (
            <ProductQueue
              products={products}
              selectedId={selectedId}
              onSelect={setSelectedId}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
            />
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {(detail || detailLoading) && (
          <div className="shrink-0 flex items-center gap-0.5 px-4 pt-3 pb-0 border-b border-(--border) bg-(--surface) overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg whitespace-nowrap border-b-2 transition-all ${
                  activeTab === t.id
                    ? "text-(--primary) border-(--primary) bg-(--primary-soft)"
                    : "text-(--text-muted) border-transparent hover:text-(--ink) hover:bg-(--surface-soft)"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {detailLoading || (!detail && selectedId) ? (
            <DetailSkeleton />
          ) : detail ? (
            <div className="px-6 py-5">
              {activeTab === "overview"     && <OverviewTab p={detail} />}
              {activeTab === "listings"     && <ListingsTab p={detail} />}
              {activeTab === "transactions" && <TransactionsTab p={detail} />}
              {activeTab === "trail"        && (
                <TrailTab
                  p={detail}
                  onUpdateTrail={(updater) =>
                    setDetail((prev) =>
                      prev ? { ...prev, trailEntries: updater(prev.trailEntries) } : prev
                    )
                  }
                />
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center h-full">
              <p className="text-sm text-(--text-muted)">Select a product to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Side panel ── */}
      <div className="w-60 shrink-0 border-l border-(--border) overflow-y-auto scrollbar-thin p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-(--text-muted)" />
          <span className="text-[0.65rem] font-extrabold text-(--text-muted) uppercase tracking-widest">
            Product Info
          </span>
        </div>
        <SidePanel p={detail} />
      </div>
    </div>
  );
}
