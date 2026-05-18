"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, CalendarClock, GraduationCap, Package, X } from "lucide-react";

interface Mentor {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  specialty: string;
  category: string;
  rating: number;
  sessions: number;
  price: number;
  available: boolean;
  bio: string;
  tags: string[];
  responseTime: string;
}

const CATEGORIES = ["All", "Cameras", "Tech & Electronics", "Musical Instruments", "Tools & Equipment"];

function StarIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  const sizeClass = size === 56 ? "h-14 w-14 text-[19px]" : size === 48 ? "h-12 w-12 text-[16px]" : "h-9 w-9 text-[12px]";

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3b2a80bb,#3b2a80)] font-black text-white shadow-[0_2px_8px_rgba(59,42,128,0.4)] ${sizeClass}`}
    >
      {initials}
    </div>
  );
}

function BookingModal({ mentor, onClose }: { mentor: Mentor; onClose: () => void }) {
  const [mode, setMode] = useState<"video" | "in-person">("video");
  const [scheduledAt, setScheduledAt] = useState("");
  const [goals, setGoals] = useState("");
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/mentors/${mentor.id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionFormat: mode,
          scheduledAt: scheduledAt || null,
          goals: goals || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to book session");
        return;
      }
      setBooked(true);
    } catch {
      setError("Failed to book session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,6,28,0.75)] backdrop-blur-[6px]"
      onClick={(e) => e.target === e.currentTarget && !booked && onClose()}
    >
      <div className="relative w-[460px] rounded-3xl bg-white p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--text-muted)] hover:bg-[var(--border)] transition-colors"
        >
          <X className="h-4 w-4" strokeWidth={2.4} />
        </button>

        {booked ? (
          <div className="py-2 text-center">
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#059669,#10b981)] text-white"
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 className="mb-2 text-[1.3rem] font-black tracking-tight text-[var(--ink)]">Session Booked!</h2>
            <p className="mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
              <strong className="text-[var(--primary)]">{mentor.name}</strong> will reach out to confirm your{" "}
              {mode === "video" ? "video call" : "in-person"} session details.
            </p>
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              Session confirmed · ৳{mentor.price} charged at checkout
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-[var(--ink)] px-8 py-3 text-sm font-black text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3">
              <Avatar initials={mentor.avatar} size={48} />
              <div className="flex-1">
                <p className="font-black text-[var(--ink)]">{mentor.name}</p>
                <p className="mt-0.5 text-[0.78rem] text-[var(--text-muted)]">{mentor.specialty}</p>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-[var(--amber)]"><StarIcon size={11} /></span>
                  <span className="text-[0.78rem] font-bold text-[var(--ink)]">{mentor.rating}</span>
                  <span className="text-[var(--border)] text-xs">·</span>
                  <span className="text-[0.75rem] text-[var(--text-muted)]">{mentor.sessions} sessions</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-[1.1rem] font-black text-[var(--primary)]">৳{mentor.price}</p>
                <p className="text-[0.7rem] text-[var(--text-muted)]">per session</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[0.78rem] font-bold text-[var(--ink)]">Session Format</label>
              <div className="grid grid-cols-2 gap-2">
                {([["video", "Video Call", "Remote via Zoom or Meet"], ["in-person", "In-Person", "Meet at a nearby location"]] as const).map(([val, label, sub]) => (
                  <button
                    key={val}
                    onClick={() => setMode(val)}
                    className={`rounded-2xl border-2 p-3.5 text-left transition-all ${
                      mode === val ? "border-[#3b2a80] bg-[#f2effa]" : "border-[rgba(74,123,127,0.35)] bg-[#f7f6fb]"
                    }`}
                  >
                    <p className={`mb-0.5 text-[0.85rem] font-black ${mode === val ? "text-[#3b2a80]" : "text-[#1b1530]"}`}>{label}</p>
                    <p className="text-[0.73rem] leading-snug text-[var(--text-muted)]">{sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-[0.78rem] font-bold text-[var(--ink)]">Preferred Date & Time</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-xl border border-[rgba(180,165,230,0.4)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--ink)] outline-none"
              />
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-[0.78rem] font-bold text-[var(--ink)]">
                What do you want to learn?{" "}
                <span className="font-normal text-[var(--text-muted)]">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="e.g. I want to learn manual focus and how to shoot in low light…"
                className="w-full resize-none rounded-xl border border-[rgba(180,165,230,0.4)] bg-[var(--surface-soft)] px-4 py-3 text-[0.82rem] text-[var(--ink)] outline-none"
              />
            </div>

            {error && (
              <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-[0.8rem] text-red-600">{error}</p>
            )}

            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[0.78rem] text-emerald-700">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              {mentor.name} is available — {mentor.responseTime.split("replies in ")[1] ? `responds within ${mentor.responseTime.split("replies in ")[1]}` : mentor.responseTime}
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full rounded-full bg-[linear-gradient(135deg,#3b2a80,#31236a)] py-3.5 text-[0.92rem] font-black text-white shadow-[0_8px_24px_rgba(47,35,106,0.28)] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Booking…" : `Confirm Session · ৳${mentor.price}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MentorCard({ mentor, onBook }: { mentor: Mentor; onBook: (m: Mentor) => void }) {
  return (
    <div
      className="flex flex-col gap-3.5 rounded-[18px] border border-[rgba(180,165,230,0.22)] bg-white p-[1.35rem] shadow-[0_2px_8px_rgba(12,32,30,0.04),0_8px_24px_rgba(47,35,106,0.06)] transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_4px_16px_rgba(12,32,30,0.06),0_20px_48px_rgba(47,35,106,0.12)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <Avatar initials={mentor.avatar} size={56} />
            <div
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${mentor.available ? "bg-[#059669]" : "bg-[#9489b8]"}`}
            />
          </div>
          <div>
            <p className="font-black text-[0.95rem] leading-tight text-[var(--ink)]">{mentor.name}</p>
            <p className="mt-0.5 text-[0.75rem] text-[var(--text-muted)]">{mentor.handle}</p>
            <p className="mt-1 text-[0.8rem] font-semibold text-[var(--text-secondary)]">{mentor.specialty}</p>
          </div>
        </div>
        <span
          className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[0.68rem] font-black ${
            mentor.available ? "bg-[#d1fae5] text-[#059669]" : "bg-[#f2effa] text-[#9489b8]"
          }`}
        >
          {mentor.available ? "● Available" : "● Busy"}
        </span>
      </div>

      <p className="text-[0.78rem] leading-relaxed text-[var(--text-muted)]">{mentor.bio}</p>

      <div className="flex flex-wrap gap-1.5">
        {mentor.tags.map((t) => (
          <span key={t} className="rounded-full bg-[var(--surface-soft)] px-2 py-[2px] text-[0.68rem] font-bold text-[var(--purple-500)]">
            {t}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[var(--amber)]"><StarIcon size={12} /></span>
            <span className="text-[0.82rem] font-bold text-[var(--ink)]">{mentor.rating}</span>
          </div>
          <span className="text-[var(--border)]">·</span>
          <span className="text-[0.75rem] text-[var(--text-muted)]">{mentor.sessions} sessions</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[0.95rem] font-black text-[var(--ink)]">
            ৳{mentor.price}
            <span className="text-[0.72rem] font-medium text-[var(--text-muted)]">/session</span>
          </span>
          {mentor.available && (
            <button
              onClick={() => onBook(mentor)}
              className="rounded-full bg-[var(--primary)] px-4 py-1.5 text-[0.78rem] font-bold text-white transition-colors hover:bg-[var(--purple-500)]"
            >
              Book
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MentorsPage() {
  const [allMentors, setAllMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [bookingMentor, setBookingMentor] = useState<Mentor | null>(null);

  useEffect(() => {
    fetch("/api/mentors")
      .then((r) => r.json())
      .then((data: Record<string, unknown>[]) => {
        setAllMentors(
          data.map((m) => ({
            id: m.id as string,
            name: m.name as string,
            handle: m.handle as string,
            avatar: m.avatar as string,
            specialty: m.specialty as string,
            category: m.category as string,
            bio: m.bio as string,
            tags: Array.isArray(m.tags) ? (m.tags as string[]) : [],
            rating: Number(m.rating),
            sessions: m.sessions as number,
            price: m.pricePerSession as number,
            available: m.available as boolean,
            responseTime: m.responseTime as string,
          })),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = allMentors.filter((m) => {
    const matchCat = filter === "All" || m.category === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.specialty.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const avgRating = filtered.length
    ? (filtered.reduce((s, m) => s + m.rating, 0) / filtered.length).toFixed(1)
    : "—";

  return (
    <div className="mx-auto max-w-[1100px]">
      {/* Hero */}
      <div
        className="relative mb-7 overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#12082e,#3b2a80)] p-8"
      >
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/[0.04]" />
        <div className="absolute bottom-[-30px] right-20 h-28 w-28 rounded-full bg-[rgba(59,42,128,0.2)]" />
        <div className="relative z-10">
          <div className="mb-2.5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/12 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
            </div>
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-white/60">Item Mentor System</span>
          </div>
          <h1 className="mb-2 text-[1.9rem] font-black leading-tight tracking-[-0.04em] text-white">Learn from an Expert</h1>
          <p className="mb-5 max-w-[480px] text-[0.88rem] leading-relaxed text-white/65">
            Borrowing a complex item? Book a mentor alongside it — a certified expert who&apos;ll guide you through a short hands-on tutorial, in-person or via video call.
          </p>
          <div className="flex flex-wrap gap-6">
            {["30–60 min sessions", "In-person or video", "Vetted & rated experts"].map((label) => (
              <div key={label} className="flex items-center gap-2 text-[0.8rem] font-semibold text-white/75">
                <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-[rgba(180,165,230,0.35)] bg-white px-4 py-2.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9489b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, skill, or tag…"
            className="w-full bg-transparent text-[0.85rem] text-[var(--ink)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full px-4 py-1.5 text-[0.8rem] font-semibold transition-all ${
                filter === c
                  ? "border border-transparent bg-[var(--primary)] text-white shadow-[0_4px_12px_rgba(47,35,106,0.3)]"
                  : "border border-[rgba(180,165,230,0.4)] bg-white text-[var(--text-secondary)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-5 flex gap-6 text-[0.8rem] font-semibold text-[var(--text-muted)]">
        <span><strong className="text-[var(--ink)]">{filtered.length}</strong> mentors available</span>
        <span><strong className="text-[var(--ink)]">{filtered.filter((m) => m.available).length}</strong> online now</span>
        <span>Avg rating <strong className="text-[var(--ink)]">{avgRating}</strong></span>
      </div>

      {/* Mentor grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[240px] animate-pulse rounded-[18px] bg-[var(--surface-soft)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[var(--text-muted)]">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-soft)] text-[var(--border)]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
          </div>
          <p className="font-black text-[var(--ink)]">No mentors found</p>
          <p className="mt-1 text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} onBook={setBookingMentor} />
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="mt-7 rounded-[20px] border border-[rgba(180,165,230,0.2)] bg-white p-7 shadow-[0_2px_8px_rgba(15,10,46,0.03)]">
        <h3 className="mb-5 text-[0.95rem] font-black tracking-tight text-[var(--ink)]">How the Mentor System Works</h3>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {[
            { Icon: Package, title: "Borrow an item", sub: "Choose any complex item — camera, drone, instrument, or tool" },
            { Icon: GraduationCap, title: "Add a mentor", sub: "Select an expert mentor to join your borrow at checkout" },
            { Icon: CalendarClock, title: "Schedule session", sub: "Pick in-person or video call, choose a time that works for you" },
            { Icon: BadgeCheck, title: "Learn & create", sub: "Your mentor guides you through everything in 30–60 minutes" },
          ].map(({ Icon, title, sub }) => (
            <div key={title} className="text-center">
              <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--surface-soft)] text-[var(--primary)]">
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <p className="mb-1 text-[0.85rem] font-black text-[var(--ink)]">{title}</p>
              <p className="text-[0.76rem] leading-snug text-[var(--text-muted)]">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {bookingMentor && (
        <BookingModal mentor={bookingMentor} onClose={() => setBookingMentor(null)} />
      )}
    </div>
  );
}
