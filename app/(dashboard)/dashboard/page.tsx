"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Activity,
  Package,
  BookOpen,
  Mail,
  ShoppingCart,
  RotateCcw,
  Clock,
  MessageSquare,
  Laptop,
  Dumbbell,
  Home,
  Wrench,
  Truck,
  BookMarked,
  CheckCircle2,
  Circle,
  X,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const [showEmergency, setShowEmergency] = useState(false);

  // Mock data - replace with real API data
  const userStats = {
    itemsCount: 8,
    borrowsCount: 3,
    messagesCount: 2,
    cartCount: 0,
    activeBorrows: [
      { id: 1, item: "Camera", from: "Mike Davis", dueIn: 1, dueDate: "Today", status: "due-today" as const },
      { id: 2, item: "Tent", from: "Alex Smith", dueIn: 3, dueDate: "Apr 30", status: "due-soon" as const },
      { id: 3, item: "MacBook Pro", from: "Sarah Chen", dueIn: 7, dueDate: "May 4", status: "safe" as const },
    ],
  };

  const categories = [
    { id: 1, name: "Tech & Electronics", icon: Laptop, accent: "purple" as const },
    { id: 2, name: "Sports & Outdoors", icon: Dumbbell, accent: "green" as const },
    { id: 3, name: "Home & Garden", icon: Home, accent: "amber" as const },
    { id: 4, name: "Books & Media", icon: BookMarked, accent: "red" as const },
    { id: 5, name: "Vehicles & Transport", icon: Truck, accent: "blue" as const },
    { id: 6, name: "Tools & Equipment", icon: Wrench, accent: "violet" as const },
  ];

  const activities = [
    {
      id: 1,
      title: "You added a new item",
      subtitle: "MacBook Pro 16\"",
      timestamp: "2 hours ago",
      status: "completed" as const,
    },
    {
      id: 2,
      title: "New message from Sarah",
      subtitle: "About your Camera",
      timestamp: "4 hours ago",
      status: "active" as const,
    },
    {
      id: 3,
      title: "Item returned successfully",
      subtitle: "Drill from Mike",
      timestamp: "1 day ago",
      status: "completed" as const,
    },
  ];

  // Sort borrows by urgency
  const sortedBorrows = useMemo(
    () => [...userStats.activeBorrows].sort((a, b) => a.dueIn - b.dueIn),
    [userStats.activeBorrows]
  );

  const dueTodayCount = sortedBorrows.filter(b => b.status === "due-today").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Today
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--foreground)]">
            Welcome back
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowEmergency(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--emergency),var(--emergency-end))] px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(255,69,32,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(255,69,32,0.38)] sm:w-auto"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
            <Zap className="h-4 w-4" />
          </span>
          Emergency Mode
        </button>
      </div>

      {/* PRIORITY 1: Alert Banner - Due Items */}
      {dueTodayCount > 0 && (
        <div
          className="overflow-hidden rounded-xl bg-[#ef4444] shadow-[0_20px_50px_rgba(239,68,68,0.4)]"
        >
          <div
            className="m-1 overflow-hidden rounded-xl border-2 border-white/40 bg-[linear-gradient(135deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.1)_100%)] shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] backdrop-blur-[20px]"
          >
            <div className="px-6 py-5 flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/40 bg-[linear-gradient(135deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0.15)_100%)] text-white backdrop-blur-[10px]"
                >
                  <AlertCircle className="h-6 w-6" />
                </div>
              <div>
                <h3 className="font-bold text-[var(--foreground)]">
                  {dueTodayCount} item{dueTodayCount > 1 ? "s" : ""} due today
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Return {dueTodayCount === 1 ? "it" : "them"} now to maintain your reputation
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/my-borrows"
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg border-[1.5px] border-white/40 bg-[linear-gradient(135deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0.2)_100%)] px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-[10px] transition-all duration-200 hover:bg-white/30"
            >
              Return Item
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          </div>
        </div>
      )}

      {/* PRIORITY 2: Overview Stats - Secondary Focus */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <OverviewCard
          icon={Package}
          title="My Items"
          value={userStats.itemsCount}
          subtitle="Available to lend"
          href="/dashboard/my-items"
        />
        <OverviewCard
          icon={BookOpen}
          title="Active Borrows"
          value={userStats.borrowsCount}
          subtitle={`${dueTodayCount} due today`}
          href="/dashboard/my-borrows"
        />
        <OverviewCard
          icon={Mail}
          title="Messages"
          value={userStats.messagesCount}
          subtitle="Unread"
          href="/dashboard/messages"
        />
        <OverviewCard
          icon={ShoppingCart}
          title="In Cart"
          value={userStats.cartCount}
          subtitle="Ready to borrow"
          href="/dashboard/cart"
        />
      </div>

      {/* PRIORITY 1b: Active Borrows - Main Focus */}
      <div className="rounded-lg border border-[var(--border)]/40 bg-[var(--surface)]/40 overflow-hidden shadow-sm backdrop-blur-md">
        <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-6 py-4">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Active Borrows</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {sortedBorrows.length} items you&apos;re currently borrowing
          </p>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {sortedBorrows.map((borrow) => (
            <BorrowRow key={borrow.id} borrow={borrow} />
          ))}
        </div>
        {sortedBorrows.length > 0 && (
          <div className="px-6 py-3 bg-[var(--surface-soft)] border-t border-[var(--border)]">
            <Link
              href="/dashboard/my-borrows"
              className="text-sm font-semibold text-[var(--primary)] transition-colors"
            >
              View all borrows →
            </Link>
          </div>
        )}
      </div>

      {/* PRIORITY 2b: Browse Categories - Visual Discovery */}
      <div className="pt-4">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Browse Categories</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Discover items available in your community</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <CategoryCard
                key={category.id}
                name={category.name}
                icon={IconComponent}
                accent={category.accent}
              />
            );
          })}
        </div>
      </div>

      {/* PRIORITY 3: Recent Activity - Lower Priority */}
      <div className="pt-8">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          Recent Activity
        </h3>
        <div className="space-y-2">
          {activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              title={activity.title}
              subtitle={activity.subtitle}
              timestamp={activity.timestamp}
              status={activity.status}
            />
          ))}
        </div>
      </div>

      {showEmergency && (
        <EmergencyModal onClose={() => setShowEmergency(false)} />
      )}
    </div>
  );
}

function EmergencyModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"compose" | "scanning" | "sent">("compose");
  const [item, setItem] = useState("");
  const [radius, setRadius] = useState("5km");
  const [neededBy, setNeededBy] = useState("");
  const [requestError, setRequestError] = useState("");
  const [notifiedCount, setNotifiedCount] = useState(0);
  const [recipientInitials, setRecipientInitials] = useState<string[]>([]);

  const sendEmergencyRequest = async () => {
    if (!item.trim()) return;
    setRequestError("");
    setStep("scanning");

    try {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, radius, neededBy }),
      });
      const data = await res.json() as {
        error?: string;
        notifiedCount?: number;
        recipients?: { initials: string }[];
      };

      if (!res.ok) {
        setRequestError(data.error ?? "Failed to send emergency request");
        setStep("compose");
        return;
      }

      setNotifiedCount(data.notifiedCount ?? 0);
      setRecipientInitials((data.recipients ?? []).map((recipient) => recipient.initials));
      setStep("sent");
    } catch {
      setRequestError("Network error, please try again");
      setStep("compose");
    }
  };

  const canClose = step !== "scanning";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a061c]/75 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-title"
      onClick={() => {
        if (canClose) onClose();
      }}
    >
      <div
        className="relative w-full max-w-[460px] rounded-3xl bg-white p-6 shadow-[0_40px_100px_rgba(0,0,0,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        {canClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[#e3dcf3] bg-[#f8f7fc] text-[#675d8b] transition-colors hover:bg-[#f2eefb]"
            aria-label="Close emergency request"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {step === "sent" ? (
          <div className="py-2 text-center">
            <div className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,var(--emergency),var(--emergency-end))] text-white shadow-[0_8px_24px_rgba(255,78,26,0.35)]">
              <Zap className="h-7 w-7" />
            </div>
            <h2 id="emergency-title" className="mb-2 text-[1.3rem] font-black tracking-tight text-[#18122e]">
              Request Sent
            </h2>
            <p className="mx-auto mb-5 max-w-[330px] text-sm leading-7 text-[#5a5175]">
              <strong className="text-[var(--emergency)]">{notifiedCount} nearby lender{notifiedCount === 1 ? "" : "s"}</strong>
              {" "}received a priority alert for <strong className="text-[var(--emergency)]">{item}</strong>.
            </p>
            <div className="mb-6">
              {notifiedCount > 0 ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e3dcf3] bg-[#f8f7fc] px-3 py-2">
                  <div className="flex -space-x-1.5">
                    {recipientInitials.map((name, index) => (
                      <div
                        key={`${name}-${index}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#f2eefb] text-[0.65rem] font-black text-[#3b2a80]"
                      >
                        {name}
                      </div>
                    ))}
                    {notifiedCount > recipientInitials.length && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-[0.65rem] font-black text-[#675d8b]">
                        +{notifiedCount - recipientInitials.length}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-[#675d8b]">
                    Notified lenders
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center rounded-full border border-[#e3dcf3] bg-[#f8f7fc] px-3 py-2 text-xs font-bold text-[#9187b0]">
                  No active lenders found in this radius
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#18122e] px-8 py-3 text-sm font-extrabold text-white"
            >
              Done
            </button>
          </div>
        ) : step === "scanning" ? (
          <div className="py-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2effa] text-[#5b3dbf]">
              <Activity className="h-7 w-7" />
            </div>
            <h2 id="emergency-title" className="mb-5 text-[1.1rem] font-black text-[#18122e]">
              Pinging nearby lenders
            </h2>
            <div className="h-2 overflow-hidden rounded-full bg-[#f2effa]">
              <div className="h-full w-[82%] rounded-full bg-[linear-gradient(135deg,var(--emergency),var(--emergency-end))]" />
            </div>
            <p className="mt-3 text-xs font-semibold text-[#9489b8]">
              Scanning {radius} radius for available lenders
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3 pr-8">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,var(--emergency),var(--emergency-end))] text-white shadow-[0_6px_16px_rgba(255,78,26,0.32)]">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h2 id="emergency-title" className="text-base font-black text-[#18122e]">
                  Emergency Mode
                </h2>
                <p className="text-xs font-medium text-[#9489b8]">
                  Send a priority request to lenders around you
                </p>
              </div>
            </div>

            <div className="mb-4 grid gap-3">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-[#18122e]">What do you need urgently?</span>
                <input
                  value={item}
                  onChange={(event) => setItem(event.target.value)}
                  placeholder="DSLR camera, power drill..."
                  className="w-full rounded-xl border border-[#b4a5e6]/40 bg-[#f5f3fb] px-4 py-3 text-sm text-[#18122e] outline-none transition-colors placeholder:text-[#9489b8] focus:border-[var(--emergency)]"
                />
              </label>

              <div className="grid gap-1.5">
                <span className="text-xs font-bold text-[#18122e]">Search radius</span>
                <div className="grid grid-cols-3 gap-2">
                  {["2km", "5km", "10km"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRadius(value)}
                      className={`rounded-[10px] border px-3 py-2 text-sm font-bold transition-colors ${
                        radius === value
                          ? "border-[var(--emergency)] bg-[#fff5f2] text-[var(--emergency)]"
                          : "border-[#b4a5e6]/40 bg-[#f5f3fb] text-[#5a5175]"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-[#18122e]">When do you need it?</span>
                <input
                  value={neededBy}
                  onChange={(event) => setNeededBy(event.target.value)}
                  placeholder="Within 2 hours, before 6pm"
                  className="w-full rounded-xl border border-[#b4a5e6]/40 bg-[#f5f3fb] px-4 py-3 text-sm text-[#18122e] outline-none transition-colors placeholder:text-[#9489b8] focus:border-[var(--emergency)]"
                />
              </label>
            </div>

            {requestError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {requestError}
              </div>
            )}

            <div className="mb-4 flex items-center gap-2 rounded-xl border border-[rgba(255,78,26,0.18)] bg-[#fff8f5] px-3 py-2.5 text-xs font-semibold text-[#c2410c]">
              <Zap className="h-4 w-4 flex-shrink-0" />
              Fast responders get highlighted for this request.
            </div>

            <button
              type="button"
              onClick={sendEmergencyRequest}
              disabled={!item.trim()}
              className="w-full rounded-full bg-[linear-gradient(135deg,var(--emergency),var(--emergency-end))] px-4 py-3 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(255,69,32,0.28)] transition-opacity disabled:cursor-not-allowed disabled:bg-none disabled:bg-[#f2effa] disabled:text-[#9489b8] disabled:shadow-none"
            >
              Send Emergency Request
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Inline Components
function OverviewCard({
  icon: IconComponent,
  title,
  value,
  subtitle,
  href,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-[var(--border)]/40 bg-[var(--surface)]/40 p-4 transition-all duration-200 hover:shadow-md hover:border-[var(--primary)]/30 backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {title}
          </p>
          <p className="mt-3 text-2xl font-bold text-[var(--foreground)]">{value}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{subtitle}</p>
        </div>
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]"
        >
          <IconComponent className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

function BorrowRow({
  borrow,
}: {
  borrow: {
    id: number;
    item: string;
    from: string;
    dueIn: number;
    dueDate: string;
    status: "due-today" | "due-soon" | "safe";
  };
}) {
  const getStatusClass = (status: string) => {
    switch (status) {
      case "due-today":
        return "bg-[var(--danger-soft)] text-[var(--danger)]";
      case "due-soon":
        return "bg-[var(--warning-soft)] text-[var(--warning)]";
      case "safe":
        return "bg-[var(--success-soft)] text-[var(--success)]";
      default:
        return "bg-[var(--surface-soft)] text-[var(--text-secondary)]";
    }
  };

  const status = getStatusClass(borrow.status);
  const statusLabel = borrow.status === "due-today" ? "Due today" : `Due ${borrow.dueDate}`;

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-[var(--surface-soft)]">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--foreground)]">{borrow.item}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          From <span className="font-medium">{borrow.from}</span>
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              borrow.status === "due-today" ? "bg-[var(--danger)]" : borrow.status === "due-soon" ? "bg-[var(--warning)]" : "bg-[var(--success)]"
            }`}
          ></span>
          {statusLabel}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="rounded-lg p-2 text-[var(--primary)] transition-colors hover:bg-[var(--surface-soft)]"
            title="Return item"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg p-2 text-[var(--primary)] transition-colors hover:bg-[var(--surface-soft)]"
            title="Extend borrow period"
          >
            <Clock className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg p-2 text-[var(--primary)] transition-colors hover:bg-[var(--surface-soft)]"
            title="Message lender"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({
  title,
  subtitle,
  timestamp,
  status,
}: {
  title: string;
  subtitle: string;
  timestamp: string;
  status: "completed" | "active";
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 transition-colors hover:bg-[var(--surface-soft)]">
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          status === "completed" ? "bg-[var(--success-soft)]" : "bg-[var(--primary-soft)]"
        }`}
      >
        {status === "completed" ? (
          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
        ) : (
          <Circle className="h-4 w-4 animate-pulse text-[var(--primary)]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>
      </div>
      <span className="flex-shrink-0 text-xs text-[var(--text-muted)]">{timestamp}</span>
    </div>
  );
}

function CategoryCard({
  name,
  icon: IconComponent,
  accent,
}: {
  name: string;
  icon: React.ElementType;
  accent: "purple" | "green" | "amber" | "red" | "blue" | "violet";
}) {
  const accentClasses = {
    purple: {
      card: "border-[#3b2a80] bg-[#3b2a80]/[0.03]",
      glow: "bg-[#3b2a80]",
      icon: "bg-[#3b2a80]/[0.08] text-[#3b2a80]",
      link: "text-[#3b2a80]",
    },
    green: {
      card: "border-[#059669] bg-[#059669]/[0.03]",
      glow: "bg-[#059669]",
      icon: "bg-[#059669]/[0.08] text-[#059669]",
      link: "text-[#059669]",
    },
    amber: {
      card: "border-[#d97706] bg-[#d97706]/[0.03]",
      glow: "bg-[#d97706]",
      icon: "bg-[#d97706]/[0.08] text-[#d97706]",
      link: "text-[#d97706]",
    },
    red: {
      card: "border-[#dc2626] bg-[#dc2626]/[0.03]",
      glow: "bg-[#dc2626]",
      icon: "bg-[#dc2626]/[0.08] text-[#dc2626]",
      link: "text-[#dc2626]",
    },
    blue: {
      card: "border-[#2563eb] bg-[#2563eb]/[0.03]",
      glow: "bg-[#2563eb]",
      icon: "bg-[#2563eb]/[0.08] text-[#2563eb]",
      link: "text-[#2563eb]",
    },
    violet: {
      card: "border-[#6d5bba] bg-[#6d5bba]/[0.03]",
      glow: "bg-[#6d5bba]",
      icon: "bg-[#6d5bba]/[0.08] text-[#6d5bba]",
      link: "text-[#6d5bba]",
    },
  }[accent];

  return (
    <button
      className={`group relative overflow-hidden rounded-xl border-2 p-6 text-left transition-all duration-300 hover:shadow-lg focus:outline-none ${accentClasses.card}`}
    >
      {/* Glowy hover effect */}
      <div
        className={`absolute inset-0 -z-10 rounded-xl opacity-5 blur-[20px] transition-opacity duration-300 group-hover:opacity-100 ${accentClasses.glow}`}
      />

      <div className="relative z-10 flex flex-col items-center text-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110 ${accentClasses.icon}`}
        >
          <IconComponent className="h-7 w-7" />
        </div>
        <div>
          <p className="font-semibold text-sm text-[var(--foreground)] leading-snug">
            {name}
          </p>
          <p
            className={`mt-2 flex items-center justify-center gap-1 text-xs transition-all duration-300 group-hover:font-medium ${accentClasses.link}`}
          >
            Browse
            <span className="group-hover:translate-x-0.5 transition-transform duration-300">→</span>
          </p>
        </div>
      </div>
    </button>
  );
}
