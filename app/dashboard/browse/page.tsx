"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Calendar, ChevronDown, ChevronUp, Coins, Inbox, MapPin, Plus } from "lucide-react";
import FallbackImage from "@/components/FallbackImage";
import CategoryPicker from "@/components/dashboard/CategoryPicker";
import { CATEGORIES, getCategoryForSub } from "@/lib/categories";

// ── Types ──────────────────────────────────────────────────────────────────────

interface BrowseItem {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  pricePerDay: number | null;
  deposit: number | null;
  description: string | null;
  imageUrl: string | null;
  lenderName: string;
}

interface UserSnippet {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
}

interface Offer {
  id: string;
  status: string;
  message: string | null;
  lender: UserSnippet;
  product: { name: string; pricePerDay: number; imageUrl: string | null };
}

interface BorrowRequest {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  location: string | null;
  neededFrom: string;
  neededUntil: string;
  budgetPerDay: number | null;
  status: string;
  requester: UserSnippet;
  _count: { offers: number };
}

interface FullRequest extends BorrowRequest {
  offers: Offer[];
}

interface LentItem {
  id: string;
  product: { id: string; name: string; pricePerDay: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function dn(u: UserSnippet) {
  if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
  return u.name ?? u.userName ?? "Unknown";
}

function fd(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const OFFER_BADGE: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-50 text-red-400",
};

const CAT_NAMES = ["All", ...CATEGORIES.map((c) => c.name)];

// ── ItemCard (unchanged) ───────────────────────────────────────────────────────

function ItemCard({ item }: { item: BrowseItem }) {
  return (
    <Link href={`/dashboard/items/${item.id}`}>
      <div className="group rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface)] transition-all duration-300 hover:shadow-lg hover:border-[var(--primary)]/50">
        <div className="relative overflow-hidden h-48 bg-[var(--surface-soft)]">
          <FallbackImage
            src={item.imageUrl ?? ""}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="p-4 space-y-3">
          <div>
            {item.category && (
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">{item.category}</p>
            )}
            <h3 className="text-sm font-bold text-[var(--foreground)] mt-1 line-clamp-2">{item.title}</h3>
            {item.description && (
              <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{item.description}</p>
            )}
          </div>
          {item.location && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <MapPin className="h-4 w-4" />{item.location}
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Price/Day</p>
              <p className="text-lg font-bold text-[var(--primary)]">
                {item.pricePerDay != null ? `TK ${item.pricePerDay}` : "—"}
              </p>
            </div>
            {item.deposit != null && (
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)]">Deposit</p>
                <p className="text-sm font-semibold text-[var(--foreground)]">TK {item.deposit}</p>
              </div>
            )}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            by <span className="font-medium text-[var(--foreground)]">{item.lenderName}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── BorrowRequestCard with inline expansion ────────────────────────────────────

function RequestCard({
  req,
  userId,
}: {
  req: BorrowRequest;
  userId: string | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<FullRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Offer form state
  const [offerOpen, setOfferOpen] = useState(false);
  const [lentItems, setLentItems] = useState<LentItem[]>([]);
  const [lentLoading, setLentLoading] = useState(false);
  const [selectedLentId, setSelectedLentId] = useState("");
  const [offerMsg, setOfferMsg] = useState("");
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerError, setOfferError] = useState("");
  const [offerDone, setOfferDone] = useState(false);

  // "List a new item" sub-form state
  const [listNewMode, setListNewMode] = useState(false);
  const [newItemForm, setNewItemForm] = useState({ name: "", subcategory: "", pricePerDay: "", description: "", location: "", imageUrl: "" });
  const [newItemSubmitting, setNewItemSubmitting] = useState(false);
  const [newItemError, setNewItemError] = useState("");

  const toggle = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (!detail) {
      setDetailLoading(true);
      try {
        const r = await fetch(`/api/borrow-requests/${req.id}`);
        if (r.ok) setDetail(await r.json() as FullRequest);
      } finally { setDetailLoading(false); }
    }
  };

  const openOffer = async () => {
    setSelectedLentId(""); setOfferMsg(""); setOfferError("");
    setListNewMode(false); setNewItemForm({ name: "", subcategory: "", pricePerDay: "", description: "", location: "", imageUrl: "" }); setNewItemError("");
    setOfferOpen(true);
    if (lentItems.length === 0) {
      setLentLoading(true);
      try {
        const r = await fetch("/api/lent-items");
        if (r.ok) setLentItems(await r.json() as LentItem[]);
      } finally { setLentLoading(false); }
    }
  };

  const submitNewItem = async () => {
    if (newItemSubmitting) return;
    if (!newItemForm.name.trim()) { setNewItemError("Item name is required"); return; }
    if (!newItemForm.pricePerDay || Number(newItemForm.pricePerDay) <= 0) { setNewItemError("Price per day is required"); return; }
    setNewItemSubmitting(true); setNewItemError("");
    try {
      const category = newItemForm.subcategory ? getCategoryForSub(newItemForm.subcategory) || newItemForm.subcategory : undefined;
      const res = await fetch("/api/lent-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItemForm.name.trim(),
          category,
          subcategory: newItemForm.subcategory || undefined,
          pricePerDay: Number(newItemForm.pricePerDay),
          description: newItemForm.description.trim() || undefined,
          location: newItemForm.location.trim() || undefined,
          imageUrl: newItemForm.imageUrl.trim() || undefined,
        }),
      });
      if (res.ok) {
        const created = await res.json() as LentItem;
        setLentItems((prev) => [created, ...prev]);
        setSelectedLentId(created.id);
        setListNewMode(false);
      } else {
        const d = await res.json() as { error?: string };
        setNewItemError(d.error ?? "Failed to create item");
      }
    } finally { setNewItemSubmitting(false); }
  };

  const submitOffer = async () => {
    if (offerSubmitting) return;
    if (!selectedLentId) { setOfferError("Please select an item"); return; }
    const item = lentItems.find((l) => l.id === selectedLentId);
    if (!item) return;
    setOfferSubmitting(true); setOfferError("");
    try {
      const res = await fetch(`/api/borrow-requests/${req.id}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.product.id, message: offerMsg.trim() || undefined }),
      });
      if (res.ok) {
        // Also send the message text as an actual chat message to the requester
        if (offerMsg.trim()) {
          await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipientId: req.requester.id, message: offerMsg.trim() }),
          });
        }
        setOfferOpen(false); setOfferDone(true);
        const r = await fetch(`/api/borrow-requests/${req.id}`);
        if (r.ok) setDetail(await r.json() as FullRequest);
      } else {
        const d = await res.json() as { error?: string };
        setOfferError(d.error ?? "Failed to submit offer");
      }
    } finally { setOfferSubmitting(false); }
  };

  const isRequester = req.requester.id === userId;
  const myOffer = detail?.offers.find((o) => o.lender.id === userId);
  const canOffer = !isRequester && req.status === "open" && !myOffer && !offerDone;

  return (
    <div className={`rounded-2xl border bg-[var(--surface)] transition-all ${expanded ? "border-[var(--primary)]/40 shadow-md" : "border-[var(--border)] shadow-sm"}`}>
      {/* Card header — always visible */}
      <button onClick={toggle} className="flex w-full items-start gap-4 p-5 text-left">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-[var(--foreground)]">{req.title}</p>
            {req.category && (
              <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[var(--primary)]">
                {req.category}
              </span>
            )}
          </div>
          {req.description && (
            <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{req.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
            {req.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.location}</span>}
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fd(req.neededFrom)} – {fd(req.neededUntil)}</span>
            {req.budgetPerDay != null && <span className="flex items-center gap-1"><Coins className="h-3 w-3" />Up to TK {req.budgetPerDay.toLocaleString()} / day</span>}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">by <span className="font-medium text-[var(--foreground)]">{dn(req.requester)}</span></span>
            <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${req._count.offers > 0 ? "bg-emerald-100 text-emerald-700" : "bg-[var(--surface-soft)] text-[var(--text-muted)]"}`}>
              {req._count.offers} {req._count.offers === 1 ? "offer" : "offers"}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 mt-1 text-[var(--text-muted)]">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
          {detailLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--surface-soft)]" />)}
            </div>
          ) : (
            <>
              {/* Offer action */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                {canOffer && (
                  <button onClick={openOffer}
                    className="rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] px-5 py-2 text-sm font-bold text-white shadow-[0_4px_12px_rgba(59,42,128,0.25)] hover:opacity-90">
                    Submit an Offer
                  </button>
                )}
                {(myOffer || offerDone) && (
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${myOffer ? (OFFER_BADGE[myOffer.status] ?? "bg-gray-100 text-gray-600") : "bg-emerald-100 text-emerald-700"}`}>
                    {myOffer ? `Your offer: ${myOffer.status}` : "Offer submitted ✓"}
                  </span>
                )}
                {isRequester && <span className="text-xs text-[var(--text-muted)]">This is your request</span>}
              </div>

              {/* Offers list */}
              {detail && detail.offers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[0.72rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Offers ({detail.offers.length})</p>
                  {detail.offers.map((offer) => (
                    <div key={offer.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 ${offer.status === "accepted" ? "border-emerald-200 bg-emerald-50/50" : offer.status === "rejected" ? "border-red-100 opacity-60" : "border-[var(--border)] bg-[var(--surface-soft)]"}`}>
                      <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--surface-soft)]">
                        <FallbackImage src={offer.product.imageUrl} alt={offer.product.name} fill sizes="36px" className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--foreground)]">{offer.product.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{dn(offer.lender)} · TK {offer.product.pricePerDay.toLocaleString()}/day</p>
                        {offer.message && <p className="text-xs italic text-[var(--text-muted)]">"{offer.message}"</p>}
                      </div>
                      <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold capitalize ${OFFER_BADGE[offer.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {offer.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {detail && detail.offers.length === 0 && (
                <p className="text-center text-sm text-[var(--text-muted)]">No offers yet{canOffer ? " — be the first!" : ""}</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Submit offer inline form */}
      {offerOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--surface-soft)] px-5 pb-5 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-[var(--foreground)]">Submit Your Offer</p>
            <button
              onClick={() => { setListNewMode((v) => !v); setNewItemError(""); }}
              className="flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
            >
              <Plus className="h-3 w-3" />
              {listNewMode ? "Pick existing" : "List a new item"}
            </button>
          </div>

          <div className="space-y-3">
            {listNewMode ? (
              /* ── New item sub-form ── */
              <div className="space-y-2.5 rounded-xl border border-[var(--border)] bg-white p-3">
                <input
                  type="text"
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Item name *"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
                />
                <CategoryPicker
                  mode="single"
                  value={newItemForm.subcategory ? [newItemForm.subcategory] : []}
                  onChange={([v]) => setNewItemForm((f) => ({ ...f, subcategory: v ?? "" }))}
                  placeholder="Category (optional)"
                />
                <input
                  type="number"
                  min="1"
                  value={newItemForm.pricePerDay}
                  onChange={(e) => setNewItemForm((f) => ({ ...f, pricePerDay: e.target.value }))}
                  placeholder="Price per day (TK) *"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
                />
                <input
                  type="text"
                  value={newItemForm.location}
                  onChange={(e) => setNewItemForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Location (optional)"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
                />
                <textarea
                  value={newItemForm.description}
                  onChange={(e) => setNewItemForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
                />
                <input
                  type="url"
                  value={newItemForm.imageUrl}
                  onChange={(e) => setNewItemForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="Image URL (optional)"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
                />
                {newItemError && <p className="text-xs font-semibold text-red-600">{newItemError}</p>}
                <button
                  onClick={submitNewItem}
                  disabled={newItemSubmitting}
                  className="w-full rounded-lg bg-[var(--primary)] py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {newItemSubmitting ? "Creating…" : "Create & Select This Item"}
                </button>
              </div>
            ) : lentLoading ? (
              <div className="h-10 animate-pulse rounded-xl bg-[var(--surface-soft)]" />
            ) : (
              <select value={selectedLentId} onChange={(e) => setSelectedLentId(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]">
                <option value="">{lentItems.length === 0 ? "No items yet — click 'List a new item' above" : "Choose one of your items…"}</option>
                {lentItems.map((l) => (
                  <option key={l.id} value={l.id}>{l.product.name} — TK {l.product.pricePerDay.toLocaleString()}/day</option>
                ))}
              </select>
            )}

            {!listNewMode && (
              <>
                <textarea value={offerMsg} onChange={(e) => setOfferMsg(e.target.value)}
                  placeholder="Message to the requester — will also be sent as a chat message"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]" />
                {offerError && <p className="text-sm font-semibold text-red-600">{offerError}</p>}
                <div className="flex gap-2.5">
                  <button onClick={() => setOfferOpen(false)}
                    className="flex-1 rounded-full border border-[var(--border)] py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--foreground)]">
                    Cancel
                  </button>
                  <button onClick={submitOffer} disabled={offerSubmitting || !selectedLentId}
                    className="flex-1 rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] py-2 text-sm font-bold text-white disabled:opacity-50">
                    {offerSubmitting ? "Submitting…" : "Submit Offer"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

type PageTab = "items" | "requests";

export default function BrowseItemsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [tab, setTab] = useState<PageTab>("items");

  // Items tab
  const [items, setItems] = useState<BrowseItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);

  // Requests tab
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqFetched, setReqFetched] = useState(false);
  const [catFilter, setCatFilter] = useState("All");

  // Fetch items on mount
  useEffect(() => {
    fetch("/api/browse")
      .then((r) => { if (!r.ok) throw new Error("Failed to fetch"); return r.json(); })
      .then((data: BrowseItem[]) => setItems(Array.isArray(data) ? data : []))
      .catch((err: Error) => setItemsError(err.message))
      .finally(() => setItemsLoading(false));
  }, []);

  // Fetch requests lazily when tab is first opened
  const fetchRequests = useCallback(async () => {
    setReqLoading(true);
    try {
      const r = await fetch("/api/borrow-requests");
      if (r.ok) setRequests(await r.json() as BorrowRequest[]);
    } finally { setReqLoading(false); setReqFetched(true); }
  }, []);

  useEffect(() => {
    if (tab === "requests" && !reqFetched) void fetchRequests();
  }, [tab, reqFetched, fetchRequests]);

  const filteredReqs = catFilter === "All"
    ? requests
    : requests.filter((r) => getCategoryForSub(r.category ?? "") === catFilter || r.category === catFilter);

  const tabs = [
    { id: "items" as PageTab,    label: "Browse Items",     count: 0 },
    { id: "requests" as PageTab, label: "Borrow Requests",  count: requests.filter((r) => r.status === "open").length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Browse</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {tab === "items" ? "Discover items available for lending in your community" : "See what others are looking to borrow — offer your item if you have it"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-[var(--surface-soft)] p-1 border border-[var(--border)]">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-white shadow text-[var(--primary)] border border-[var(--border)]"
                : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-black ${tab === t.id ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-[var(--border)] text-[var(--text-secondary)]"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Browse Items ── */}
      {tab === "items" && (
        <>
          {itemsLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <div key={i} className="rounded-lg bg-[var(--surface)] animate-pulse h-72" />)}
            </div>
          )}
          {!itemsLoading && itemsError && <p className="text-center py-12 text-red-500">{itemsError}</p>}
          {!itemsLoading && !itemsError && items.length === 0 && (
            <p className="text-center py-12 text-[var(--text-secondary)]">No items available right now.</p>
          )}
          {!itemsLoading && !itemsError && items.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => <ItemCard key={item.id} item={item} />)}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Borrow Requests ── */}
      {tab === "requests" && (
        <>
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {CAT_NAMES.slice(0, 9).map((cat) => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                  catFilter === cat
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--primary)]/40"
                }`}>
                {cat}
              </button>
            ))}
          </div>

          {reqLoading ? (
            <div className="grid gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--surface-soft)]" />)}
            </div>
          ) : filteredReqs.length === 0 ? (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-8 py-16 text-center">
              <Inbox className="mx-auto mb-3 h-10 w-10 text-[var(--primary)]" strokeWidth={1.5} />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">No open requests</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Check the Borrowed Items page to post your own request.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredReqs.map((req) => (
                <RequestCard key={req.id} req={req} userId={userId} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
