"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapPin, Package, ClipboardList, Clock3, Check, X,
  RotateCcw, Inbox, History, Activity, Eye, Trash2,
  TrendingUp, Star, CircleCheck, CircleMinus, ShoppingBag,
} from "lucide-react";
import AddItemModal from "./AddItemModal";
import toast from "react-hot-toast";
import FallbackImage from "@/components/FallbackImage";

type LentItem = {
  id: string;
  status: string;
  createdAt: string;
  product: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    category: string;
    subcategory: string | null;
    location: string;
    imageUrl: string | null;
    pricePerDay: number;
    deposit: number | null;
  };
};

type BorrowCheckout = {
  id: string;
  status: string;
  createdAt: string;
  returnedAt: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  product: { id: string; name: string; imageUrl: string | null; category: string };
  lentItem: { id: string; status: string } | null;
  borrower: { id: string; name: string | null; firstName: string | null; lastName: string | null; userName: string | null };
  lender:   { id: string; name: string | null; firstName: string | null; lastName: string | null; userName: string | null };
  trailEntry: { id: string; useFor: string; itemRating: number } | null;
};

type Tab = "listings" | "requests" | "active" | "history";

function initials(name: string | null, userName: string | null) {
  const n = name ?? userName ?? "?";
  return n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-BD").format(n);
}

