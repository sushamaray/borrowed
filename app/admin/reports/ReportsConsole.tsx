"use client";

import { useState, useEffect } from "react";
import { Flag, ChevronDown, ChevronUp, CheckCircle, XCircle, BookOpen } from "lucide-react";
import toast from "react-hot-toast";

const REASON_LABELS: Record<string, string> = {
  spam:          "Spam",
  scam:          "Scam / Fraud",
  harassment:    "Harassment",
  fake_listing:  "Fake Listing",
  inappropriate: "Inappropriate Content",
  other:         "Other",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: "bg-amber-50",  text: "text-amber-700", label: "Pending"   },
  reviewed:  { bg: "bg-blue-50",   text: "text-blue-700",  label: "Reviewed"  },
  dismissed: { bg: "bg-gray-100",  text: "text-gray-500",  label: "Dismissed" },
};

type Report = {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  readByAdmin: boolean;
  createdAt: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedName: string;
};

type Filter = "all" | "pending" | "reviewed" | "dismissed";

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "bg-gray-100", text: "text-gray-500", label: status };
  return (
    <span className={`text-[0.65rem] font-extrabold rounded-full px-2.5 py-0.5 ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function ReportRow({
  report,
  onStatusChange,
  onMarkRead,
}: {
  report: Report;
  onStatusChange: (id: string, status: "reviewed" | "dismissed") => void;
  onMarkRead: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  function handleExpand() {
    if (!expanded && !report.readByAdmin) {
      onMarkRead(report.id);
      fetch(`/api/admin/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readByAdmin: true }),
      }).catch(() => {});
    }
    setExpanded((v) => !v);
  }

  async function setStatus(status: "reviewed" | "dismissed") {
    setPending(status);
    try {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        onStatusChange(report.id, status);
        toast.success(status === "reviewed" ? "Marked as reviewed" : "Report dismissed");
      } else {
        toast.error("Failed to update report");
      }
    } finally {
      setPending(null);
    }
  }

  const isUnread = !report.readByAdmin;

  return (
    <div
      className={`group relative border-b border-[var(--border)] last:border-0 transition-all duration-150
        ${isUnread ? "bg-[var(--surface)]" : "bg-[var(--surface)]"}
        hover:bg-[var(--surface-soft)]`}
    >
      {/* Unread left accent */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-r transition-all duration-150
          ${isUnread ? "bg-[var(--primary)]" : "bg-transparent group-hover:bg-[var(--border)]"}`}
      />

      {/* Main row — clickable */}
      <button
        onClick={handleExpand}
        className="w-full text-left px-5 py-4 flex items-start gap-3 focus:outline-none"
      >
        {/* Unread dot */}
        <div className="mt-1.5 shrink-0 w-4 flex items-center justify-center">
          {isUnread && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`text-sm text-[var(--ink)] ${isUnread ? "font-extrabold" : "font-semibold"}`}>
              {report.reportedName}
            </span>
            <span className="text-[0.6rem] text-[var(--text-muted)] font-medium">reported for</span>
            <span className="text-[0.65rem] font-extrabold bg-red-50 text-red-600 rounded-md px-1.5 py-0.5">
              {REASON_LABELS[report.reason] ?? report.reason}
            </span>
            {isUnread && (
              <span className="text-[0.6rem] font-extrabold bg-[var(--primary)] text-white rounded-full px-1.5 py-0.5 tracking-wide">
                NEW
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            By <span className="font-semibold text-[var(--ink)]">{report.reporterName}</span>
            {" · "}{fmtDateTime(report.createdAt)}
          </p>
          {!expanded && report.description && (
            <p className="mt-1 text-xs text-[var(--text-muted)] italic line-clamp-1">{report.description}</p>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2 ml-2">
          <StatusBadge status={report.status} />
          <span className="text-[var(--text-muted)] group-hover:text-[var(--ink)] transition-colors">
            {expanded
              ? <ChevronUp className="h-4 w-4" />
              : <ChevronDown className="h-4 w-4" />
            }
          </span>
        </div>
      </button>

      {/* Expanded detail drawer */}
      {expanded && (
        <div className="px-5 pb-4 ml-7 space-y-3">
          <div className="rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] p-4 space-y-2.5 text-sm">
            <div className="flex gap-2">
              <span className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-widest w-20 shrink-0 mt-0.5">Reported</span>
              <span className="text-[var(--ink)] font-semibold">{report.reportedName}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-widest w-20 shrink-0 mt-0.5">Reporter</span>
              <span className="text-[var(--ink)] font-semibold">{report.reporterName}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-widest w-20 shrink-0 mt-0.5">Reason</span>
              <span className="text-[var(--ink)]">{REASON_LABELS[report.reason] ?? report.reason}</span>
            </div>
            {report.description && (
              <div className="flex gap-2">
                <span className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-widest w-20 shrink-0 mt-0.5">Details</span>
                <span className="text-[var(--ink)] leading-relaxed">{report.description}</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-widest w-20 shrink-0 mt-0.5">Time</span>
              <span className="text-[var(--ink)]">{fmtDateTime(report.createdAt)}</span>
            </div>
          </div>

          {report.status === "pending" && (
            <div className="flex gap-2">
              <button
                disabled={pending !== null}
                onClick={() => setStatus("reviewed")}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 py-2 text-xs font-bold text-blue-700
                  hover:bg-blue-100 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]
                  disabled:opacity-50 transition-all duration-150"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Mark Reviewed
              </button>
              <button
                disabled={pending !== null}
                onClick={() => setStatus("dismissed")}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2 text-xs font-bold text-gray-600
                  hover:bg-gray-200 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]
                  disabled:opacity-50 transition-all duration-150"
              >
                <XCircle className="h-3.5 w-3.5" />
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportsConsole() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((r) => r.ok ? r.json() as Promise<Report[]> : Promise.reject())
      .then(setReports)
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  function handleStatusChange(id: string, status: "reviewed" | "dismissed") {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status, readByAdmin: true } : r));
  }

  function handleMarkRead(id: string) {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, readByAdmin: true } : r));
  }

  async function markAllRead() {
    const unread = reports.filter((r) => !r.readByAdmin);
    if (unread.length === 0) return;
    setMarkingAll(true);
    try {
      await Promise.all(
        unread.map((r) =>
          fetch(`/api/admin/reports/${r.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ readByAdmin: true }),
          })
        )
      );
      setReports((prev) => prev.map((r) => ({ ...r, readByAdmin: true })));
      toast.success("All reports marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  }

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  const counts = {
    all:       reports.length,
    pending:   reports.filter((r) => r.status === "pending").length,
    reviewed:  reports.filter((r) => r.status === "reviewed").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
  };

  const unreadCount = reports.filter((r) => !r.readByAdmin).length;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center relative">
            <Flag className="h-4 w-4 text-[var(--primary)]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-[var(--primary)] text-white text-[0.55rem] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--ink)] leading-tight">User Reports</h1>
            <p className="text-xs text-[var(--text-muted)]">
              {counts.all} total · {counts.pending} pending
              {unreadCount > 0 && ` · ${unreadCount} unread`}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--ink)]
              bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-1.5
              hover:shadow-sm hover:border-[var(--primary)] transition-all duration-150 disabled:opacity-50"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(["all", "pending", "reviewed", "dismissed"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-150 ${
              filter === f
                ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--ink)] hover:border-[var(--primary)]/40 hover:shadow-sm"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 opacity-70">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-[var(--surface-soft)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-12">
            {filter === "all" ? "No reports yet" : `No ${filter} reports`}
          </p>
        ) : (
          filtered.map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              onStatusChange={handleStatusChange}
              onMarkRead={handleMarkRead}
            />
          ))
        )}
      </div>
    </div>
  );
}
