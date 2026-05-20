"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Clock,
  MessageCircle,
  GraduationCap,
  Home,
  Package,
  X,
  Zap,
} from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

function typeIcon(type: string) {
  const cls = "h-4 w-4 flex-shrink-0";
  switch (type) {
    case "emergency_request":  return <Zap className={cls} />;
    case "return_reminder":    return <Clock className={cls} />;
    case "new_message":        return <MessageCircle className={cls} />;
    case "mentor_confirmed":   return <GraduationCap className={cls} />;
    case "new_borrow_request":
    case "borrow_accepted":    return <Home className={cls} />;
    default:                   return <Package className={cls} />;
  }
}

function typeColor(type: string): string {
  switch (type) {
    case "emergency_request":  return "text-orange-600";
    case "return_reminder":    return "text-amber-600";
    case "new_message":        return "text-blue-600";
    case "mentor_confirmed":   return "text-purple-600";
    case "new_borrow_request":
    case "borrow_accepted":    return "text-emerald-600";
    default:                   return "text-violet-600";
  }
}

function iconBg(type: string): string {
  if (type === "emergency_request") return "bg-orange-50";
  return "bg-(--primary-soft)";
}

function unreadBar(type: string): string {
  if (type === "emergency_request") return "bg-orange-500";
  return "bg-(--primary)";
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {}
  }

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function handleClick(n: Notification) {
    if (!n.read) await markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  const displayCount = unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--border)] hover:text-[var(--foreground)]"
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {displayCount && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[0.58rem] font-black text-white leading-none">
            {displayCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-11 z-50 w-[360px] overflow-hidden rounded-2xl border border-(--border) bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-(--foreground)">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-(--primary) px-2 py-0.5 text-[0.65rem] font-black text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-(--text-muted) transition-colors hover:text-(--foreground)"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto scrollbar-dark">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-(--text-muted)">
                <Bell className="mb-2 h-8 w-8" />
                <p className="text-xs font-semibold">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-(--surface-soft)"
                >
                  {/* Unread indicator */}
                  {!n.read && (
                    <span className={`absolute left-0 top-0 h-full w-[3px] rounded-r-full ${unreadBar(n.type)}`} />
                  )}
                  {/* Icon */}
                  <div
                    className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${iconBg(n.type)} ${typeColor(n.type)}`}
                  >
                    {typeIcon(n.type)}
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className={`text-[0.8rem] font-bold leading-snug ${n.read ? "text-(--text-muted)" : "text-(--foreground)"}`}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 truncate text-[0.72rem] text-(--text-muted) leading-snug">
                      {n.body}
                    </p>
                  </div>
                  {/* Time */}
                  <span className="mt-0.5 flex-shrink-0 text-[0.65rem] text-(--text-muted)">
                    {relativeTime(n.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-(--border) px-4 py-2.5">
              <button
                onClick={markAllRead}
                className="w-full text-center text-[0.72rem] font-semibold text-(--text-muted) transition-colors hover:text-(--text-secondary)"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
