"use client";

import { useEffect, useRef } from "react";
import { X, ShieldAlert, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

type Checkout = {
  id: string;
  deposit: number | null;
  product: { name: string };
  conditionPhotos: { id: string; role: string }[];
};

export default function RaiseDisputeModal({
  checkout,
  onClose,
  onSuccess,
}: {
  checkout: Checkout;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const beforeId = checkout.conditionPhotos.find((p) => p.role === "before")?.id;
  const afterId  = checkout.conditionPhotos.find((p) => p.role === "after")?.id;
  const beforePhotoUrl = beforeId ? `/api/condition-photos/${beforeId}` : undefined;
  const afterPhotoUrl  = afterId  ? `/api/condition-photos/${afterId}`  : undefined;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutId: checkout.id,
          title: title.trim(),
          description: description.trim(),
          beforePhotoUrl,
          afterPhotoUrl,
        }),
      });

      if (res.ok) {
        toast.success("Dispute raised — our team will review it shortly.");
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string };
        toast.error(data.error ?? "Failed to raise dispute");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = title.trim().length > 0 && description.trim().length >= 20;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="font-extrabold text-[var(--ink)]">Raise a Dispute</div>
              <div className="text-xs text-[var(--text-muted)]">{checkout.product.name}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Warning banner */}
        <div className="mx-6 mt-4 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-700">
            Disputes are reviewed by our admin team. Please provide clear evidence.
            {checkout.deposit
              ? ` The deposit of ৳${checkout.deposit.toLocaleString()} will be held until resolved.`
              : ""}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[var(--ink)]">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scratch on lens barrel"
              maxLength={120}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[var(--ink)]">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the damage or issue in detail (min. 20 characters)…"
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
            <div className="mt-1 text-right text-xs text-[var(--text-muted)]">
              {description.length >= 20
                ? <span className="text-emerald-600">✓ Sufficient detail</span>
                : <span>{description.length}/20 min. characters</span>
              }
            </div>
          </div>

          {/* Condition photos — auto-attached */}
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-secondary)]">Condition Photos</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700">Auto-attached</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Pickup photo</p>
                {beforePhotoUrl ? (
                  <img
                    src={beforePhotoUrl}
                    alt="Pickup condition"
                    className="h-28 w-full rounded-xl object-cover border border-[var(--border)]"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] text-xs text-[var(--text-muted)]">
                    No photo
                  </div>
                )}
              </div>
              <div>
                <p className="mb-1 text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Return photo</p>
                {afterPhotoUrl ? (
                  <img
                    src={afterPhotoUrl}
                    alt="Return condition"
                    className="h-28 w-full rounded-xl object-cover border border-[var(--border)]"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] text-xs text-[var(--text-muted)]">
                    No photo
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 text-sm font-bold text-[var(--text-secondary)] transition-colors hover:bg-[var(--border)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Raising dispute…" : "Raise Dispute"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
