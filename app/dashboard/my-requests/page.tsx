"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Coins, Inbox, MapPin, Plus, X } from "lucide-react";
import CategoryPicker from "@/components/dashboard/CategoryPicker";

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
  _count: { offers: number };
}

type Tab = "open" | "fulfilled" | "closed";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_BADGE: Record<string, string> = {
  open:      "bg-emerald-100 text-emerald-700",
  fulfilled: "bg-blue-100 text-blue-700",
  closed:    "bg-[var(--surface-soft)] text-[var(--text-muted)]",
};

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("open");

  // Post modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postCategory, setPostCategory] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postLocation, setPostLocation] = useState("");
  const [postFrom, setPostFrom] = useState("");
  const [postUntil, setPostUntil] = useState("");
  const [postBudget, setPostBudget] = useState("");
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/borrow-requests?mine=true");
      if (res.ok) setRequests(await res.json() as BorrowRequest[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRequests(); }, [fetchRequests]);

  const openPostModal = () => {
    setPostTitle(""); setPostCategory(""); setPostDescription("");
    setPostLocation(""); setPostFrom(""); setPostUntil(""); setPostBudget(""); setPostError("");
    setShowPostModal(true);
  };

  const submitPost = async () => {
    if (postSubmitting) return;
    if (!postTitle.trim()) { setPostError("Title is required"); return; }
    if (!postFrom || !postUntil) { setPostError("Dates are required"); return; }
    setPostSubmitting(true);
    setPostError("");
    try {
      const res = await fetch("/api/borrow-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postTitle.trim(),
          category: postCategory || undefined,
          description: postDescription.trim() || undefined,
          location: postLocation.trim() || undefined,
          neededFrom: postFrom,
          neededUntil: postUntil,
          budgetPerDay: postBudget ? Number(postBudget) : undefined,
        }),
      });
      if (res.ok) {
        setShowPostModal(false);
        void fetchRequests();
      } else {
        const data = await res.json() as { error?: string };
        setPostError(data.error ?? "Failed to post request");
      }
    } finally {
      setPostSubmitting(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "open",      label: "Open" },
    { key: "fulfilled", label: "Fulfilled" },
    { key: "closed",    label: "Closed" },
  ];

  const filtered = requests.filter((r) => r.status === tab);

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.8rem] font-black tracking-tight text-[var(--ink)]">My Requests</h1>
          <p className="mt-1 text-[var(--text-secondary)]">Borrow requests you've posted. Lenders will offer their items here.</p>
        </div>
        <button
          onClick={openPostModal}
          className="flex flex-shrink-0 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] px-5 py-2.5 text-[0.88rem] font-black text-white shadow-[0_4px_14px_rgba(59,42,128,0.35)] transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New Request
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-1">
        {tabs.map(({ key, label }) => {
          const count = requests.filter((r) => r.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[0.82rem] font-bold transition-all ${
                tab === key
                  ? "bg-white text-[var(--ink)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--ink)]"
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-black ${
                  tab === key ? "bg-[var(--surface-soft)] text-[var(--ink)]" : "bg-white/60 text-[var(--text-muted)]"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-[18px] bg-[var(--surface-soft)]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[22px] border border-dashed border-[var(--border)] bg-white py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-soft)] text-[var(--text-muted)]">
            <Inbox className="h-7 w-7" strokeWidth={1.5} />
          </div>
          {tab === "open" ? (
            <>
              <p className="font-black text-[var(--ink)]">No open requests</p>
              <p className="mt-1 text-[0.85rem] text-[var(--text-muted)]">Post what you need and lenders will apply</p>
              <button
                onClick={openPostModal}
                className="mt-5 rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] px-6 py-2.5 text-[0.88rem] font-black text-white"
              >
                Post a Request
              </button>
            </>
          ) : (
            <p className="text-[0.88rem] text-[var(--text-muted)]">No {tab} requests</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((req) => (
            <Link key={req.id} href={`/dashboard/borrow-requests/${req.id}`}>
              <div className="group flex items-center gap-5 rounded-[18px] border border-[var(--border)] bg-white px-6 py-5 shadow-[0_4px_16px_rgba(12,32,30,0.05)] transition-all hover:border-[#6d5bba]/40 hover:shadow-[0_6px_20px_rgba(59,42,128,0.09)]">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-[var(--ink)] group-hover:text-[#3b2a80]">{req.title}</p>
                    {req.category && (
                      <span className="rounded-full bg-[#f2eefb] px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#6d5bba]">
                        {req.category}
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold capitalize ${STATUS_BADGE[req.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-[0.75rem] text-[var(--text-muted)]">
                    {req.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.location}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(req.neededFrom)} – {formatDate(req.neededUntil)}
                    </span>
                    {req.budgetPerDay != null && (
                      <span className="flex items-center gap-1"><Coins className="h-3 w-3" />TK {req.budgetPerDay.toLocaleString()} / day</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-3">
                  <span className={`rounded-full px-3 py-1.5 text-[0.78rem] font-bold ${
                    req._count.offers > 0 ? "bg-emerald-100 text-emerald-700" : "bg-[var(--surface-soft)] text-[var(--text-muted)]"
                  }`}>
                    {req._count.offers} {req._count.offers === 1 ? "offer" : "offers"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Post Request Modal */}
      {showPostModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(27,21,48,0.75)] backdrop-blur-[4px]"
          onClick={(e) => e.target === e.currentTarget && setShowPostModal(false)}
        >
          <div className="relative max-h-[92vh] w-[500px] overflow-y-auto scrollbar-none rounded-3xl bg-white p-8 shadow-2xl">
            <button
              onClick={() => setShowPostModal(false)}
              className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--text-muted)]"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>

            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f2eefb,#daeaeb)] text-[var(--primary)]">
                <Inbox className="h-7 w-7" strokeWidth={1.8} />
              </div>
              <h2 className="text-[1.1rem] font-black text-[var(--ink)]">Post a Borrow Request</h2>
              <p className="mt-1 text-[0.82rem] text-[var(--text-muted)]">Describe what you need — lenders with the item will offer it to you.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  What do you need? <span className="text-red-400">*</span>
                </label>
                <input
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. DSLR camera for a weekend trip"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Category</label>
                <CategoryPicker
                  mode="single"
                  value={postCategory ? [postCategory] : []}
                  onChange={([v]) => setPostCategory(v ?? "")}
                  placeholder="Select a category…"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Description</label>
                <textarea
                  value={postDescription}
                  onChange={(e) => setPostDescription(e.target.value)}
                  placeholder="Add any specific requirements, brand preferences, condition notes…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Location</label>
                <input
                  value={postLocation}
                  onChange={(e) => setPostLocation(e.target.value)}
                  placeholder="e.g. Dhaka, Sylhet…"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Need From <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={postFrom}
                    onChange={(e) => setPostFrom(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Need Until <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={postUntil}
                    onChange={(e) => setPostUntil(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[0.78rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Budget (TK / day)</label>
                <input
                  type="number"
                  value={postBudget}
                  onChange={(e) => setPostBudget(e.target.value)}
                  placeholder="Optional max budget per day"
                  min={0}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              {postError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-[0.82rem] font-semibold text-red-600">{postError}</p>
              )}

              <button
                onClick={submitPost}
                disabled={postSubmitting || !postTitle.trim() || !postFrom || !postUntil}
                className="w-full rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] py-3.5 text-[0.95rem] font-black text-white disabled:opacity-50"
              >
                {postSubmitting ? "Posting…" : "Post Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