export default function MyItemsPage() {
  const [tab, setTab] = useState<Tab>("listings");
  const [lentItems, setLentItems] = useState<LentItem[]>([]);
  const [requests, setRequests] = useState<BorrowCheckout[]>([]);
  const [activeOrders, setActiveOrders] = useState<BorrowCheckout[]>([]);
  const [history, setHistory] = useState<BorrowCheckout[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, pendingRes, activeRes, historyRes] = await Promise.all([
        fetch("/api/lent-items"),
        fetch("/api/borrow-orders?role=lender&status=pending"),
        fetch("/api/borrow-orders?role=lender&status=accepted"),
        fetch("/api/borrow-orders?role=lender&status=returned"),
      ]);
      if (itemsRes.ok) setLentItems(await itemsRes.json() as LentItem[]);
      if (pendingRes.ok) setRequests(await pendingRes.json() as BorrowCheckout[]);
      if (activeRes.ok) setActiveOrders(await activeRes.json() as BorrowCheckout[]);
      if (historyRes.ok) setHistory(await historyRes.json() as BorrowCheckout[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  async function handleToggleStatus(item: LentItem) {
    setActionPending(item.id);
    try {
      const res = await fetch(`/api/lent-items/${item.id}`, { method: "PATCH" });
      if (res.ok) {
        const next = item.status === "active" ? "paused" : "active";
        toast.success(next === "active" ? "Listing activated" : "Listing paused");
        void fetchAll();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { error?: string }).error ?? "Failed to update status");
      }
    } finally {
      setActionPending(null);
    }
  }

  async function handleDelete(lentItemId: string) {
    setActionPending(lentItemId);
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/lent-items/${lentItemId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Listing removed");
        void fetchAll();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { error?: string }).error ?? "Failed to remove listing");
      }
    } finally {
      setActionPending(null);
    }
  }

  async function handleAccept(orderId: string) {
    setActionPending(orderId);
    try {
      const res = await fetch(`/api/borrow-orders/${orderId}/accept`, { method: "PATCH" });
      if (res.ok) { toast.success("Request accepted!"); void fetchAll(); }
      else toast.error("Failed to accept request");
    } finally { setActionPending(null); }
  }

  async function handleReject(orderId: string) {
    setActionPending(orderId);
    try {
      const res = await fetch(`/api/borrow-orders/${orderId}/reject`, { method: "PATCH" });
      if (res.ok) { toast.success("Request declined"); void fetchAll(); }
      else toast.error("Failed to decline request");
    } finally { setActionPending(null); }
  }

  async function handleRelist(lentItemId: string) {
    setActionPending(lentItemId);
    try {
      const res = await fetch(`/api/lent-items/${lentItemId}/relist`, { method: "PATCH" });
      if (res.ok) { toast.success("Item re-listed!"); void fetchAll(); }
      else toast.error("Failed to re-list item");
    } finally { setActionPending(null); }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "listings",  label: "My Listings",   icon: <ClipboardList className="h-4 w-4" />, count: lentItems.length },
    { id: "requests",  label: "Requests",       icon: <Inbox className="h-4 w-4" />,         count: requests.length },
    { id: "active",    label: "Active Borrows", icon: <Activity className="h-4 w-4" />,       count: activeOrders.length },
    { id: "history",   label: "History",        icon: <History className="h-4 w-4" />,        count: history.length },
  ];

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="mx-auto max-w-5xl space-y-6 p-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">Lent Items</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Manage your listings and incoming borrow requests.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {requests.length > 0 && (
              <button
                onClick={() => setTab("requests")}
                className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100"
              >
                <Inbox className="h-4 w-4" />
                {requests.length} pending
              </button>
            )}
            <AddItemModal />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Listed",   value: lentItems.length,                              icon: <Package className="h-4 w-4" />,     color: "text-[var(--primary)]",  bg: "bg-[var(--primary-soft)]" },
            { label: "Requests", value: requests.length,                               icon: <Inbox className="h-4 w-4" />,        color: "text-amber-600",          bg: "bg-amber-50" },
            { label: "Active",   value: activeOrders.length,                           icon: <TrendingUp className="h-4 w-4" />,   color: "text-emerald-600",        bg: "bg-emerald-50" },
            { label: "History",  value: history.length,                                icon: <History className="h-4 w-4" />,      color: "text-[var(--text-muted)]", bg: "bg-[var(--surface-soft)]" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className={`mb-2 inline-flex rounded-xl p-2 ${s.bg}`}>
                <span className={s.color}>{s.icon}</span>
              </div>
              <div className="text-xl font-black text-[var(--ink)]">{s.value}</div>
              <div className="text-xs font-semibold text-[var(--text-muted)]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                tab === t.id
                  ? "bg-[var(--surface)] shadow text-[var(--primary)] border border-[var(--border)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--ink)]"
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-black ${
                  t.id === "requests"
                    ? "bg-amber-100 text-amber-700"
                    : tab === t.id
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "bg-[var(--border)] text-[var(--text-muted)]"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--surface-soft)]" />
            ))}
          </div>
        ) : (
          <>
            {/* ── My Listings ── */}
            {tab === "listings" && (
              lentItems.length === 0 ? (
                <EmptyState icon={<ClipboardList className="h-10 w-10 text-[var(--primary)]" />} title="No items listed yet" body="Add your first item to start lending." />
              ) : (
                <div className="space-y-3">
                  {lentItems.map((item) => (
                    <ListingCard
                      key={item.id}
                      item={item}
                      actionPending={actionPending}
                      confirmDelete={confirmDelete}
                      onToggle={handleToggleStatus}
                      onDeleteRequest={(id) => setConfirmDelete(id)}
                      onDeleteConfirm={handleDelete}
                      onDeleteCancel={() => setConfirmDelete(null)}
                    />
                  ))}
                </div>
              )
            )}

            {/* ── Requests ── */}
            {tab === "requests" && (
              requests.length === 0 ? (
                <EmptyState icon={<Inbox className="h-10 w-10 text-[var(--primary)]" />} title="No pending requests" body="New borrow requests from borrowers will appear here." />
              ) : (
                <div className="space-y-3">
                  {requests.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-black text-[var(--primary)]">
                          {initials(order.borrower.name, order.borrower.userName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-[var(--ink)]">
                              {order.borrower.name ?? order.borrower.userName ?? "Unknown"}
                            </span>
                            <span className="text-sm text-[var(--text-secondary)]">wants to borrow</span>
                            <span className="font-semibold text-[var(--primary)]">{order.product.name}</span>
                          </div>
                          {order.notes && (
                            <p className="mt-1 text-sm italic text-[var(--text-secondary)]">"{order.notes}"</p>
                          )}
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => handleAccept(order.id)}
                            disabled={actionPending === order.id}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" /> Accept
                          </button>
                          <button
                            onClick={() => handleReject(order.id)}
                            disabled={actionPending === order.id}
                            className="flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                          >
                            <X className="h-4 w-4" /> Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── Active Borrows ── */}
            {tab === "active" && (
              activeOrders.length === 0 ? (
                <EmptyState icon={<Activity className="h-10 w-10 text-[var(--primary)]" />} title="No active borrows" body="Items currently being borrowed will appear here." />
              ) : (
                <div className="space-y-3">
                  {activeOrders.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
                          {initials(order.borrower.name, order.borrower.userName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-[var(--ink)]">
                              {order.borrower.name ?? order.borrower.userName ?? "Unknown"}
                            </span>
                            <span className="text-sm text-[var(--text-secondary)]">is borrowing</span>
                            <span className="font-semibold text-[var(--primary)]">{order.product.name}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                            Accepted {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            {order.endDate && ` · Due ${new Date(order.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── History ── */}
            {tab === "history" && (
              history.length === 0 ? (
                <EmptyState icon={<History className="h-10 w-10 text-[var(--primary)]" />} title="No history yet" body="Completed borrows will appear here." />
              ) : (
                <div className="space-y-3">
                  {history.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-sm font-black text-[var(--text-secondary)]">
                          {initials(order.borrower.name, order.borrower.userName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-[var(--ink)]">
                              {order.borrower.name ?? order.borrower.userName ?? "Unknown"}
                            </span>
                            <span className="text-sm text-[var(--text-secondary)]">returned</span>
                            <span className="font-semibold text-[var(--primary)]">{order.product.name}</span>
                          </div>
                          {order.returnedAt && (
                            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                              {new Date(order.returnedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          )}
                          {order.trailEntry && (
                            <div className="mt-1 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                              <span>Used for:</span>
                              <span className="font-medium text-[var(--ink)]">{order.trailEntry.useFor}</span>
                              <span className="mx-1 text-[var(--border)]">·</span>
                              <span className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < order.trailEntry!.itemRating ? "fill-amber-400 text-amber-400" : "text-[var(--border)]"}`}
                                  />
                                ))}
                              </span>
                            </div>
                          )}
                        </div>
                        {order.lentItem && (
                          <button
                            onClick={() => handleRelist(order.lentItem!.id)}
                            disabled={actionPending === order.lentItem.id}
                            className="flex items-center gap-1.5 rounded-xl bg-[var(--primary-soft)] px-4 py-2 text-sm font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20 disabled:opacity-50"
                          >
                            <RotateCcw className="h-4 w-4" /> Re-list
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Listing Card ──────────────────────────────────────────────────────────────

function ListingCard({
  item,
  actionPending,
  confirmDelete,
  onToggle,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  item: LentItem;
  actionPending: string | null;
  confirmDelete: string | null;
  onToggle: (item: LentItem) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}) {
  const isActive = item.status === "active";
  const isBorrowed = item.status === "borrowed";
  const isPending = actionPending === item.id;
  const isConfirming = confirmDelete === item.id;

  return (
    <article className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-shadow hover:shadow-md">
      <div className="flex gap-4 p-4">

        {/* Thumbnail */}
        <a
          href={`/dashboard/items/${item.id}`}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-soft)]"
        >
          <FallbackImage
            src={item.product.imageUrl}
            alt={item.product.name}
            fill
            sizes="80px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </a>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-[var(--primary)]">
                  {item.product.subcategory ?? item.product.category}
                </span>
                {isBorrowed && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-emerald-700">
                    Borrowed
                  </span>
                )}
              </div>
              <a
                href={`/dashboard/items/${item.id}`}
                className="mt-1 block truncate text-base font-extrabold text-[var(--ink)] hover:text-[var(--primary)]"
              >
                {item.product.name}
              </a>
            </div>

            {/* Price */}
            <div className="shrink-0 text-right">
              <span className="text-lg font-black text-[var(--ink)]">
                ৳{fmt(item.product.pricePerDay)}
              </span>
              <span className="text-xs text-[var(--text-muted)]">/day</span>
              {item.product.deposit && (
                <div className="text-xs text-[var(--text-muted)]">
                  ৳{fmt(item.product.deposit)} deposit
                </div>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
            {item.product.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {item.product.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      {isConfirming ? (
        <div className="flex items-center justify-between rounded-b-2xl border-t border-red-100 bg-red-50 px-4 py-3">
          <span className="text-sm font-semibold text-red-700">Remove this listing permanently?</span>
          <div className="flex gap-2">
            <button
              onClick={onDeleteCancel}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              onClick={() => onDeleteConfirm(item.id)}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Yes, remove
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-b-2xl border-t border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5">

          {/* Status toggle */}
          <button
            onClick={() => !isBorrowed && onToggle(item)}
            disabled={isPending || isBorrowed}
            title={isBorrowed ? "Item is currently borrowed" : isActive ? "Pause listing" : "Activate listing"}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isBorrowed
                ? "text-emerald-600"
                : isActive
                  ? "text-emerald-600 hover:bg-emerald-50"
                  : "text-[var(--text-muted)] hover:bg-[var(--border)]"
            }`}
          >
            {isBorrowed
              ? <ShoppingBag className="h-4 w-4" />
              : isActive
                ? <CircleCheck className="h-4 w-4" />
                : <CircleMinus className="h-4 w-4" />
            }
            {isBorrowed ? "Borrowed" : isActive ? "Active" : "Paused"}
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <a
              href={`/dashboard/items/${item.id}`}
              title="View listing"
              className="rounded-xl p-2 text-(--text-secondary) transition-colors hover:bg-(--border) hover:text-(--ink)"
            >
              <Eye className="h-4 w-4" />
            </a>
            {!isBorrowed && (
              <button
                onClick={() => onDeleteRequest(item.id)}
                disabled={isPending}
                title="Remove listing"
                className="rounded-xl p-2 text-(--text-muted) transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-8 py-12 text-center">
      <div className="mx-auto w-fit">{icon}</div>
      <h2 className="mt-4 text-lg font-semibold text-[var(--ink)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--text-secondary)]">{body}</p>
    </div>
  );
}
