"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { X, MapPin, ShieldCheck, Package, MessageCircle, ExternalLink } from "lucide-react";
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
  identityVerified: boolean;
  contactVerified: boolean;
  memberSince: string;
  itemCount: number;
  isCurrentUser: boolean;
  items: UserItem[];
}

interface Props {
  userId: string;
  onClose: () => void;
}

export default function UserProfileModal({ userId, onClose }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((d: UserProfile) => setProfile(d))
      .finally(() => setLoading(false));
  }, [userId]);

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

  const avatarLabel = displayName.charAt(0).toUpperCase() || "U";

  const memberYear = profile
    ? new Date(profile.memberSince).getFullYear()
    : null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl">
        {/* Close */}
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
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-2xl font-bold text-white">
                  {avatarLabel}
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <h2 className="text-lg font-bold text-[var(--foreground)]">{displayName}</h2>
                  {profile.userName && (
                    <p className="text-sm text-[var(--text-muted)]">@{profile.userName}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {profile.location && (
                      <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <MapPin className="h-3 w-3" />
                        {profile.location.split(",")[0]}
                      </span>
                    )}
                    {memberYear && (
                      <span className="text-xs text-[var(--text-muted)]">
                        Member since {memberYear}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-2">
                    {profile.identityVerified && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700">
                        <ShieldCheck className="h-3 w-3" /> ID Verified
                      </span>
                    )}
                    {profile.contactVerified && (
                      <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[0.65rem] font-bold text-blue-700">
                        <ShieldCheck className="h-3 w-3" /> Contact Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div className="border-b border-[var(--border)] px-6 py-3">
              <span className="text-sm text-[var(--text-secondary)]">
                <span className="font-bold text-[var(--foreground)]">{profile.itemCount}</span>{" "}
                active listing{profile.itemCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Items grid */}
            <div className="max-h-64 overflow-y-auto p-4">
              {profile.items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-[var(--text-muted)]">
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

            {/* Footer actions */}
            {!profile.isCurrentUser && (
              <div className="flex gap-3 border-t border-[var(--border)] px-4 py-3">
                <Link
                  href={`/dashboard/messages?userId=${profile.id}`}
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Message
                </Link>
                <Link
                  href={`/dashboard/browse?lender=${profile.id}`}
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  <ExternalLink className="h-4 w-4" />
                  All Listings
                </Link>
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
