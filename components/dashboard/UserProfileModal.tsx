"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { X, MapPin, ShieldCheck, Package, MessageCircle, ExternalLink, UserRound, BadgeCheck, Star, Flag } from "lucide-react";
import FallbackImage from "@/components/FallbackImage";

interface UserItem {
  id: string;
  title: string;
  category: string | null;
  pricePerDay: number | null;
  imageUrl: string | null;
  location: string | null;
}

interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  location: string | null;
  profilePicture: string | null;
  identityVerified: boolean;
  contactVerified: boolean;
  addressVerified: boolean;
  meetupVerified: boolean;
  memberSince: string;
  itemCount: number;
  isCurrentUser: boolean;
  items: UserItem[];
}

interface Props {
  userId: string;
  onClose: () => void;
}

function ProfileAvatar({ name, imageUrl, size = 64 }: { name: string; imageUrl?: string | null; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "U";
  const dim = size === 64 ? "h-16 w-16 text-xl" : "h-12 w-12 text-base";

  if (imageUrl) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-full bg-[#f2eefb] ${dim}`}>
        <FallbackImage src={imageUrl} alt={name} fill sizes={`${size}px`} className="object-cover" />
      </div>
    );
  }

  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--primary)] font-bold text-white ${dim}`}>
      {initials}
    </div>
  );
}

const REPORT_REASONS = [
  { value: "spam",          label: "Spam" },
  { value: "scam",          label: "Scam / Fraud" },
  { value: "harassment",    label: "Harassment" },
  { value: "fake_listing",  label: "Fake Listing" },
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "other",         label: "Other" },
];

export default function UserProfileModal({ userId, onClose }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const backdropRef = useRef<HTMLDivElement>(null);

  const [borrowerRating, setBorrowerRating] = useState<{ count: number; average: number | null } | null>(null);

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((d: UserProfile) => setProfile(d))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    fetch(`/api/user/${userId}/borrower-rating`)
      .then((r) => r.ok ? r.json() as Promise<{ count: number; average: number | null }> : Promise.reject())
      .then(setBorrowerRating)
      .catch(() => {});
  }, [userId]);

  async function submitReport() {
    setReportSubmitting(true);
    setReportError(null);
    try {
      const res = await fetch(`/api/users/${userId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason, description: reportDescription.trim() || undefined }),
      });
      if (res.ok) {
        setReportSubmitted(true);
        setShowReportForm(false);
      } else {
        setReportError("Failed to submit report. Please try again.");
      }
    } catch {
      setReportError("Failed to submit report. Please try again.");
    } finally {
      setReportSubmitting(false);
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const displayName = profile
    ? profile.firstName && profile.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : (profile.userName ?? "User")
    : "";

  const memberSince = profile
    ? new Date(profile.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  const verifications = profile ? [
    { label: "Identity", value: profile.identityVerified },
    { label: "Contact", value: profile.contactVerified },
    { label: "Address", value: profile.addressVerified },
    { label: "Meetup", value: profile.meetupVerified },
  ] : [];

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-[var(--surface-soft)] p-1.5 text-[var(--text-secondary)] hover:text-[var(--foreground)]"
        >
          <X className="h-4 w-4" />
        </button>

        {loading ? (
          <div className="space-y-4 p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 animate-pulse rounded-full bg-[var(--surface-soft)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-[var(--surface-soft)]" />
                <div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-soft)]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-xl bg-[var(--surface-soft)]" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--surface-soft)]" />
              ))}
            </div>
          </div>
        ) : profile ? (
          <>
            {/* Header */}
            <div className="bg-[var(--surface-soft)] px-6 pb-5 pt-6">
              <div className="flex items-start gap-4">
                <ProfileAvatar name={displayName} imageUrl={profile.profilePicture} size={64} />
                <div className="min-w-0 flex-1 pt-1">
                  <h2 className="text-lg font-bold text-[var(--foreground)]">{displayName}</h2>
                  {profile.userName && (
                    <p className="text-sm text-[var(--text-muted)]">@{profile.userName}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {profile.location.split(",")[0]}
                      </span>
                    )}
                    {memberSince && (
                      <span className="flex items-center gap-1">
                        <UserRound className="h-3 w-3" />
                        Member since {memberSince}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Verification grid */}
            <div className="border-b border-[var(--border)] px-6 py-4">
              <p className="mb-2.5 text-[0.7rem] font-black uppercase tracking-wider text-[var(--text-muted)]">
                Verification
              </p>
              <div className="grid grid-cols-2 gap-2">
                {verifications.map((v) => (
                  <div
                    key={v.label}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[0.8rem] font-bold ${
                      v.value
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-muted)]"
                    }`}
                  >
                    {v.value
                      ? <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      : <BadgeCheck className="h-3.5 w-3.5 shrink-0 opacity-40" />
                    }
                    {v.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Borrower rating */}
            {borrowerRating && borrowerRating.count > 0 && (
              <div className="border-b border-(--border) px-6 py-3 flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-3.5 w-3.5 ${n <= Math.round(borrowerRating.average ?? 0) ? "fill-amber-400 text-amber-400" : "text-(--border)"}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-(--foreground)">
                  {borrowerRating.average != null ? borrowerRating.average.toFixed(1) : "—"}
                </span>
                <span className="text-xs text-(--text-muted)">
                  · {borrowerRating.count} lender {borrowerRating.count === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="border-b border-[var(--border)] px-6 py-3">
              <span className="text-sm text-[var(--text-secondary)]">
                <span className="font-bold text-[var(--foreground)]">{profile.itemCount}</span>{" "}
                active listing{profile.itemCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Items grid */}
            <div className="scrollbar-dark max-h-56 overflow-y-auto p-4">
              {profile.items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-[var(--text-muted)]">
                  <Package className="h-8 w-8 opacity-40" />
                  <p className="text-sm">No active listings</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {profile.items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/dashboard/items/${item.id}`}
                      onClick={onClose}
                      className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-all hover:border-[var(--primary)]/40 hover:shadow-md"
                    >
                      <div className="relative h-24 bg-[var(--surface-soft)]">
                        <FallbackImage
                          src={item.imageUrl ?? ""}
                          alt={item.title}
                          fill
                          sizes="160px"
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-2">
                        <p className="truncate text-xs font-semibold text-[var(--foreground)]">{item.title}</p>
                        {item.pricePerDay != null && (
                          <p className="text-xs font-bold text-[var(--primary)]">TK {item.pricePerDay}/day</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            {!profile.isCurrentUser && (
              <div className="border-t border-(--border) px-4 py-3 space-y-3">
                <div className="flex gap-3">
                  <Link
                    href={`/dashboard/messages?userId=${profile.id}`}
                    onClick={onClose}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-(--border) py-2 text-sm font-semibold text-(--foreground) transition-colors hover:border-(--primary)/40 hover:text-(--primary)"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Link>
                  <Link
                    href={`/dashboard/browse?lender=${profile.id}`}
                    onClick={onClose}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-(--primary) py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  >
                    <ExternalLink className="h-4 w-4" />
                    All Listings
                  </Link>
                </div>

                {!reportSubmitted && !showReportForm && (
                  <button
                    onClick={() => setShowReportForm(true)}
                    className="flex w-full items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-(--text-muted) hover:text-red-500 transition-colors"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Report this user
                  </button>
                )}

                {showReportForm && (
                  <div className="space-y-2.5">
                    <p className="text-sm font-bold text-(--foreground)">Report this user</p>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full rounded-xl border border-(--border) bg-(--surface-soft) px-3 py-2 text-sm text-(--foreground)"
                    >
                      {REPORT_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Optional: describe the issue…"
                      rows={2}
                      className="w-full resize-none rounded-xl border border-(--border) bg-(--surface-soft) px-3 py-2 text-sm text-(--foreground)"
                    />
                    {reportError && (
                      <p className="text-xs text-red-600">{reportError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowReportForm(false); setReportError(null); }}
                        className="flex-1 rounded-xl border border-(--border) py-2 text-sm font-bold text-(--text-muted) hover:bg-(--surface-soft) transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitReport}
                        disabled={reportSubmitting}
                        className="flex-1 rounded-xl bg-red-50 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        {reportSubmitting ? "Submitting…" : "Submit Report"}
                      </button>
                    </div>
                  </div>
                )}

                {reportSubmitted && (
                  <p className="text-center text-xs font-semibold text-emerald-600">
                    Report submitted. Thank you.
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">User not found.</div>
        )}
      </div>
    </div>
  );
}
