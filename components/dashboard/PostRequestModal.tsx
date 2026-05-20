"use client";

import { useEffect, useState } from "react";
import { Inbox, MapPin, Pencil, X } from "lucide-react";
import CategoryPicker from "@/components/dashboard/CategoryPicker";
import { LocationPickerModal } from "@/components/LocationPickerModal";

interface PostRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PostRequestModal({ open, onClose, onSuccess }: PostRequestModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(""); setCategory(""); setDescription("");
    setLocation(""); setFrom(""); setUntil(""); setBudget(""); setError("");
    setLocationLoading(true);
    fetch("/api/user/location")
      .then((r) => r.ok ? r.json() as Promise<{ location?: string }> : null)
      .then((d) => { if (d?.location) setLocation(d.location); })
      .catch(() => {})
      .finally(() => setLocationLoading(false));
  }, [open]);

  if (!open) return null;

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
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(27,21,48,0.75)] backdrop-blur-[4px]"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="relative max-h-[92vh] w-[500px] overflow-y-auto scrollbar-none rounded-3xl bg-white p-8 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--text-muted)]"
          >
            <X className="h-4 w-4" strokeWidth={2.4} />
          </button>

          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f2eefb,#daeaeb)]">
              <Inbox className="h-7 w-7 text-[var(--primary)]" strokeWidth={1.8} />
            </div>
            <h2 className="text-[1.1rem] font-black text-[var(--ink)]">Post a Borrow Request</h2>
            <p className="mt-1 text-[0.82rem] text-[var(--text-muted)]">Describe what you need — lenders will offer their item.</p>
          </div>

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
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                <span className="flex-1 text-[0.88rem] text-[var(--ink)]">
                  {locationLoading
                    ? <span className="text-[var(--text-muted)]">Fetching location…</span>
                    : location || <span className="text-[var(--text-muted)]">No location set</span>
                  }
                </span>
                <button type="button" onClick={() => setShowLocationPicker(true)}
                  className="flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline">
                  <Pencil className="h-3 w-3" /> Change
                </button>
              </div>
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
              <button onClick={onClose}
                className="flex-1 rounded-full border border-[var(--border)] py-3 text-[0.88rem] font-bold text-[var(--text-muted)] hover:text-[var(--ink)]">
                Cancel
              </button>
              <button onClick={submit} disabled={submitting || !title.trim() || !from || !until}
                className="flex-1 rounded-full bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] py-3 text-[0.88rem] font-black text-white disabled:opacity-50">
                {submitting ? "Posting…" : "Post Request"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLocationPicker && (
        <LocationPickerModal
          initialLocation={location}
          onConfirm={({ location: loc }) => { setLocation(loc); setShowLocationPicker(false); }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </>
  );
}
