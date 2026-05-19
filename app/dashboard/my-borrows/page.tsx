"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Coins,
  Inbox,
  MapPin,
  Plus,
  ShieldCheck,
  Sprout,
  X,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import FallbackImage from "@/components/FallbackImage";
import CategoryPicker from "@/components/dashboard/CategoryPicker";
import { getCategoryForSub } from "@/lib/categories";

// ── Existing types ────────────────────────────────────────────────────────────

interface BorrowCheckout {
  id: string;
  status: string;
  createdAt: string;
  returnedAt: string | null;
  endDate: string | null;
  notes: string | null;
  product: {
    id: string;
    name: string;
    category: string;
    imageUrl: string | null;
    location: string;
    pricePerDay: number;
    deposit: number | null;
    description: string | null;
  };
  lender: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    userName: string | null;
  };
}

// ── Types for My Requests tab ─────────────────────────────────────────────────

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
  product: { id: string; slug: string; name: string; pricePerDay: number; imageUrl: string | null };
}

interface BorrowRequestItem {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  location: string | null;
  neededFrom: string;
  neededUntil: string;
  budgetPerDay: number | null;
  status: string;
  _count: { offers: number };
}

interface FullRequest extends BorrowRequestItem {
  offers: Offer[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function lenderDisplayName(lender: BorrowCheckout["lender"]): string {
  if (lender.firstName && lender.lastName) return `${lender.firstName} ${lender.lastName}`;
  return lender.name ?? lender.userName ?? "Unknown";
}

function dn(u: UserSnippet) {
  if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
  return u.name ?? u.userName ?? "Unknown";
}

function fd(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const OFFER_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-50 text-red-400",
};

const CATEGORY_PROMPTS: Record<string, { placeholder: string; tags: string[] }> = {
  "Cameras": { placeholder: "e.g. a wedding shoot in Sylhet, a travel vlog for YouTube…", tags: ["wedding", "travel", "portrait", "event", "outdoor", "work", "film"] },
  "Sports & Outdoors": { placeholder: "e.g. a cycling trip to Bandarban, a beach volleyball tournament…", tags: ["travel", "adventure", "camping", "mountain", "outdoor", "fitness"] },
  "Tech & Electronics": { placeholder: "e.g. a 48-hour hackathon, editing my short film, a design sprint…", tags: ["work", "project", "creative", "film", "design", "education"] },
  "Musical Instruments": { placeholder: "e.g. a live performance at a café, recording a demo track…", tags: ["event", "creative", "art", "work", "film"] },
  "Books & Learning": { placeholder: "e.g. preparing for exams, a personal research project…", tags: ["education", "work", "creative"] },
};

function getPrompt(category: string) {
  return CATEGORY_PROMPTS[category] ?? { placeholder: "What did you use this for?", tags: ["work", "travel", "event", "creative", "outdoor"] };
}

const GRADIENTS = [
  "bg-[linear-gradient(135deg,#0d4a4c,#3b2a80)]",
  "bg-[linear-gradient(135deg,#675d8b,#6d5bba)]",
  "bg-[linear-gradient(135deg,#1e3a5f,#6366f1)]",
  "bg-[linear-gradient(135deg,#064e3b,#10b981)]",
  "bg-[linear-gradient(135deg,#78350f,#f59e0b)]",
  "bg-[linear-gradient(135deg,#7f1d1d,#ef4444)]",
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i <= rating ? "#f59e0b" : "#e2daf5"} className="flex-shrink-0">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// ── MyRequestRow ──────────────────────────────────────────────────────────────

function MyRequestRow({ req, onRefresh }: { req: BorrowRequestItem; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<FullRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [closePending, setClosePending] = useState(false);

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

  const acceptOffer = async (offerId: string) => {
    setActionPending(offerId);
    try {
      const r = await fetch(`/api/borrow-requests/${req.id}/offers/${offerId}/accept`, { method: "PATCH" });
      if (r.ok) {
        toast.success("Offer accepted! Checkout created.");
        onRefresh();
      } else {
        const d = await r.json() as { error?: string };
        toast.error(d.error ?? "Failed to accept offer");
      }
    } finally { setActionPending(null); }
  };

  const rejectOffer = async (offerId: string) => {
    setActionPending(offerId);
    try {
      const r = await fetch(`/api/borrow-requests/${req.id}/offers/${offerId}/reject`, { method: "PATCH" });
      if (r.ok) {
        toast.success("Offer rejected");
        const r2 = await fetch(`/api/borrow-requests/${req.id}`);
        if (r2.ok) setDetail(await r2.json() as FullRequest);
      } else {
        const d = await r.json() as { error?: string };
        toast.error(d.error ?? "Failed to reject offer");
      }
    } finally { setActionPending(null); }
  };

  const closeRequest = async () => {
    setClosePending(true);
    try {
      const r = await fetch(`/api/borrow-requests/${req.id}/close`, { method: "PATCH" });
      if (r.ok) {
        toast.success("Request closed");
        onRefresh();
      } else {
        const d = await r.json() as { error?: string };
        toast.error(d.error ?? "Failed to close request");
      }
    } finally { setClosePending(false); }
  };

  const STATUS_PILL: Record<string, string> = {
    open: "bg-emerald-100 text-emerald-700",
    fulfilled: "bg-blue-100 text-blue-700",
    closed: "bg-[var(--surface-soft)] text-[var(--text-muted)]",
  };

  return (
    <div className={`rounded-2xl border bg-[var(--surface)] transition-all ${expanded ? "border-[var(--primary)]/40 shadow-md" : "border-[var(--border)] shadow-sm"}`}>
      <div className="flex items-start gap-4 p-5">
        <button onClick={toggle} className="flex-1 min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-[var(--foreground)]">{req.title}</p>
            {req.category && (
              <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[var(--primary)]">
                {req.category}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold capitalize ${STATUS_PILL[req.status] ?? "bg-gray-100 text-gray-600"}`}>
              {req.status}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fd(req.neededFrom)} – {fd(req.neededUntil)}</span>
            {req.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.location}</span>}
            {req.budgetPerDay != null && <span className="flex items-center gap-1"><Coins className="h-3 w-3" />Up to TK {req.budgetPerDay.toLocaleString()}/day</span>}
          </div>
          <div className="mt-1.5">
            <span className={`text-xs font-semibold ${req._count.offers > 0 ? "text-emerald-600" : "text-[var(--text-muted)]"}`}>
              {req._count.offers} {req._count.offers === 1 ? "offer" : "offers"}
            </span>
          </div>
        </button>

        <div className="flex flex-shrink-0 items-center gap-2 mt-1">
          {req.status === "open" && (
            <button
              onClick={closeRequest}
              disabled={closePending}
              className="rounded-lg bg-[var(--surface-soft)] px-3 py-1.5 text-[0.75rem] font-bold text-[var(--text-secondary)] transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
            >
              {closePending ? "Closing…" : "Close"}
            </button>
          )}
          <button
            onClick={toggle}
            className="rounded-lg bg-[var(--surface-soft)] p-1.5 text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
          {req.description && (
            <p className="mb-4 text-sm text-[var(--text-secondary)]">{req.description}</p>
          )}
          {detailLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--surface-soft)]" />)}
            </div>
          ) : detail ? (
            detail.offers.length === 0 ? (
              <p className="text-center text-sm text-[var(--text-muted)]">No offers yet — share this request so others can apply</p>
            ) : (
              <div className="space-y-2">
                <p className="text-[0.72rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Offers ({detail.offers.length})</p>
                {detail.offers.map((offer) => (
                  <div key={offer.id} className={`flex items-center gap-3 rounded-xl border p-3 ${
                    offer.status === "accepted" ? "border-emerald-200 bg-emerald-50/50"
                    : offer.status === "rejected" ? "border-red-100 opacity-60"
                    : "border-[var(--border)] bg-[var(--surface-soft)]"
                  }`}>
                    <Link href={`/products/${offer.product.slug}`} className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--surface-soft)]">
                      <FallbackImage src={offer.product.imageUrl} alt={offer.product.name} fill sizes="36px" className="object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${offer.product.slug}`} className="block truncate text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)] hover:underline">{offer.product.name}</Link>
                      <p className="text-xs text-[var(--text-muted)]">{dn(offer.lender)} · TK {offer.product.pricePerDay.toLocaleString()}/day</p>
                      {offer.message && <p className="text-xs italic text-[var(--text-muted)]">&quot;{offer.message}&quot;</p>}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {offer.status === "pending" && req.status === "open" ? (
                        <>
                          <button
                            onClick={() => acceptOffer(offer.id)}
                            disabled={actionPending !== null}
                            className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                          >
                            {actionPending === offer.id ? "…" : "Accept"}
                          </button>
                          <button
                            onClick={() => rejectOffer(offer.id)}
                            disabled={actionPending !== null}
                            className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-100 disabled:opacity-50"
                          >
                            {actionPending === offer.id ? "…" : "Reject"}
                          </button>
                        </>
                      ) : (
                        <span className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold capitalize ${OFFER_BADGE[offer.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {offer.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type MainTab = "borrows" | "requests";
type ReqFilter = "open" | "fulfilled" | "closed";

const REQ_FILTERS: { id: ReqFilter; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "fulfilled", label: "Fulfilled" },
  { id: "closed", label: "Closed" },
];

export default function MyBorrowsPage() {
  const [mainTab, setMainTab] = useState<MainTab>("borrows");

  // ── Borrows tab state ──────────────────────────────────────────────────────
  const [pendingOrders, setPendingOrders] = useState<BorrowCheckout[]>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<BorrowCheckout[]>([]);
  const [pastOrders, setPastOrders] = useState<BorrowCheckout[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelPending, setCancelPending] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const [returnTarget, setReturnTarget] = useState<BorrowCheckout | null>(null);
  const [returnUseFor, setReturnUseFor] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  const [returnTags, setReturnTags] = useState<string[]>([]);
  const [returnRating, setReturnRating] = useState(5);
  const [returnAnon, setReturnAnon] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  // ── My Requests tab state ──────────────────────────────────────────────────
  const [myReqs, setMyReqs] = useState<BorrowRequestItem[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqFetched, setReqFetched] = useState(false);
  const [reqFilter, setReqFilter] = useState<ReqFilter>("open");
  const [postOpen, setPostOpen] = useState(false);
  const [postForm, setPostForm] = useState({
    title: "", subcategory: "", description: "",
    location: "", neededFrom: "", neededUntil: "", budgetPerDay: "",
  });
  const [postSubmitting, setPostSubmitting] = useState(false);

  // ── Fetch borrows (existing) ───────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pendRes, accRes, pastRes] = await Promise.all([
        fetch("/api/borrow-orders?role=borrower&status=pending"),
        fetch("/api/borrow-orders?role=borrower&status=accepted"),
        fetch("/api/borrow-orders?role=borrower&status=returned"),
      ]);
      if (pendRes.ok) setPendingOrders(await pendRes.json() as BorrowCheckout[]);
      if (accRes.ok) setAcceptedOrders(await accRes.json() as BorrowCheckout[]);
      if (pastRes.ok) setPastOrders(await pastRes.json() as BorrowCheckout[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  // ── Fetch my requests (lazy) ───────────────────────────────────────────────
  const fetchMyReqs = useCallback(async () => {
    setReqLoading(true);
    try {
      const r = await fetch("/api/borrow-requests?mine=true");
      if (r.ok) setMyReqs(await r.json() as BorrowRequestItem[]);
    } finally { setReqLoading(false); setReqFetched(true); }
  }, []);

  useEffect(() => {
    if (mainTab === "requests" && !reqFetched) void fetchMyReqs();
  }, [mainTab, reqFetched, fetchMyReqs]);

  // ── Borrows handlers (existing) ────────────────────────────────────────────
  const handleCancel = async (orderId: string) => {
    setCancelPending(orderId);
    try {
      const res = await fetch(`/api/borrow-orders/${orderId}/cancel`, { method: "PATCH" });
      if (res.ok) setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
    } finally { setCancelPending(null); }
  };

  const openReturn = (order: BorrowCheckout) => {
    setReturnTarget(order);
    setReturnUseFor(""); setReturnLocation(""); setReturnTags([]); setReturnRating(5); setReturnAnon(false);
  };

  const closeReturn = () => setReturnTarget(null);

  const submitReturn = async () => {
    if (!returnTarget || returnSubmitting) return;
    if (!returnUseFor.trim()) return;
    setReturnSubmitting(true);
    try {
      const res = await fetch(`/api/borrow-orders/${returnTarget.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useFor: returnUseFor.trim(),
          location: returnLocation.trim() || undefined,
          tags: returnTags,
          itemRating: returnRating,
          anonymous: returnAnon,
        }),
      });
      if (res.ok) { closeReturn(); void fetchAll(); }
    } finally { setReturnSubmitting(false); }
  };

  // ── Post a Request handler ─────────────────────────────────────────────────
  const handlePostInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPostForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!postForm.title.trim()) { toast.error("Title is required"); return; }
    if (!postForm.neededFrom || !postForm.neededUntil) { toast.error("Date range is required"); return; }
    setPostSubmitting(true);
    try {
      const res = await fetch("/api/borrow-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postForm.title.trim(),
          category: postForm.subcategory ? (getCategoryForSub(postForm.subcategory) || postForm.subcategory) : undefined,
          description: postForm.description.trim() || undefined,
          location: postForm.location.trim() || undefined,
          neededFrom: postForm.neededFrom,
          neededUntil: postForm.neededUntil,
          budgetPerDay: postForm.budgetPerDay ? Number(postForm.budgetPerDay) : undefined,
        }),
      });
      if (res.ok) {
        toast.success("Request posted!");
        setPostOpen(false);
        setPostForm({ title: "", subcategory: "", description: "", location: "", neededFrom: "", neededUntil: "", budgetPerDay: "" });
        void fetchMyReqs();
      } else {
        const d = await res.json() as { error?: string };
        toast.error(d.error ?? "Failed to post request");
      }
    } finally { setPostSubmitting(false); }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const allPendingAndAccepted = [
    ...pendingOrders.map((o) => ({ ...o, _isPending: true })),
    ...acceptedOrders.map((o) => ({ ...o, _isPending: false })),
  ];

  const filteredReqs = myReqs.filter((r) => r.status === reqFilter);

  const mainTabs = [
    { id: "borrows" as MainTab, label: "Borrowed Items", count: allPendingAndAccepted.length },
    { id: "requests" as MainTab, label: "My Requests", count: myReqs.filter((r) => r.status === "open").length },
  ];

  return (
    <div className="mx-auto max-w-[900px]">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[1.8rem] font-black tracking-tight text-[var(--ink)]">
            {mainTab === "borrows" ? "Borrowed Items" : "My Requests"}
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            {mainTab === "borrows"
              ? "Track your borrow requests and items you are currently borrowing."
              : "Manage your want-ads and review offers from lenders."}
          </p>
        </div>
        {mainTab === "requests" && (
          <button
            onClick={() => setPostOpen(true)}
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]"
          >
            <Plus className="h-4 w-4" />
            Post a Request
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-2xl bg-[var(--surface-soft)] p-1 border border-[var(--border)]">
        {mainTabs.map((t) => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              mainTab === t.id
                ? "bg-white shadow text-[var(--primary)] border border-[var(--border)]"
                : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-black ${mainTab === t.id ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-[var(--border)] text-[var(--text-secondary)]"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Borrowed Items ── */}
      {mainTab === "borrows" && (
        <>
          <div className="mb-3 mt-2 flex items-center justify-between">
            <span className="text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Borrow Requests ({loading ? "…" : allPendingAndAccepted.length})
            </span>
          </div>

          {loading ? (
            <div className="mb-8 flex flex-col gap-3">
              {[...Array(2)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-[18px] bg-[var(--surface-soft)]" />)}
            </div>
          ) : allPendingAndAccepted.length === 0 ? (
            <div className="mb-8 rounded-[18px] border border-[var(--border)] bg-white px-6 py-8 text-center">
              <p className="font-black text-[var(--ink)]">No borrow requests yet</p>
              <p className="mt-1 text-[0.85rem] text-[var(--text-muted)]">Requests you send from Browse Items will appear here</p>
            </div>
          ) : (
            <div className="mb-8 flex flex-col gap-3">
              {allPendingAndAccepted.map((order) => {
                const isPending = order._isPending;
                const isExpanded = expandedOrder === order.id;
                return (
                  <div key={order.id}
                    className={`overflow-hidden rounded-[18px] border bg-white shadow-[0_4px_16px_rgba(12,32,30,0.06)] ${
                      isPending ? "border-[#fde68a]" : "border-[#bbf7d0]"
                    }`}>
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-[var(--surface-soft)]">
                        <FallbackImage src={order.product.imageUrl} alt={order.product.name} fill sizes="56px" className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-[var(--ink)] text-[0.95rem]">{order.product.name}</p>
                          {order.product.category && (
                            <span className="rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                              {order.product.category}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[0.78rem] text-[var(--text-muted)]">
                          From <span className="font-semibold text-[var(--ink)]">{lenderDisplayName(order.lender)}</span>
                          {" · "}Requested {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[0.75rem] font-bold ${isPending ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                          ● {isPending ? "Pending" : "Accepted"}
                        </span>
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="rounded-lg bg-[var(--surface-soft)] px-3 py-1.5 text-[0.75rem] font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--ink)]"
                        >
                          {isExpanded ? "Hide" : "Details"}
                        </button>
                        {isPending && (
                          <button
                            onClick={() => handleCancel(order.id)}
                            disabled={cancelPending === order.id}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-[0.75rem] font-bold text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50"
                          >
                            {cancelPending === order.id ? "Cancelling…" : "Cancel"}
                          </button>
                        )}
                        {!isPending && (
                          <button
                            onClick={() => openReturn(order)}
                            className="rounded-[10px] bg-[var(--primary)] px-4 py-2 text-[0.82rem] font-bold text-white transition-opacity hover:opacity-90"
                          >
                            Return
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={`border-t px-5 py-4 ${isPending ? "border-[#fde68a] bg-[#fffbeb]" : "border-[#bbf7d0] bg-[#f0fdf4]"}`}>
                        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                          <div className="space-y-2">
                            {order.product.description && (
                              <p className="text-[0.83rem] leading-relaxed text-[var(--text-secondary)]">{order.product.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 text-[0.78rem] text-[var(--text-muted)]">
                              {order.product.location && (
                                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {order.product.location}</span>
                              )}
                              <span className="inline-flex items-center gap-1"><Coins className="h-3.5 w-3.5" /> TK {order.product.pricePerDay.toLocaleString()} / day</span>
                              {order.product.deposit != null && (
                                <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> TK {order.product.deposit.toLocaleString()} deposit</span>
                              )}
                              {order.endDate && (
                                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Due {new Date(order.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                              )}
                            </div>
                            {order.notes && (
                              <p className="text-[0.78rem] italic text-[var(--text-muted)]">Note: &quot;{order.notes}&quot;</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1.5 text-right text-[0.72rem] font-semibold">
                            <span className={`rounded-full px-2.5 py-1 ${isPending ? "bg-amber-200 text-amber-800" : "bg-emerald-200 text-emerald-800"}`}>
                              <span className="inline-flex items-center gap-1">
                                {isPending ? <Clock3 className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                {isPending ? "Awaiting lender approval" : "Lender accepted your request"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Past Borrows */}
          <div className="mb-3.5 text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Past Borrows ({loading ? "…" : pastOrders.length})
          </div>
          {loading ? (
            <div className="h-24 animate-pulse rounded-[18px] bg-[var(--surface-soft)]" />
          ) : pastOrders.length === 0 ? (
            <div className="rounded-[18px] border border-[var(--border)] bg-white px-6 py-6 text-center">
              <p className="text-[0.88rem] text-[var(--text-muted)]">No past borrows yet</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-white shadow-[0_6px_20px_rgba(12,32,30,0.06)]">
              {pastOrders.map((order, i) => (
                <div key={order.id}
                  className={`flex items-center gap-4 px-6 py-4 ${i < pastOrders.length - 1 ? "border-b border-[#e3dcf3]" : ""}`}>
                  <div className={`h-11 w-11 flex-shrink-0 rounded-[11px] ${GRADIENTS[i % GRADIENTS.length]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.9rem] font-bold text-[var(--ink)]">{order.product.name}</p>
                    <p className="text-[0.78rem] text-[var(--text-muted)]">
                      From {lenderDisplayName(order.lender)}
                      {order.returnedAt && ` · Returned ${new Date(order.returnedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                    </p>
                  </div>
                  <StarRating rating={5} />
                  <span className="flex-shrink-0 rounded-full bg-[var(--success-soft)] px-3 py-1 text-[0.75rem] font-bold text-[var(--success)]">
                    Returned
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab 2: My Requests ── */}
      {mainTab === "requests" && (
        <div className="space-y-4">
          {/* Status filter pills */}
          <div className="flex gap-2">
            {REQ_FILTERS.map((f) => {
              const cnt = myReqs.filter((r) => r.status === f.id).length;
              return (
                <button key={f.id} onClick={() => setReqFilter(f.id)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
                    reqFilter === f.id
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--primary)]/40"
                  }`}>
                  {f.label}
                  {cnt > 0 && <span className="ml-1.5 opacity-70">{cnt}</span>}
                </button>
              );
            })}
          </div>

          {reqLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--surface-soft)]" />)}
            </div>
          ) : filteredReqs.length === 0 ? (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-8 py-16 text-center">
              <Inbox className="mx-auto mb-3 h-10 w-10 text-[var(--primary)]" strokeWidth={1.5} />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {reqFilter === "open" ? "No open requests" : reqFilter === "fulfilled" ? "No fulfilled requests" : "No closed requests"}
              </h2>
              {reqFilter === "open" && (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Post a request to find lenders for items you need.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReqs.map((req) => (
                <MyRequestRow key={req.id} req={req} onRefresh={() => void fetchMyReqs()} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Return Modal */}
      {returnTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(27,21,48,0.75)] backdrop-blur-[4px]"
          onClick={(e) => e.target === e.currentTarget && closeReturn()}
        >
          <div className="relative max-h-[90vh] w-[480px] overflow-y-auto scrollbar-none rounded-3xl bg-white p-8 shadow-2xl">
            <button
              onClick={closeReturn}
              className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--text-muted)] text-lg"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>

            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f2eefb,#daeaeb)] text-[var(--primary)]">
                <Sprout className="h-7 w-7" strokeWidth={1.8} />
              </div>
              <h2 className="text-[1.1rem] font-black text-[var(--ink)]">Return: {returnTarget.product.name}</h2>
              <p className="mt-1 text-[0.82rem] text-[var(--text-muted)]">Tell us how you used it — this feeds into the Item Trail</p>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
                What did you use it for? <span className="text-red-400">*</span>
              </label>
              <textarea
                value={returnUseFor}
                onChange={(e) => setReturnUseFor(e.target.value)}
                placeholder={getPrompt(returnTarget.product.category).placeholder}
                rows={2}
                className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Tags</label>
              <div className="flex flex-wrap gap-2">
                {getPrompt(returnTarget.product.category).tags.map((tag) => {
                  const active = returnTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => setReturnTags((prev) => active ? prev.filter((t) => t !== tag) : [...prev, tag])}
                      className={`rounded-full border-[1.5px] px-3 py-1 text-[0.75rem] font-bold transition-all ${
                        active ? "border-[#3b2a80] bg-[#f2eefb] text-[#31236a]" : "border-[#e3dcf3] bg-[#f8f7fc] text-[#9187b0]"
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Location (optional)</label>
              <input
                value={returnLocation}
                onChange={(e) => setReturnLocation(e.target.value)}
                placeholder="e.g. Sylhet, Gulshan…"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Rate this item</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setReturnRating(n)}>
                    <svg width="28" height="28" viewBox="0 0 24 24"
                      fill={n <= returnRating ? "#f59e0b" : "none"}
                      stroke={n <= returnRating ? "#f59e0b" : "#e3dcf3"} strokeWidth="1.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setReturnAnon((v) => !v)}
              className="mb-5 flex items-center gap-2 text-[0.8rem] font-bold text-[var(--text-muted)]"
            >
              <div className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${returnAnon ? "bg-[#3b2a80]" : "bg-[#e3dcf3]"}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left] duration-200 ${returnAnon ? "left-[18px]" : "left-0.5"}`} />
              </div>
              Post anonymously
            </button>

            <button
              onClick={submitReturn}
              disabled={returnSubmitting || !returnUseFor.trim()}
              className="w-full rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] py-3.5 text-[0.95rem] font-black text-white disabled:opacity-50"
            >
              {returnSubmitting ? "Submitting…" : "Submit Return"}
            </button>
          </div>
        </div>
      )}

      {/* Post a Request Modal */}
      {postOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--dark-border)] bg-[var(--surface)] shadow-lg">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-6">
              <h2 className="text-xl font-bold text-[var(--foreground)]">Post a Request</h2>
              <button
                onClick={() => setPostOpen(false)}
                disabled={postSubmitting}
                className="rounded-lg p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitPost} className="max-h-[80vh] overflow-y-auto scrollbar-none space-y-4 p-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--foreground)]">
                  What are you looking to borrow? <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  type="text"
                  value={postForm.title}
                  onChange={handlePostInput}
                  placeholder="e.g. DSLR Camera, Camping Tent, Guitar"
                  required
                  disabled={postSubmitting}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--foreground)]">Category</label>
                <CategoryPicker
                  mode="single"
                  value={postForm.subcategory ? [postForm.subcategory] : []}
                  onChange={([v]) => setPostForm((f) => ({ ...f, subcategory: v ?? "" }))}
                  disabled={postSubmitting}
                  placeholder="Select a category"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--foreground)]">Description</label>
                <textarea
                  name="description"
                  value={postForm.description}
                  onChange={handlePostInput}
                  placeholder="Describe what you need and any important requirements"
                  rows={3}
                  disabled={postSubmitting}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--foreground)]">Location</label>
                <input
                  name="location"
                  type="text"
                  value={postForm.location}
                  onChange={handlePostInput}
                  placeholder="Where do you need it delivered / picked up?"
                  disabled={postSubmitting}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[var(--foreground)]">
                    Need from <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="neededFrom"
                    type="date"
                    value={postForm.neededFrom}
                    onChange={handlePostInput}
                    required
                    disabled={postSubmitting}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[var(--foreground)]">
                    Until <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="neededUntil"
                    type="date"
                    value={postForm.neededUntil}
                    onChange={handlePostInput}
                    required
                    disabled={postSubmitting}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--foreground)]">Budget / Day (TK)</label>
                <input
                  name="budgetPerDay"
                  type="number"
                  min="1"
                  value={postForm.budgetPerDay}
                  onChange={handlePostInput}
                  placeholder="e.g. 500 (optional)"
                  disabled={postSubmitting}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPostOpen(false)}
                  disabled={postSubmitting}
                  className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-soft)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postSubmitting}
                  className="flex-1 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  {postSubmitting ? "Posting…" : "Post Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
