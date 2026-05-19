"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BadgeCheck, CalendarClock, Loader, MapPin, MessageSquare, ToggleLeft, ToggleRight, User, X } from "lucide-react";

type Mentor = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  specialty: string;
  category: string;
  subcategories: string[];
  bio: string;
  tags: string[];
  rating: number;
  sessions: number;
  pricePerSession: number;
  available: boolean;
  responseTime: string;
};

type Booking = {
  id: string;
  sessionFormat: "VIDEO" | "IN_PERSON";
  scheduledAt: string | null;
  goals: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    userName: string | null;
    email: string;
    profilePicture: string | null;
    image: string | null;
    location: string | null;
    createdAt: string;
    identityVerified: boolean;
    contactVerified: boolean;
    idVerified: boolean;
    addressVerified: boolean;
    meetupVerified: boolean;
  };
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-(--warning-soft) text-(--warning)",
  confirmed: "bg-(--success-soft) text-(--success)",
  cancelled: "bg-(--danger-soft) text-(--danger)",
  completed: "bg-(--surface-soft) text-(--text-muted)",
};

function UserAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
  const sizeClass = size >= 56 ? "h-14 w-14 text-xl" : size >= 48 ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-(--primary-soft) font-black text-(--primary) ${sizeClass}`}>
      {initials || <User className="h-5 w-5" />}
    </div>
  );
}

export default function MentorDashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  // User info modal state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [actingBookingId, setActingBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/dashboard/profile");
      return;
    }

    fetch("/api/mentors/me")
      .then(async (res) => {
        if (!res.ok) {
          router.replace("/dashboard/profile");
          return;
        }
        const m = await res.json();
        setMentor(m);
        const bRes = await fetch("/api/mentors/me/bookings");
        const b = bRes.ok ? await bRes.json() : [];
        setBookings(Array.isArray(b) ? b : []);
      })
      .finally(() => setLoading(false));
  }, [status, router]);

  const toggleAvailability = async () => {
    if (!mentor) return;
    setTogglingAvailability(true);
    try {
      const res = await fetch("/api/mentors/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !mentor.available }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMentor(updated);
      }
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: "confirmed" | "cancelled") => {
    setActingBookingId(bookingId);
    try {
      const res = await fetch(`/api/mentors/me/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)),
        );
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking((prev) => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } finally {
      setActingBookingId(null);
    }
  };

  const handleMessage = async () => {
    if (!selectedBooking || !msgText.trim()) return;
    setMsgSending(true);
    setMsgError("");
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: selectedBooking.user.id, message: msgText.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMsgError(data.error ?? "Failed to send message");
        return;
      }
      router.push("/dashboard/messages");
    } catch {
      setMsgError("Something went wrong. Please try again.");
    } finally {
      setMsgSending(false);
    }
  };

  const openBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setMsgText("");
    setMsgError("");
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="h-8 w-8 animate-spin text-(--primary)" />
      </div>
    );
  }

  if (!mentor) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-(--text-muted)">
          Mentor Dashboard
        </p>
        <h1 className="mt-1 text-[clamp(2.1rem,4vw,2.4rem)] font-black tracking-[-0.04em] text-(--ink)">
          {mentor.name}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-(--text-secondary)">
          Manage your availability and review incoming session booking requests.
        </p>
        <a
          href="/dashboard/profile?tab=mentor"
          className="mt-1 inline-block text-sm font-bold text-(--primary) hover:underline"
        >
          ← Edit mentor profile
        </a>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Availability */}
        <div className="rounded-[1.25rem] border border-(--border) bg-(--surface) p-5 shadow-[0_12px_40px_rgba(12,32,30,0.07)]">
          <p className="mb-3 text-sm font-extrabold text-(--ink)">Availability</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-black text-(--ink)">
                {mentor.available ? "Available for bookings" : "Not accepting bookings"}
              </p>
              <p className="text-sm text-(--text-secondary)">
                Toggle to control whether learners can book you.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleAvailability}
              disabled={togglingAvailability}
              className="shrink-0 transition-opacity hover:opacity-75 disabled:opacity-40"
              aria-label="Toggle availability"
            >
              {mentor.available
                ? <ToggleRight className="h-10 w-10 text-(--primary)" strokeWidth={1.5} />
                : <ToggleLeft className="h-10 w-10 text-(--text-muted)" strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Bookings overview */}
        <div className="rounded-[1.25rem] border border-(--border) bg-(--surface) p-5 shadow-[0_12px_40px_rgba(12,32,30,0.07)]">
          <p className="mb-3 text-sm font-extrabold text-(--ink)">Bookings overview</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: bookings.length },
              { label: "Pending", value: bookings.filter((b) => b.status === "pending").length },
              { label: "Completed", value: bookings.filter((b) => b.status === "completed").length },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-(--border) bg-(--surface-soft) p-3 text-center">
                <p className="text-2xl font-black text-(--ink)">{s.value}</p>
                <p className="text-[0.68rem] font-bold uppercase tracking-widest text-(--text-muted)">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings list */}
      <div className="rounded-[1.25rem] border border-(--border) bg-(--surface) p-5 shadow-[0_12px_40px_rgba(12,32,30,0.07)]">
        <p className="mb-4 text-sm font-extrabold text-(--ink)">Session Requests</p>
        {bookings.length === 0 ? (
          <p className="py-6 text-center text-sm text-(--text-secondary)">No bookings yet. Share your profile to get started.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((booking) => {
              const bookerName = booking.user.name ?? booking.user.firstName ?? booking.user.email;
              const isActing = actingBookingId === booking.id;
              return (
                <div key={booking.id} className="flex items-start gap-4 rounded-xl border border-(--border) bg-(--surface-soft) p-4">
                  <UserAvatar name={bookerName} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-(--ink)">{bookerName}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-widest ${STATUS_COLORS[booking.status] ?? "bg-(--surface-soft) text-(--text-muted)"}`}>
                        {booking.status}
                      </span>
                      <span className="text-xs text-(--text-muted)">
                        {booking.sessionFormat === "VIDEO" ? "Video" : "In-person"}
                      </span>
                    </div>
                    {booking.scheduledAt && (
                      <p className="mt-0.5 text-xs text-(--text-secondary)">
                        {new Date(booking.scheduledAt).toLocaleString()}
                      </p>
                    )}
                    {booking.goals && (
                      <p className="mt-1 line-clamp-1 text-sm text-(--text-secondary)">{booking.goals}</p>
                    )}
                    {booking.status === "pending" && (
                      <div className="mt-2.5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                          disabled={isActing}
                          className="rounded-full bg-(--primary) px-3.5 py-1 text-xs font-bold text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
                        >
                          {isActing ? <Loader className="h-3 w-3 animate-spin" /> : "Accept"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                          disabled={isActing}
                          className="rounded-full border border-(--border) px-3.5 py-1 text-xs font-bold text-(--text-secondary) transition-colors hover:bg-(--surface) disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openBooking(booking)}
                    className="shrink-0 rounded-full border border-(--border) px-3 py-1.5 text-xs font-bold text-(--primary) transition-colors hover:bg-(--primary-soft)"
                  >
                    View
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User info modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[3px]"
          onClick={(e) => e.target === e.currentTarget && setSelectedBooking(null)}
        >
          <div className="w-full max-w-[440px] rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.25)]">

            {/* Header */}
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <UserAvatar name={selectedBooking.user.name ?? selectedBooking.user.firstName ?? selectedBooking.user.email} size={56} />
                <div>
                  <p className="text-[1.05rem] font-black text-[var(--ink)]">
                    {selectedBooking.user.name ?? selectedBooking.user.firstName ?? selectedBooking.user.email}
                  </p>
                  <p className="text-[0.82rem] font-semibold text-[var(--text-muted)]">
                    {selectedBooking.user.userName ? `@${selectedBooking.user.userName}` : selectedBooking.user.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-muted)] hover:bg-[var(--accent-soft)] transition-colors"
              >
                <X className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </div>

            {/* Meta rows */}
            <div className="mb-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-[var(--surface-soft)] px-3 py-2.5 text-[0.84rem] font-semibold text-[var(--text-secondary)]">
                <User className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                Member since {new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(selectedBooking.user.createdAt))}
              </div>
              {selectedBooking.user.location && (
                <div className="flex items-center gap-2 rounded-xl bg-[var(--surface-soft)] px-3 py-2.5 text-[0.84rem] font-semibold text-[var(--text-secondary)]">
                  <MapPin className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                  {selectedBooking.user.location}
                </div>
              )}
            </div>

            {/* Verification */}
            <div className="mb-4">
              <p className="mb-2 text-[0.75rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Verification</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Identity", value: selectedBooking.user.identityVerified || selectedBooking.user.idVerified },
                  { label: "Contact", value: selectedBooking.user.contactVerified },
                  { label: "Address", value: selectedBooking.user.addressVerified },
                  { label: "Meetup", value: selectedBooking.user.meetupVerified },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[0.8rem] font-bold ${
                      item.value
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-muted)]"
                    }`}
                  >
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Session details */}
            <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5">
              <p className="mb-2 text-[0.75rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Session Request</p>
              <div className="flex flex-col gap-1.5 text-[0.84rem] text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--ink)]">Format:</span>
                  {selectedBooking.sessionFormat === "VIDEO" ? "Video call" : "In-person"}
                </div>
                {selectedBooking.scheduledAt && (
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                    {new Date(selectedBooking.scheduledAt).toLocaleString()}
                  </div>
                )}
                {selectedBooking.goals && (
                  <p className="mt-1 leading-6">&ldquo;{selectedBooking.goals}&rdquo;</p>
                )}
              </div>
            </div>

            {/* Message */}
            <div className="mb-4">
              <textarea
                rows={2}
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder="Write a message to this learner…"
                className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
              />
              {msgError && (
                <p className="mt-1 text-xs font-semibold text-[var(--danger)]">{msgError}</p>
              )}
              <button
                type="button"
                onClick={handleMessage}
                disabled={!msgText.trim() || msgSending}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--surface-soft)] border border-[var(--border)] py-2.5 text-sm font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)] disabled:opacity-50"
              >
                {msgSending ? <Loader className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                {msgSending ? "Sending…" : "Send Message"}
              </button>
            </div>

            {/* Accept / Decline — only for pending */}
            {selectedBooking.status === "pending" && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleStatusUpdate(selectedBooking.id, "confirmed")}
                  disabled={actingBookingId === selectedBooking.id}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--primary)] py-3 text-sm font-extrabold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-60"
                >
                  {actingBookingId === selectedBooking.id
                    ? <Loader className="h-4 w-4 animate-spin" />
                    : "Accept Request"}
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusUpdate(selectedBooking.id, "cancelled")}
                  disabled={actingBookingId === selectedBooking.id}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--border)] py-3 text-sm font-bold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-soft)] disabled:opacity-60"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
