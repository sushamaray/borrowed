"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft, Calendar, Coins, MapPin, Check, X,
  Package, ChevronDown,
} from "lucide-react";
import FallbackImage from "@/components/FallbackImage";

interface Offer {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  lender: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    userName: string | null;
  };
  product: {
    id: string;
    name: string;
    category: string;
    pricePerDay: number;
    deposit: number | null;
    imageUrl: string | null;
    location: string;
    description: string | null;
  };
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
  createdAt: string;
  requester: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    userName: string | null;
  };
  offers: Offer[];
}

interface LentItem {
  id: string;
  product: {
    id: string;
    name: string;
    category: string;
    pricePerDay: number;
    imageUrl: string | null;
  };
}

function displayName(u: { name: string | null; firstName: string | null; lastName: string | null; userName: string | null }): string {
  if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
  return u.name ?? u.userName ?? "Unknown";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  open:      "bg-emerald-100 text-emerald-700",
  fulfilled: "bg-blue-100 text-blue-700",
  closed:    "bg-[var(--surface-soft)] text-[var(--text-muted)]",
};

const OFFER_STATUS_STYLES: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-500",
};

export default function BorrowRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const [req, setReq] = useState<BorrowRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [closePending, setClosePending] = useState(false);

  // Offer modal (for lenders)
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [lentItems, setLentItems] = useState<LentItem[]>([]);
  const [lentLoading, setLentLoading] = useState(false);
  const [selectedLentItemId, setSelectedLentItemId] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerError, setOfferError] = useState("");

  const fetchRequest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/borrow-requests/${id}`);
      if (res.ok) setReq(await res.json() as BorrowRequest);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchRequest(); }, [fetchRequest]);

  const isRequester = session?.user?.id === req?.requester.id;

  const openOfferModal = async () => {
    setSelectedLentItemId(""); setOfferMessage(""); setOfferError("");
    setShowOfferModal(true);
    if (lentItems.length === 0) {
      setLentLoading(true);
      try {
        const res = await fetch("/api/lent-items");
        if (res.ok) setLentItems(await res.json() as LentItem[]);
      } finally {
        setLentLoading(false);
      }
    }
  };

  const submitOffer = async () => {
    if (offerSubmitting) return;
    if (!selectedLentItemId) { setOfferError("Please select an item"); return; }
    const lentItem = lentItems.find((l) => l.id === selectedLentItemId);
    if (!lentItem) return;

    setOfferSubmitting(true);
    setOfferError("");
    try {
      const res = await fetch(`/api/borrow-requests/${id}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: lentItem.product.id,
          message: offerMessage.trim() || undefined,
        }),
      });
      if (res.ok) {
        setShowOfferModal(false);
        void fetchRequest();
      } else {
        const data = await res.json() as { error?: string };
        setOfferError(data.error ?? "Failed to submit offer");
      }
    } finally {
      setOfferSubmitting(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    setActionPending(offerId);
    try {
      const res = await fetch(`/api/borrow-requests/${id}/offers/${offerId}/accept`, { method: "PATCH" });
      if (res.ok) void fetchRequest();
    } finally {
      setActionPending(null);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    setActionPending(offerId);
    try {
      const res = await fetch(`/api/borrow-requests/${id}/offers/${offerId}/reject`, { method: "PATCH" });
      if (res.ok) void fetchRequest();
    } finally {
      setActionPending(null);
    }
  };

  const handleClose = async () => {
    setClosePending(true);
    try {
      const res = await fetch(`/api/borrow-requests/${id}/close`, { method: "PATCH" });
      if (res.ok) void fetchRequest();
    } finally {
      setClosePending(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[760px] space-y-4">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-[var(--surface-soft)]" />
        <div className="h-48 animate-pulse rounded-[22px] bg-[var(--surface-soft)]" />
        <div className="h-64 animate-pulse rounded-[22px] bg-[var(--surface-soft)]" />
      </div>
    );
  }

  if (!req) {
    return (
      <div className="mx-auto max-w-[760px] py-20 text-center">
        <p className="font-black text-[var(--ink)]">Request not found</p>
        <button onClick={() => router.back()} className="mt-4 text-[0.85rem] text-[var(--primary)]">← Go back</button>
      </div>
    );
  }

  const myOffer = !isRequester && req.offers.find((o) => o.lender.id === session?.user?.id);
  const canOffer = !isRequester && req.status === "open" && !myOffer;

  return (
    <div className="mx-auto max-w-[760px]">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-1.5 text-[0.82rem] font-semibold text-[var(--text-muted)] hover:text-[var(--ink)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      {/* Request card */}
      <div className="mb-6 rounded-[22px] border border-[var(--border)] bg-white p-7 shadow-[0_4px_20px_rgba(12,32,30,0.07)]">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[1.5rem] font-black leading-tight text-[var(--ink)]">{req.title}</h1>
              {req.category && (
                <span className="rounded-full bg-[#f2eefb] px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#6d5bba]">
                  {req.category}
                </span>
              )}
              <span className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold capitalize ${STATUS_STYLES[req.status] ?? "bg-gray-100 text-gray-600"}`}>
                {req.status}
              </span>
            </div>
            <p className="mt-1 text-[0.82rem] text-[var(--text-muted)]">
              Posted by <span className="font-semibold text-[var(--ink)]">{displayName(req.requester)}</span>
              {" · "}{formatDate(req.createdAt)}
            </p>
          </div>
        </div>

        {req.description && (
          <p className="mb-5 text-[0.9rem] leading-relaxed text-[var(--text-secondary)]">{req.description}</p>
        )}

        <div className="flex flex-wrap gap-4 text-[0.82rem] text-[var(--text-muted)]">
          {req.location && (
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{req.location}</span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(req.neededFrom)} – {formatDate(req.neededUntil)}
          </span>
          {req.budgetPerDay != null && (
            <span className="flex items-center gap-1.5"><Coins className="h-3.5 w-3.5" />Up to TK {req.budgetPerDay.toLocaleString()} / day</span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-3">
          {canOffer && (
            <button
              onClick={openOfferModal}
              className="rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] px-6 py-2.5 text-[0.88rem] font-black text-white shadow-[0_4px_14px_rgba(59,42,128,0.3)] hover:opacity-90"
            >
              Submit an Offer
            </button>
          )}
          {myOffer && (
            <span className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.82rem] font-bold ${OFFER_STATUS_STYLES[myOffer.status] ?? "bg-gray-100 text-gray-600"}`}>
              Your offer: {myOffer.status}
            </span>
          )}
          {isRequester && req.status === "open" && (
            <button
              onClick={handleClose}
              disabled={closePending}
              className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-[0.82rem] font-bold text-red-500 hover:bg-red-100 disabled:opacity-50"
            >
              {closePending ? "Closing…" : "Close Request"}
            </button>
          )}
        </div>
      </div>

      {/* Offers section */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
          Offers ({req.offers.length})
        </span>
      </div>

      {req.offers.length === 0 ? (
        <div className="rounded-[18px] border border-[var(--border)] bg-white px-6 py-10 text-center">
          <p className="text-[0.88rem] text-[var(--text-muted)]">No offers yet</p>
          {!isRequester && req.status === "open" && (
            <p className="mt-1 text-[0.82rem] text-[var(--text-muted)]">Be the first to offer your item!</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {req.offers.map((offer) => (
            <div
              key={offer.id}
              className={`overflow-hidden rounded-[18px] border bg-white shadow-[0_4px_16px_rgba(12,32,30,0.05)] ${
                offer.status === "accepted" ? "border-[#bbf7d0]" :
                offer.status === "rejected" ? "border-[#fecaca] opacity-60" :
                "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-[var(--surface-soft)]">
                  <FallbackImage src={offer.product.imageUrl} alt={offer.product.name} fill sizes="56px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-[0.95rem] text-[var(--ink)]">{offer.product.name}</p>
                    <span className="rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                      {offer.product.category}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.78rem] text-[var(--text-muted)]">
                    Offered by <span className="font-semibold text-[var(--ink)]">{displayName(offer.lender)}</span>
                    {" · "}TK {offer.product.pricePerDay.toLocaleString()} / day
                    {offer.product.deposit != null && ` · TK ${offer.product.deposit.toLocaleString()} deposit`}
                  </p>
                  {offer.message && (
                    <p className="mt-1 text-[0.78rem] italic text-[var(--text-muted)]">"{offer.message}"</p>
                  )}
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[0.72rem] font-bold capitalize ${OFFER_STATUS_STYLES[offer.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {offer.status}
                  </span>
                  {isRequester && req.status === "open" && offer.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleAcceptOffer(offer.id)}
                        disabled={actionPending === offer.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                        title="Accept offer"
                      >
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => handleRejectOffer(offer.id)}
                        disabled={actionPending === offer.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 disabled:opacity-50"
                        title="Reject offer"
                      >
                        <X className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Offer Modal */}
      {showOfferModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(27,21,48,0.75)] backdrop-blur-[4px]"
          onClick={(e) => e.target === e.currentTarget && setShowOfferModal(false)}
        >
          <div className="relative w-[460px] rounded-3xl bg-white p-8 shadow-2xl">
            <button
              onClick={() => setShowOfferModal(false)}
              className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--text-muted)]"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>

            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f2eefb,#daeaeb)] text-[var(--primary)]">
                <Package className="h-7 w-7" strokeWidth={1.8} />
              </div>
              <h2 className="text-[1.05rem] font-black text-[var(--ink)]">Submit an Offer</h2>
              <p className="mt-1 text-[0.82rem] text-[var(--text-muted)]">Pick one of your listed items to offer for this request.</p>
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
                    You have no listed items yet. Go to <strong>Lent Items</strong> to add one first.
                  </p>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedLentItemId}
                      onChange={(e) => setSelectedLentItemId(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 pr-9 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                    >
                      <option value="">Choose an item…</option>
                      {lentItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.product.name} — TK {item.product.pricePerDay.toLocaleString()}/day
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Message (optional)</label>
                <textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Add a note — condition, availability, pickup details…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              {offerError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-[0.82rem] font-semibold text-red-600">{offerError}</p>
              )}

              <button
                onClick={submitOffer}
                disabled={offerSubmitting || !selectedLentItemId || lentItems.length === 0}
                className="w-full rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] py-3.5 text-[0.95rem] font-black text-white disabled:opacity-50"
              >
                {offerSubmitting ? "Submitting…" : "Submit Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
