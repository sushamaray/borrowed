"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
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
} from "lucide-react";

export default function DashboardPage() {
  // Mock data - replace with real API data
  const userStats = {
    itemsCount: 8,
    borrowsCount: 3,
    messagesCount: 2,
    cartCount: 0,
    activeBorrows: [
      { id: 1, item: "Camera", from: "Mike Davis", dueIn: 1, dueDate: "Today", status: "due-today" },
      { id: 2, item: "Tent", from: "Alex Smith", dueIn: 3, dueDate: "Apr 30", status: "due-soon" },
      { id: 3, item: "MacBook Pro", from: "Sarah Chen", dueIn: 7, dueDate: "May 4", status: "safe" },
    ],
  };

  const categories = [
    { id: 1, name: "Tech & Electronics", icon: Laptop, accentColor: "#3b2a80" },
    { id: 2, name: "Sports & Outdoors", icon: Dumbbell, accentColor: "#059669" },
    { id: 3, name: "Home & Garden", icon: Home, accentColor: "#d97706" },
    { id: 4, name: "Books & Media", icon: BookMarked, accentColor: "#dc2626" },
    { id: 5, name: "Vehicles & Transport", icon: Truck, accentColor: "#2563eb" },
    { id: 6, name: "Tools & Equipment", icon: Wrench, accentColor: "#7c3aed" },
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
      {/* PRIORITY 1: Alert Banner - Due Items */}
      {dueTodayCount > 0 && (
        <div
          className="rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] overflow-hidden shadow-md"
        >
          <div className="px-6 py-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg"
                style={{ backgroundColor: "var(--danger)", color: "white" }}
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
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: "var(--danger)",
                color: "white",
              }}
            >
              Return Item
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
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
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
        <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-6 py-4">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Active Borrows</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {sortedBorrows.length} items you're currently borrowing
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {sortedBorrows.map((borrow) => (
            <BorrowRow key={borrow.id} borrow={borrow} />
          ))}
        </div>
        {sortedBorrows.length > 0 && (
          <div className="px-6 py-3 bg-[var(--surface-soft)] border-t border-[var(--border)]">
            <Link
              href="/dashboard/my-borrows"
              className="text-sm font-semibold transition-colors"
              style={{ color: "var(--primary)" }}
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
                accentColor={category.accentColor}
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
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-200 hover:shadow-md hover:border-[var(--primary)]/30"
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
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: "var(--primary-soft)", color: "var(--primary)" }}
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case "due-today":
        return { bg: "var(--danger-soft)", text: "var(--danger)" };
      case "due-soon":
        return { bg: "var(--warning-soft)", text: "var(--warning)" };
      case "safe":
        return { bg: "var(--success-soft)", text: "var(--success)" };
      default:
        return { bg: "var(--surface-soft)", text: "var(--text-secondary)" };
    }
  };

  const status = getStatusColor(borrow.status);
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
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ backgroundColor: status.bg, color: status.text }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: status.text }}
          ></span>
          {statusLabel}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-soft)]"
            title="Return item"
            style={{ color: "var(--primary)" }}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-soft)]"
            title="Extend borrow period"
            style={{ color: "var(--primary)" }}
          >
            <Clock className="h-4 w-4" />
          </button>
          <button
            className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-soft)]"
            title="Message lender"
            style={{ color: "var(--primary)" }}
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
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: status === "completed" ? "var(--success-soft)" : "var(--primary-soft)",
        }}
      >
        {status === "completed" ? (
          <CheckCircle2 className="h-4 w-4" style={{ color: "var(--success)" }} />
        ) : (
          <Circle className="h-4 w-4 animate-pulse" style={{ color: "var(--primary)" }} />
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
  accentColor,
}: {
  name: string;
  icon: React.ElementType;
  accentColor: string;
}) {
  return (
    <button
      className="group relative overflow-hidden rounded-xl p-6 text-left transition-all duration-300 hover:shadow-lg focus:outline-none"
      style={{
        backgroundColor: `${accentColor}08`,
        border: `2px solid ${accentColor}`,
      }}
    >
      {/* Glowy hover effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: accentColor,
          filter: "blur(20px)",
          zIndex: -1,
          opacity: 0.05,
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110"
          style={{
            backgroundColor: `${accentColor}15`,
            color: accentColor,
          }}
        >
          <IconComponent className="h-7 w-7" />
        </div>
        <div>
          <p className="font-semibold text-sm text-[var(--foreground)] leading-snug">
            {name}
          </p>
          <p
            className="text-xs mt-2 group-hover:font-medium transition-all duration-300 flex items-center justify-center gap-1"
            style={{ color: accentColor }}
          >
            Browse
            <span className="group-hover:translate-x-0.5 transition-transform duration-300">→</span>
          </p>
        </div>
      </div>
    </button>
  );
}
