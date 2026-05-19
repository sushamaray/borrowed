"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader, ToggleLeft, ToggleRight, User } from "lucide-react";

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
    email: string;
    profilePicture: string | null;
    image: string | null;
  };
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-(--warning-soft) text-(--warning)",
  confirmed: "bg-(--success-soft) text-(--success)",
  cancelled: "bg-(--danger-soft) text-(--danger)",
  completed: "bg-(--surface-soft) text-(--text-muted)",
};


export default function MentorDashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

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
              const bookerInitials = bookerName.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
              return (
                <div key={booking.id} className="flex items-start gap-4 rounded-xl border border-(--border) bg-(--surface-soft) p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--primary-soft) text-sm font-black text-(--primary)">
                    {bookerInitials || <User className="h-4 w-4" />}
                  </div>
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
                      <p className="mt-1 line-clamp-2 text-sm text-(--text-secondary)">{booking.goals}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
