"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, Clock, Loader, Pencil, Star, ToggleLeft, ToggleRight, User, X } from "lucide-react";
import CategoryPicker from "@/components/dashboard/CategoryPicker";
import { getCategoryForSub } from "@/lib/categories";

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Mentor> & { tagsInput?: string }>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

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

  const openEdit = () => {
    if (!mentor) return;
    setEditForm({
      name: mentor.name,
      specialty: mentor.specialty,
      category: mentor.category,
      subcategories: Array.isArray(mentor.subcategories) ? mentor.subcategories : [],
      bio: mentor.bio,
      pricePerSession: mentor.pricePerSession,
      responseTime: mentor.responseTime,
      tagsInput: Array.isArray(mentor.tags) ? mentor.tags.join(", ") : "",
    });
    setEditError("");
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    setSavingEdit(true);
    setEditError("");
    try {
      const tags = (editForm.tagsInput ?? "").split(",").map((t) => t.trim()).filter(Boolean);
      const res = await fetch("/api/mentors/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, tags, tagsInput: undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setEditError(data.error ?? "Failed to save");
        return;
      }
      const updated = await res.json();
      setMentor(updated);
      setShowEditModal(false);
    } finally {
      setSavingEdit(false);
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

  const initials = mentor.name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

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
          Manage your mentor profile, toggle availability, and review incoming session bookings.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Profile card */}
        <div className="rounded-[1.25rem] border border-(--border) bg-(--surface) p-5 shadow-[0_12px_40px_rgba(12,32,30,0.07)]">
          <div className="mb-4 flex items-start justify-between">
            <p className="text-sm font-extrabold text-(--ink)">Profile</p>
            <button
              type="button"
              onClick={openEdit}
              className="flex items-center gap-1.5 rounded-full border border-(--border) px-3 py-1.5 text-xs font-bold text-(--primary) transition-colors hover:bg-(--primary-soft)"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          </div>

          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-(--primary-soft) text-2xl font-black text-(--primary)">
              {initials || <User className="h-7 w-7" />}
            </div>
            <div>
              <p className="font-black text-(--ink)">{mentor.name}</p>
              <p className="text-sm text-(--text-muted)">@{mentor.handle}</p>
              <p className="text-sm text-(--text-secondary)">{mentor.specialty} · {mentor.category}</p>
            </div>
          </div>

          <p className="mb-4 text-sm leading-6 text-(--text-secondary)">{mentor.bio}</p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Rating", value: `${Number(mentor.rating).toFixed(1)} / 5.0`, icon: <Star className="h-3.5 w-3.5" /> },
              { label: "Sessions", value: String(mentor.sessions), icon: <User className="h-3.5 w-3.5" /> },
              { label: "Price / session", value: `৳${mentor.pricePerSession}`, icon: null },
              { label: "Response time", value: mentor.responseTime, icon: <Clock className="h-3.5 w-3.5" /> },
            ].map((row) => (
              <div key={row.label} className="rounded-xl border border-(--border) bg-(--surface-soft) p-3">
                <p className="mb-0.5 text-[0.65rem] font-extrabold uppercase tracking-widest text-(--text-muted)">{row.label}</p>
                <p className="flex items-center gap-1 text-sm font-bold text-(--ink)">
                  {row.icon && <span className="text-(--primary)">{row.icon}</span>}
                  {row.value}
                </p>
              </div>
            ))}
          </div>

          {Array.isArray(mentor.tags) && mentor.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {mentor.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-(--primary-soft) px-3 py-1 text-xs font-bold text-(--primary)">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Availability + stats */}
        <div className="flex flex-col gap-4">
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

      {/* Edit profile modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(12,32,30,0.8)] p-4 backdrop-blur-xs"
          onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
        >
          <div className="scrollbar-thin relative max-h-[90vh] w-full max-w-130 overflow-y-auto rounded-3xl bg-(--surface) p-8 shadow-[0_40px_100px_rgba(0,0,0,0.3)]">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-(--surface-soft) text-sm text-(--text-secondary) transition-colors hover:bg-(--accent-soft)"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>

            <p className="mb-1 text-xl font-black text-(--ink)">Edit Mentor Profile</p>
            <p className="mb-6 text-sm leading-6 text-(--text-secondary)">Update your profile details.</p>

            {editError && (
              <div className="mb-4 rounded-xl border border-(--danger)/20 bg-(--danger-soft) px-4 py-3 text-sm font-semibold text-(--danger)">
                {editError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {[
                { key: "name", label: "Display Name", type: "text" },
                { key: "specialty", label: "Specialty", type: "text" },
                { key: "responseTime", label: "Response Time", type: "text" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-(--text-muted)">{label}</label>
                  <input
                    type={type}
                    value={(editForm as Record<string, string | number>)[key] as string ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-sm font-semibold text-(--ink) focus:border-(--primary) focus:outline-none"
                  />
                </div>
              ))}

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-(--text-muted)">Expertise Areas</label>
                <CategoryPicker
                  mode="multi"
                  value={editForm.subcategories ?? []}
                  onChange={(v) =>
                    setEditForm((f) => ({
                      ...f,
                      subcategories: v,
                      category: v.length > 0 ? getCategoryForSub(v[0]) : f.category,
                    }))
                  }
                  disabled={savingEdit}
                  placeholder="Select your expertise areas"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-(--text-muted)">Bio</label>
                <textarea
                  rows={3}
                  value={editForm.bio ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  className="w-full resize-none rounded-xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-sm font-semibold text-(--ink) focus:border-(--primary) focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-(--text-muted)">Price / Session (BDT)</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.pricePerSession ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, pricePerSession: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-sm font-semibold text-(--ink) focus:border-(--primary) focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-(--text-muted)">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.tagsInput ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, tagsInput: e.target.value }))}
                  className="w-full rounded-xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-sm font-semibold text-(--ink) focus:border-(--primary) focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={saveEdit}
                disabled={savingEdit}
                className="mt-2 flex items-center justify-center gap-2 rounded-full bg-(--primary) py-3.5 text-sm font-extrabold text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-60"
              >
                {savingEdit ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={2.5} />}
                {savingEdit ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
