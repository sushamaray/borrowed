"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowLeft, Calendar, Check, ChevronDown, ChevronRight,
  Coins, Inbox, MapPin, Package, Plus, X,
} from "lucide-react";
import FallbackImage from "@/components/FallbackImage";
import CategoryPicker from "@/components/dashboard/CategoryPicker";
import { CATEGORIES, getCategoryForSub } from "@/lib/categories";

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserSnippet {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
}

interface BrowseRequest {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  location: string | null;
  neededFrom: string;
  neededUntil: string;
  budgetPerDay: number | null;
  status: string;
  createdAt: string;
  requester: UserSnippet;
  _count: { offers: number };
}

interface Offer {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  lender: UserSnippet;
  product: {
    id: string;
    name: string;
    category: string;
    pricePerDay: number;
    deposit: number | null;
    imageUrl: string | null;
    location: string;
  };
}

interface FullRequest extends BrowseRequest {
  offers: Offer[];
}

interface LentItem {
  id: string;
  product: { id: string; name: string; pricePerDay: number; imageUrl: string | null };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function dn(u: UserSnippet): string {
  if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
  return u.name ?? u.userName ?? "Unknown";
}

function fd(d: string, short = false) {
  return new Date(d).toLocaleDateString("en-GB", short
    ? { day: "numeric", month: "short" }
    : { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_BADGE: Record<string, string> = {
  open:      "bg-emerald-100 text-emerald-700",
  fulfilled: "bg-blue-100 text-blue-700",
  closed:    "bg-[var(--surface-soft)] text-[var(--text-muted)]",
};

const OFFER_BADGE: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-50 text-red-400",
};

const CATEGORY_NAMES = ["All", ...CATEGORIES.map((c) => c.name)];

// ── Post-request form (shared) ─────────────────────────────────────────────────

function PostForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (submitting) return;
    if (!title.trim()) { setError("Title is required"); return; }
    if (!from || !until) { setError("Dates are required"); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/borrow-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category: category || undefined,
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          neededFrom: from,
          neededUntil: until,
          budgetPerDay: budget ? Number(budget) : undefined,
        }),
      });
      if (res.ok) { onSuccess(); }
      else {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "Failed to post");
      }
    } finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
          What do you need? <span className="text-red-400">*</span>
        </label>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. DSLR camera for a weekend trip"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]" />
      </div>
      <div>
        <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Category</label>
        <CategoryPicker mode="single" value={category ? [category] : []} onChange={([v]) => setCategory(v ?? "")} placeholder="Select a category…" />
      </div>
      <div>
        <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Specific requirements, brand preferences, condition notes…"
          rows={3}
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]" />
      </div>
      <div>
        <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Location</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Dhaka, Sylhet…"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Need From <span className="text-red-400">*</span></label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Need Until <span className="text-red-400">*</span></label>
          <input type="date" value={until} onChange={(e) => setUntil(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)]" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Budget (TK / day)</label>
        <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
          placeholder="Optional max budget" min={0}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]" />
      </div>
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[0.82rem] font-semibold text-red-600">{error}</p>}
      <div className="flex gap-2.5">
        <button onClick={onCancel}
          className="flex-1 rounded-full border border-[var(--border)] py-3 text-[0.88rem] font-bold text-[var(--text-muted)] hover:text-[var(--ink)]">
          Cancel
        </button>
        <button onClick={submit} disabled={submitting || !title.trim() || !from || !until}
          className="flex-1 rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] py-3 text-[0.88rem] font-black text-white disabled:opacity-50">
          {submitting ? "Posting…" : "Post Request"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type MyTab = "open" | "fulfilled" | "closed";

export default function BorrowRequestsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Browse panel
  const [browseList, setBrowseList] = useState<BrowseRequest[]>([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FullRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Offer submit (modal)
  const [offerOpen, setOfferOpen] = useState(false);
  const [lentItems, setLentItems] = useState<LentItem[]>([]);
  const [lentLoading, setLentLoading] = useState(false);
  const [selectedLentId, setSelectedLentId] = useState("");
  const [offerMsg, setOfferMsg] = useState("");
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerError, setOfferError] = useState("");

  // My-requests panel
  const [myList, setMyList] = useState<BrowseRequest[]>([]);
  const [myLoading, setMyLoading] = useState(true);
  const [myTab, setMyTab] = useState<MyTab>("open");
  const [expandedMyId, setExpandedMyId] = useState<string | null>(null);
  const [myDetail, setMyDetail] = useState<FullRequest | null>(null);
  const [myDetailLoading, setMyDetailLoading] = useState(false);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [closePending, setClosePending] = useState(false);

  // Post-request modal
  const [showPost, setShowPost] = useState(false);

  // ── Fetchers ──

  const fetchBrowse = useCallback(async () => {
    setBrowseLoading(true);
    try {
      const res = await fetch("/api/borrow-requests");
      if (res.ok) setBrowseList(await res.json() as BrowseRequest[]);
    } finally { setBrowseLoading(false); }
  }, []);

  const fetchMine = useCallback(async () => {
    setMyLoading(true);
    try {
      const res = await fetch("/api/borrow-requests?mine=true");
      if (res.ok) setMyList(await res.json() as BrowseRequest[]);
    } finally { setMyLoading(false); }
  }, []);

  useEffect(() => { void fetchBrowse(); void fetchMine(); }, [fetchBrowse, fetchMine]);

  // Load detail when a browse card is selected
  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    setDetailLoading(true);
    fetch(`/api/borrow-requests/${selectedId}`)
      .then((r) => r.ok ? r.json() as Promise<FullRequest> : null)
      .then((d) => setDetail(d))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  // Load detail when a my-request row is expanded
  useEffect(() => {
    if (!expandedMyId) { setMyDetail(null); return; }
    setMyDetailLoading(true);
    fetch(`/api/borrow-requests/${expandedMyId}`)
      .then((r) => r.ok ? r.json() as Promise<FullRequest> : null)
      .then((d) => setMyDetail(d))
      .finally(() => setMyDetailLoading(false));
  }, [expandedMyId]);

  // ── Offer submit ──

  const openOfferModal = async () => {
    setSelectedLentId(""); setOfferMsg(""); setOfferError("");
    setOfferOpen(true);
    if (lentItems.length === 0) {
      setLentLoading(true);
      try {
        const r = await fetch("/api/lent-items");
        if (r.ok) setLentItems(await r.json() as LentItem[]);
      } finally { setLentLoading(false); }
    }
  };

  const submitOffer = async () => {
    if (offerSubmitting || !selectedId) return;
    if (!selectedLentId) { setOfferError("Please select an item"); return; }
    const item = lentItems.find((l) => l.id === selectedLentId);
    if (!item) return;
    setOfferSubmitting(true); setOfferError("");
    try {
      const res = await fetch(`/api/borrow-requests/${selectedId}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.product.id, message: offerMsg.trim() || undefined }),
      });
      if (res.ok) {
        setOfferOpen(false);
        // Refresh detail
        const r = await fetch(`/api/borrow-requests/${selectedId}`);
        if (r.ok) setDetail(await r.json() as FullRequest);
        void fetchBrowse();
      } else {
        const d = await res.json() as { error?: string };
        setOfferError(d.error ?? "Failed to submit offer");
      }
    } finally { setOfferSubmitting(false); }
  };

  // ── My-request actions ──

  const acceptOffer = async (requestId: string, offerId: string) => {
    setActionPending(offerId);
    try {
      const res = await fetch(`/api/borrow-requests/${requestId}/offers/${offerId}/accept`, { method: "PATCH" });
      if (res.ok) {
        const r = await fetch(`/api/borrow-requests/${requestId}`);
        if (r.ok) setMyDetail(await r.json() as FullRequest);
        void fetchMine();
      }
    } finally { setActionPending(null); }
  };

  const rejectOffer = async (requestId: string, offerId: string) => {
    setActionPending(offerId);
    try {
      const res = await fetch(`/api/borrow-requests/${requestId}/offers/${offerId}/reject`, { method: "PATCH" });
      if (res.ok) {
        const r = await fetch(`/api/borrow-requests/${requestId}`);
        if (r.ok) setMyDetail(await r.json() as FullRequest);
      }
    } finally { setActionPending(null); }
  };

  const closeRequest = async (requestId: string) => {
    setClosePending(true);
    try {
      const res = await fetch(`/api/borrow-requests/${requestId}/close`, { method: "PATCH" });
      if (res.ok) { setExpandedMyId(null); void fetchMine(); }
    } finally { setClosePending(false); }
  };

  // ── Derived ──

  const filteredBrowse = filter === "All"
    ? browseList
    : browseList.filter((r) => getCategoryForSub(r.category ?? "") === filter || r.category === filter);

  const myFiltered = myList.filter((r) => r.status === myTab);

  // ── Render helpers ──

  function BrowseCard({ req }: { req: BrowseRequest }) {
    return (
      <button
        onClick={() => setSelectedId(req.id)}
        className={`group w-full text-left rounded-[16px] border bg-white p-4 shadow-[0_2px_10px_rgba(12,32,30,0.05)] transition-all hover:border-[#6d5bba]/50 hover:shadow-[0_6px_20px_rgba(59,42,128,0.1)] ${
          selectedId === req.id ? "border-[#6d5bba] shadow-[0_6px_20px_rgba(59,42,128,0.14)]" : "border-[var(--border)]"
        }`}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <p className="font-black text-[0.9rem] leading-snug text-[var(--ink)] group-hover:text-[#3b2a80]">{req.title}</p>
          {req.category && (
            <span className="flex-shrink-0 rounded-full bg-[#f2eefb] px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-[#6d5bba]">
              {req.category}
            </span>
          )}
        </div>
        {req.description && (
          <p className="mb-2 line-clamp-2 text-[0.78rem] leading-relaxed text-[var(--text-secondary)]">{req.description}</p>
        )}
        <div className="space-y-1 text-[0.72rem] text-[var(--text-muted)]">
          {req.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3 flex-shrink-0" />{req.location}</span>}
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3 flex-shrink-0" />{fd(req.neededFrom, true)} – {fd(req.neededUntil, true)}</span>
          {req.budgetPerDay != null && <span className="flex items-center gap-1"><Coins className="h-3 w-3 flex-shrink-0" />Up to TK {req.budgetPerDay.toLocaleString()} / day</span>}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5">
          <span className="text-[0.7rem] text-[var(--text-muted)]">by <span className="font-semibold text-[var(--ink)]">{dn(req.requester)}</span></span>
          <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${req._count.offers > 0 ? "bg-emerald-100 text-emerald-700" : "bg-[var(--surface-soft)] text-[var(--text-muted)]"}`}>
            {req._count.offers} {req._count.offers === 1 ? "offer" : "offers"}
          </span>
        </div>
      </button>
    );
  }

  // ── Detail view (left panel) ──

  function DetailPanel() {
    if (detailLoading || !detail) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-[14px] bg-[var(--surface-soft)]" />)}
        </div>
      );
    }

    const isRequester = detail.requester.id === userId;
    const myOffer = !isRequester ? detail.offers.find((o) => o.lender.id === userId) : undefined;
    const canOffer = !isRequester && detail.status === "open" && !myOffer;

    return (
      <div>
        <button onClick={() => setSelectedId(null)}
          className="mb-4 flex items-center gap-1.5 text-[0.8rem] font-semibold text-[var(--text-muted)] hover:text-[var(--ink)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to requests
        </button>

        {/* Request info */}
        <div className="mb-4 rounded-[18px] border border-[var(--border)] bg-white p-5 shadow-[0_4px_16px_rgba(12,32,30,0.06)]">
          <div className="mb-3 flex flex-wrap items-start gap-2">
            <h2 className="flex-1 text-[1.1rem] font-black text-[var(--ink)]">{detail.title}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold capitalize ${STATUS_BADGE[detail.status] ?? "bg-gray-100 text-gray-600"}`}>{detail.status}</span>
          </div>
          {detail.category && (
            <span className="mb-2 inline-block rounded-full bg-[#f2eefb] px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#6d5bba]">{detail.category}</span>
          )}
          {detail.description && <p className="mb-3 text-[0.85rem] leading-relaxed text-[var(--text-secondary)]">{detail.description}</p>}
          <div className="flex flex-wrap gap-3 text-[0.78rem] text-[var(--text-muted)]">
            {detail.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{detail.location}</span>}
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{fd(detail.neededFrom)} – {fd(detail.neededUntil)}</span>
            {detail.budgetPerDay != null && <span className="flex items-center gap-1.5"><Coins className="h-3.5 w-3.5" />Up to TK {detail.budgetPerDay.toLocaleString()} / day</span>}
          </div>
          <p className="mt-3 text-[0.75rem] text-[var(--text-muted)]">Posted by <span className="font-semibold text-[var(--ink)]">{dn(detail.requester)}</span></p>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2.5">
            {canOffer && (
              <button onClick={openOfferModal}
                className="rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] px-5 py-2 text-[0.82rem] font-black text-white shadow-[0_4px_12px_rgba(59,42,128,0.28)] hover:opacity-90">
                Submit an Offer
              </button>
            )}
            {myOffer && (
              <span className={`flex items-center rounded-full px-3.5 py-1.5 text-[0.78rem] font-bold ${OFFER_BADGE[myOffer.status] ?? "bg-gray-100 text-gray-600"}`}>
                Your offer: {myOffer.status}
              </span>
            )}
          </div>
        </div>

        {/* Offers */}
        <p className="mb-2.5 text-[0.72rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
          Offers ({detail.offers.length})
        </p>
        {detail.offers.length === 0 ? (
          <div className="rounded-[14px] border border-[var(--border)] bg-white px-5 py-6 text-center text-[0.82rem] text-[var(--text-muted)]">
            No offers yet{canOffer ? " — be the first!" : ""}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {detail.offers.map((offer) => (
              <div key={offer.id}
                className={`flex items-center gap-3 rounded-[14px] border bg-white px-4 py-3 ${
                  offer.status === "accepted" ? "border-[#bbf7d0]" :
                  offer.status === "rejected" ? "border-[#fecaca] opacity-55" : "border-[var(--border)]"
                }`}
              >
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--surface-soft)]">
                  <FallbackImage src={offer.product.imageUrl} alt={offer.product.name} fill sizes="40px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[0.85rem] font-bold text-[var(--ink)]">{offer.product.name}</p>
                  <p className="text-[0.72rem] text-[var(--text-muted)]">
                    {dn(offer.lender)} · TK {offer.product.pricePerDay.toLocaleString()}/day
                  </p>
                  {offer.message && <p className="text-[0.72rem] italic text-[var(--text-muted)]">"{offer.message}"</p>}
                </div>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold capitalize ${OFFER_BADGE[offer.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {offer.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── My-requests expanded detail ──

  function MyRequestOffers({ requestId }: { requestId: string }) {
    if (myDetailLoading || !myDetail || myDetail.id !== requestId) {
      return <div className="mt-3 h-16 animate-pulse rounded-[12px] bg-[var(--surface-soft)]" />;
    }

    return (
      <div className="mt-3 space-y-2.5">
        {myDetail.status === "open" && (
          <button onClick={() => closeRequest(requestId)} disabled={closePending}
            className="mb-1 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-[0.75rem] font-bold text-red-500 hover:bg-red-100 disabled:opacity-50">
            {closePending ? "Closing…" : "Close Request"}
          </button>
        )}
        {myDetail.offers.length === 0 ? (
          <p className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 text-center text-[0.8rem] text-[var(--text-muted)]">
            No offers yet
          </p>
        ) : (
          myDetail.offers.map((offer) => (
            <div key={offer.id}
              className={`flex items-center gap-3 rounded-[14px] border bg-white px-4 py-3 shadow-[0_2px_8px_rgba(12,32,30,0.04)] ${
                offer.status === "accepted" ? "border-[#bbf7d0]" :
                offer.status === "rejected" ? "border-[#fecaca] opacity-55" : "border-[var(--border)]"
              }`}
            >
              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--surface-soft)]">
                <FallbackImage src={offer.product.imageUrl} alt={offer.product.name} fill sizes="40px" className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-[0.85rem] font-bold text-[var(--ink)]">{offer.product.name}</p>
                <p className="text-[0.72rem] text-[var(--text-muted)]">
                  by {dn(offer.lender)} · TK {offer.product.pricePerDay.toLocaleString()}/day
                </p>
                {offer.message && <p className="text-[0.7rem] italic text-[var(--text-muted)]">"{offer.message}"</p>}
              </div>
              <div className="flex flex-shrink-0 items-center gap-1.5">
                {myDetail.status === "open" && offer.status === "pending" ? (
                  <>
                    <button onClick={() => acceptOffer(requestId, offer.id)} disabled={actionPending === offer.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50" title="Accept">
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                    <button onClick={() => rejectOffer(requestId, offer.id)} disabled={actionPending === offer.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 disabled:opacity-50" title="Reject">
                      <X className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  </>
                ) : (
                  <span className={`rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold capitalize ${OFFER_BADGE[offer.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {offer.status}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // ── Page layout ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-5">

      {/* ── Left panel: Browse ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)]">
        {/* Panel header */}
        <div className="flex-shrink-0 border-b border-[var(--border)] px-5 py-4">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.1em] text-[var(--text-muted)]">Discover</p>
          <h2 className="text-[1.1rem] font-black text-[var(--ink)]">Open Requests</h2>
        </div>

        {/* Category filter — only when browsing list */}
        {!selectedId && (
          <div className="flex-shrink-0 border-b border-[var(--border)] px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_NAMES.slice(0, 8).map((cat) => (
                <button key={cat} onClick={() => setFilter(cat)}
                  className={`rounded-full border px-2.5 py-1 text-[0.7rem] font-bold transition-all ${
                    filter === cat
                      ? "border-[#3b2a80] bg-[#f2eefb] text-[#3b2a80]"
                      : "border-[var(--border)] bg-white text-[var(--text-muted)] hover:border-[#3b2a80]/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-none p-4">
          {selectedId ? (
            <DetailPanel />
          ) : browseLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-36 animate-pulse rounded-[16px] bg-white" />)}
            </div>
          ) : filteredBrowse.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[var(--text-muted)]">
                <Inbox className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <p className="font-black text-[var(--ink)]">No open requests</p>
              <p className="mt-1 text-[0.8rem] text-[var(--text-muted)]">Post your own request on the right →</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBrowse.map((req) => <BrowseCard key={req.id} req={req} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: My Requests ───────────────────────────────────────── */}
      <div className="flex w-[380px] flex-shrink-0 flex-col rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)]">
        {/* Panel header */}
        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.1em] text-[var(--text-muted)]">Your requests</p>
            <h2 className="text-[1.1rem] font-black text-[var(--ink)]">My Requests</h2>
          </div>
          <button onClick={() => setShowPost(true)}
            className="flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] px-4 py-2 text-[0.8rem] font-black text-white shadow-[0_4px_12px_rgba(59,42,128,0.3)] hover:opacity-90">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> New
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-shrink-0 gap-0.5 border-b border-[var(--border)] bg-white px-3 py-2">
          {(["open", "fulfilled", "closed"] as MyTab[]).map((t) => {
            const count = myList.filter((r) => r.status === t).length;
            return (
              <button key={t} onClick={() => setMyTab(t)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.75rem] font-bold capitalize transition-all ${
                  myTab === t ? "bg-[#f2eefb] text-[#3b2a80]" : "text-[var(--text-muted)] hover:text-[var(--ink)]"
                }`}
              >
                {t}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[0.6rem] font-black ${myTab === t ? "bg-[#3b2a80] text-white" : "bg-[var(--surface-soft)] text-[var(--text-muted)]"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto scrollbar-none p-4">
          {myLoading ? (
            <div className="space-y-2.5">
              {[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-[14px] bg-white" />)}
            </div>
          ) : myFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="mb-3 h-8 w-8 text-[var(--text-muted)]" strokeWidth={1.5} />
              {myTab === "open" ? (
                <>
                  <p className="text-[0.85rem] font-black text-[var(--ink)]">No open requests</p>
                  <button onClick={() => setShowPost(true)}
                    className="mt-3 rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] px-5 py-2 text-[0.8rem] font-black text-white">
                    Post a Request
                  </button>
                </>
              ) : (
                <p className="text-[0.82rem] text-[var(--text-muted)]">No {myTab} requests</p>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {myFiltered.map((req) => {
                const isExpanded = expandedMyId === req.id;
                return (
                  <div key={req.id}
                    className={`rounded-[16px] border bg-white shadow-[0_2px_8px_rgba(12,32,30,0.04)] ${isExpanded ? "border-[#6d5bba]/50" : "border-[var(--border)]"}`}
                  >
                    <button
                      onClick={() => {
                        setExpandedMyId(isExpanded ? null : req.id);
                        setMyDetail(null);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-[0.88rem] font-black text-[var(--ink)]">{req.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-bold capitalize ${STATUS_BADGE[req.status] ?? "bg-gray-100 text-gray-600"}`}>
                            {req.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[0.7rem] text-[var(--text-muted)]">
                          {fd(req.neededFrom, true)} – {fd(req.neededUntil, true)}
                          {req._count.offers > 0 && (
                            <span className="ml-2 font-bold text-emerald-600">{req._count.offers} {req._count.offers === 1 ? "offer" : "offers"}</span>
                          )}
                        </p>
                      </div>
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-[var(--text-muted)]" />
                        : <ChevronRight className="h-4 w-4 flex-shrink-0 text-[var(--text-muted)]" />
                      }
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[var(--border)] px-4 pb-4 pt-3">
                        <MyRequestOffers requestId={req.id} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Post Request Modal ─────────────────────────────────────────────── */}
      {showPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(27,21,48,0.75)] backdrop-blur-[4px]"
          onClick={(e) => e.target === e.currentTarget && setShowPost(false)}>
          <div className="relative max-h-[92vh] w-[500px] overflow-y-auto scrollbar-none rounded-3xl bg-white p-8 shadow-2xl">
            <button onClick={() => setShowPost(false)}
              className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--text-muted)]">
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f2eefb,#daeaeb)]">
                <Inbox className="h-7 w-7 text-[var(--primary)]" strokeWidth={1.8} />
              </div>
              <h2 className="text-[1.1rem] font-black text-[var(--ink)]">Post a Borrow Request</h2>
              <p className="mt-1 text-[0.82rem] text-[var(--text-muted)]">Describe what you need — lenders will offer their item.</p>
            </div>
            <PostForm
              onSuccess={() => { setShowPost(false); void fetchMine(); void fetchBrowse(); }}
              onCancel={() => setShowPost(false)}
            />
          </div>
        </div>
      )}

      {/* ── Submit Offer Modal ─────────────────────────────────────────────── */}
      {offerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(27,21,48,0.75)] backdrop-blur-[4px]"
          onClick={(e) => e.target === e.currentTarget && setOfferOpen(false)}>
          <div className="relative w-[460px] rounded-3xl bg-white p-8 shadow-2xl">
            <button onClick={() => setOfferOpen(false)}
              className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--text-muted)]">
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f2eefb,#daeaeb)]">
                <Package className="h-7 w-7 text-[var(--primary)]" strokeWidth={1.8} />
              </div>
              <h2 className="text-[1.05rem] font-black text-[var(--ink)]">Submit an Offer</h2>
              <p className="mt-1 text-[0.82rem] text-[var(--text-muted)]">Pick one of your listed items to offer.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Your Item <span className="text-red-400">*</span>
                </label>
                {lentLoading ? (
                  <div className="h-11 animate-pulse rounded-xl bg-[var(--surface-soft)]" />
                ) : lentItems.length === 0 ? (
                  <p className="rounded-xl bg-amber-50 px-4 py-3 text-[0.82rem] text-amber-700">
                    You have no listed items. Go to <strong>Lent Items</strong> to add one first.
                  </p>
                ) : (
                  <div className="relative">
                    <select value={selectedLentId} onChange={(e) => setSelectedLentId(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 pr-9 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)]">
                      <option value="">Choose an item…</option>
                      {lentItems.map((l) => (
                        <option key={l.id} value={l.id}>{l.product.name} — TK {l.product.pricePerDay.toLocaleString()}/day</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Message (optional)</label>
                <textarea value={offerMsg} onChange={(e) => setOfferMsg(e.target.value)}
                  placeholder="Condition, availability, pickup details…" rows={3}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]" />
              </div>
              {offerError && <p className="rounded-xl bg-red-50 px-4 py-3 text-[0.82rem] font-semibold text-red-600">{offerError}</p>}
              <button onClick={submitOffer} disabled={offerSubmitting || !selectedLentId || lentItems.length === 0}
                className="w-full rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] py-3.5 text-[0.95rem] font-black text-white disabled:opacity-50">
                {offerSubmitting ? "Submitting…" : "Submit Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
