"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { DisputeListItem } from "@/lib/disputes/types";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  OPEN:         { bg: "bg-amber-500/20",   text: "text-amber-400",   label: "Open"         },
  UNDER_REVIEW: { bg: "bg-blue-500/20",    text: "text-blue-400",    label: "Reviewing"    },
  ESCALATED:    { bg: "bg-red-500/20",     text: "text-red-400",     label: "Escalated"    },
  RESOLVED:     { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Resolved"     },
  CLOSED:       { bg: "bg-white/10",       text: "text-white/40",    label: "Closed"       },
};

const VERDICT_DOT: Record<string, string> = {
  lender_favored:   "bg-amber-400",
  borrower_favored: "bg-emerald-400",
};

type Filter = "All" | "Open" | "Escalated";

function CaseCard({
  c,
  active,
  onClick,
}: {
  c: DisputeListItem;
  active: boolean;
  onClick: () => void;
}) {
  const s = STATUS_STYLES[c.status] ?? STATUS_STYLES.OPEN;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 transition-all duration-150 border-l-2 ${
        active
          ? "bg-[rgba(91,61,191,0.35)] border-[#6d5bba]"
          : "border-transparent hover:bg-[var(--sidebar-hover-bg)]"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[0.72rem] font-black text-[var(--sidebar-fg)] tracking-wide">
          #{c.id.slice(-6).toUpperCase()}
        </span>
        <span className={`text-[0.6rem] font-extrabold rounded-full px-2 py-0.5 ${s.bg} ${s.text}`}>
          {s.label}
        </span>
      </div>

      <div className="text-[0.78rem] font-semibold text-[var(--sidebar-fg)]/60 truncate mb-2">
        {c.itemName}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[var(--sidebar-muted)] text-[0.68rem]">
          <span className="bg-[var(--sidebar-hover-bg)] rounded px-1.5 py-0.5 font-bold">{c.borrower.initials}</span>
          <span>→</span>
          <span className="bg-[var(--sidebar-hover-bg)] rounded px-1.5 py-0.5 font-bold">{c.lender.initials}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {c.aiVerdict && (
            <span className={`h-2 w-2 rounded-full ${VERDICT_DOT[c.aiVerdict] ?? "bg-gray-400"}`} />
          )}
          <span className="text-[var(--sidebar-muted)] text-[0.68rem] font-bold">
            ৳{(c.depositAmount / 1000).toFixed(0)}k
          </span>
        </div>
      </div>
    </button>
  );
}

export default function CaseQueue({
  cases,
  selectedId,
  onSelect,
}: {
  cases: DisputeListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const openCount = cases.filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED").length;

  const filtered = cases.filter((c) => {
    if (filter === "Open"      && c.status !== "OPEN") return false;
    if (filter === "Escalated" && c.status !== "ESCALATED") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.itemName.toLowerCase().includes(q) ||
        c.borrower.name.toLowerCase().includes(q) ||
        c.lender.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[linear-gradient(175deg,#12082e_0%,#180b3a_60%,#130930_100%)]">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-[var(--sidebar-border)] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-[var(--sidebar-fg)]">Case Queue</span>
          <span className="text-[0.62rem] font-extrabold bg-red-500/20 text-red-400 rounded-full px-2 py-0.5">
            {openCount} open
          </span>
        </div>
        <div className="flex items-center gap-2 bg-[var(--sidebar-hover-bg)] border border-[var(--sidebar-border)] rounded-lg px-3 py-1.5">
          <Search className="h-3 w-3 text-[var(--sidebar-muted)] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases…"
            className="flex-1 bg-transparent text-[0.76rem] text-[var(--sidebar-fg)] placeholder:text-[var(--sidebar-muted)] outline-none"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-[var(--sidebar-border)]">
        {(["All", "Open", "Escalated"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 text-[0.71rem] font-bold transition-all duration-150 border-b-2 ${
              filter === f
                ? "text-[var(--sidebar-fg)] border-[#6d5bba]"
                : "text-[var(--sidebar-muted)] border-transparent hover:text-[var(--sidebar-fg)]/70"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.map((c, i) => (
          <div key={c.id}>
            <CaseCard c={c} active={selectedId === c.id} onClick={() => onSelect(c.id)} />
            {i < filtered.length - 1 && <div className="mx-3 h-px bg-[var(--sidebar-border)]" />}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-[var(--sidebar-muted)] text-sm">No cases found</div>
        )}
      </div>
    </div>
  );
}
