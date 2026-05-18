"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapPin, Package, ClipboardList, Clock3, Check, X,
  RotateCcw, Inbox, History, Activity,
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
    name: string;
    description: string | null;
    category: string;
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

export default function MyItemsPage() {
  const [tab, setTab] = useState<Tab>("listings");
  const [lentItems, setLentItems] = useState<LentItem[]>([]);
  const [requests, setRequests] = useState<BorrowCheckout[]>([]);
  const [activeOrders, setActiveOrders] = useState<BorrowCheckout[]>([]);
  const [history, setHistory] = useState<BorrowCheckout[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<string | null>(null);

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

  async function handleAccept(orderId: string) {
    setActionPending(orderId);
    try {
      const res = await fetch(`/api/borrow-orders/${orderId}/accept`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Request accepted!");
        void fetchAll();
      } else {
        toast.error("Failed to accept request");
      }
    } finally {
      setActionPending(null);
    }
  }

  async function handleReject(orderId: string) {
    setActionPending(orderId);
    try {
      const res = await fetch(`/api/borrow-orders/${orderId}/reject`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Request declined");
        void fetchAll();
      } else {
        toast.error("Failed to decline request");
      }
    } finally {
      setActionPending(null);
    }
  }

  async function handleRelist(lentItemId: string) {
    setActionPending(lentItemId);
    try {
      const res = await fetch(`/api/lent-items/${lentItemId}/relist`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Item re-listed!");
        void fetchAll();
      } else {
        toast.error("Failed to re-list item");
      }
    } finally {
      setActionPending(null);
    }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "listings",  label: "My Listings",    count: lentItems.length },
    { id: "requests",  label: "Requests",        count: requests.length },
    { id: "active",    label: "Active Borrows",  count: activeOrders.length },
    { id: "history",   label: "History",         count: history.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--surface-soft)]">
      <div className="space-y-6 p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--primary)]/10 via-[var(--primary)]/5 to-transparent border border-[var(--border)] shadow-lg">
          <div className="relative p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">My Items</h1>
                <p className="text-base text-[var(--text-secondary)] max-w-md">
                  Manage your lending inventory and incoming borrow requests.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[var(--primary)]/10">
                      <Package className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">{lentItems.length}</div>
                      <div className="text-xs text-[var(--text-secondary)]">listed</div>
                    </div>
                  </div>
                </div>
                {requests.length > 0 && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 shadow-lg px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-100">
                        <Inbox className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-amber-700">{requests.length}</div>
                        <div className="text-xs text-amber-600">pending</div>
                      </div>
                    </div>
                  </div>
                )}
                <AddItemModal />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl bg-[var(--surface-soft)] p-1 border border-[var(--border)]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                tab === t.id
                  ? "bg-white shadow text-[var(--primary)] border border-[var(--border)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-black ${
                  tab === t.id ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-[var(--border)] text-[var(--text-secondary)]"
                } ${t.id === "requests" ? "bg-amber-100 text-amber-700" : ""}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-3xl bg-[var(--surface-soft)]" />
            ))}
          </div>
        ) : (
          <>
            {/* Tab: My Listings */}
            {tab === "listings" && (
              lentItems.length === 0 ? (
                <EmptyState icon={<ClipboardList className="h-10 w-10 text-[var(--primary)]" />} title="No items yet" body="Add items to lend so they appear here." />
              ) : (
                <div className="grid gap-4">
                  {lentItems.map((item) => (
                    <article key={item.id} className="rounded-[1.5rem] border border-[var(--dark-border)] bg-[var(--surface)] p-6 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{item.product.category}</p>
                          <h2 className="mt-2 text-xl font-bold text-[var(--foreground)]">{item.product.name}</h2>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] ${
                          item.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                        <div className="space-y-3">
                          <p className="text-sm leading-7 text-[var(--text-secondary)]">{item.product.description ?? "No description provided."}</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-3xl bg-[var(--surface-soft)] px-4 py-4">
                              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                                <MapPin className="h-4 w-4" />
                                <span>{item.product.location || "Location not set"}</span>
                              </div>
                            </div>
                            <div className="rounded-3xl bg-[var(--surface-soft)] px-4 py-4">
                              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                                <Clock3 className="h-4 w-4" />
                                <span>Added {item.createdAt.slice(0, 10)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="relative h-52 w-full overflow-hidden rounded-3xl bg-[var(--surface-soft)] sm:w-72">
                          <FallbackImage src={item.product.imageUrl} alt={item.product.name} fill sizes="(max-width: 640px) 100vw, 288px" className="object-cover" />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )
            )}

            {/* Tab: Requests */}
            {tab === "requests" && (
              requests.length === 0 ? (
                <EmptyState icon={<Inbox className="h-10 w-10 text-[var(--primary)]" />} title="No pending requests" body="New borrow requests from borrowers will appear here." />
              ) : (
                <div className="grid gap-4">
                  {requests.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-black text-[var(--primary)]">
                          {initials(order.borrower.name, order.borrower.userName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-[var(--foreground)]">
                              {order.borrower.name ?? order.borrower.userName ?? "Unknown"}
                            </span>
                            <span className="text-[var(--text-secondary)] text-sm">wants to borrow</span>
                            <span className="font-semibold text-[var(--primary)]">{order.product.name}</span>
                          </div>
                          {order.notes && (
                            <p className="mt-1 text-sm text-[var(--text-secondary)] italic">"{order.notes}"</p>
                          )}
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            Requested {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleAccept(order.id)}
                            disabled={actionPending === order.id}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition-opacity hover:bg-emerald-600 disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" /> Accept
                          </button>
                          <button
                            onClick={() => handleReject(order.id)}
                            disabled={actionPending === order.id}
                            className="flex items-center gap-1.5 rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-200 disabled:opacity-50"
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

            {/* Tab: Active Borrows */}
            {tab === "active" && (
              activeOrders.length === 0 ? (
                <EmptyState icon={<Activity className="h-10 w-10 text-[var(--primary)]" />} title="No active borrows" body="Items currently being borrowed will appear here." />
              ) : (
                <div className="grid gap-4">
                  {activeOrders.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
                          {initials(order.borrower.name, order.borrower.userName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-[var(--foreground)]">
                              {order.borrower.name ?? order.borrower.userName ?? "Unknown"}
                            </span>
                            <span className="text-[var(--text-secondary)] text-sm">is borrowing</span>
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

            {/* Tab: History */}
            {tab === "history" && (
              history.length === 0 ? (
                <EmptyState icon={<History className="h-10 w-10 text-[var(--primary)]" />} title="No history yet" body="Completed borrows will appear here. Re-list returned items to make them available again." />
              ) : (
                <div className="grid gap-4">
                  {history.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-sm font-black text-[var(--text-secondary)]">
                          {initials(order.borrower.name, order.borrower.userName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-[var(--foreground)]">
                              {order.borrower.name ?? order.borrower.userName ?? "Unknown"}
                            </span>
                            <span className="text-[var(--text-secondary)] text-sm">returned</span>
                            <span className="font-semibold text-[var(--primary)]">{order.product.name}</span>
                          </div>
                          {order.returnedAt && (
                            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                              Returned {new Date(order.returnedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          )}
                          {order.trailEntry && (
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                              Used for: <span className="font-medium text-[var(--foreground)]">{order.trailEntry.useFor}</span>
                              {" · "}{"⭐".repeat(order.trailEntry.itemRating)}
                            </p>
                          )}
                        </div>
                        {order.lentItem && (
                          <button
                            onClick={() => handleRelist(order.lentItem!.id)}
                            disabled={actionPending === order.lentItem.id}
                            className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)]/10 px-4 py-2 text-sm font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20 disabled:opacity-50"
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

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-8 py-12 text-center text-[var(--text-secondary)]">
      <div className="mx-auto w-fit">{icon}</div>
      <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="mt-2 max-w-xl mx-auto text-sm">{body}</p>
    </div>
  );
}
