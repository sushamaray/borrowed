"use client";

import { useState } from "react";
import { Search, ShieldAlert } from "lucide-react";
import type { UserListItem } from "@/lib/admin/users/types";

type Filter = "All" | "Verified" | "Unverified" | "Admins";

function DnaStrip({ verifications }: { verifications: UserListItem["verifications"] }) {
  const slots = [
    verifications.identity,
    verifications.contact,
    verifications.id,
    verifications.address,
    verifications.meetup,
  ];
  return (
    <div className="flex gap-0.5">
      {slots.map((done, i) => (
        <div
          key={i}
          className={`h-2 w-4 rounded-sm ${done ? "bg-[#6d5bba]" : "bg-white/15"}`}
        />
      ))}
    </div>
  );
}

function RiskBadge({ disputeCount }: { disputeCount: number }) {
  if (disputeCount === 0) {
    return (
      <span className="text-[0.58rem] font-extrabold rounded-full px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400">
        Clean
      </span>
    );
  }
  return (
    <span className="text-[0.58rem] font-extrabold rounded-full px-1.5 py-0.5 bg-amber-500/20 text-amber-400">
      {disputeCount}d
    </span>
  );
}

function UserCard({
  u,
  active,
  onClick,
}: {
  u: UserListItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 transition-all duration-150 border-l-2 ${
        active
          ? "bg-[rgba(91,61,191,0.35)] border-[#6d5bba]"
          : "border-transparent hover:bg-[var(--sidebar-hover-bg)]"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="h-8 w-8 rounded-lg bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] flex items-center justify-center text-white text-[0.65rem] font-black shrink-0 shadow-md">
          {u.initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[0.78rem] font-bold text-[var(--sidebar-fg)] truncate flex-1">
              {u.name}
            </span>
            {u.isAdmin && (
              <ShieldAlert className="h-3 w-3 text-red-400 shrink-0" />
            )}
            <RiskBadge disputeCount={u.counts.disputes} />
          </div>

          {/* Email */}
          <p className="text-[0.67rem] text-[var(--sidebar-muted)] truncate mb-1.5">
            {u.email}
          </p>

          {/* DNA + score */}
          <div className="flex items-center justify-between">
            <DnaStrip verifications={u.verifications} />
            <span
              className={`text-[0.65rem] font-extrabold ml-2 shrink-0 ${
                u.trustScore >= 80
                  ? "text-emerald-400"
                  : u.trustScore >= 40
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {u.trustScore}%
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function UserQueue({
  users,
  selectedId,
  onSelect,
}: {
  users: UserListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = users.filter((u) => {
    if (filter === "Verified"   && u.trustScore < 100)   return false;
    if (filter === "Unverified" && u.trustScore >= 100)  return false;
    if (filter === "Admins"     && !u.isAdmin)           return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.location ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const adminCount = users.filter((u) => u.isAdmin).length;

  return (
    <div className="flex flex-col h-full bg-[linear-gradient(175deg,#12082e_0%,#180b3a_60%,#130930_100%)]">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-[var(--sidebar-border)] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-[var(--sidebar-fg)]">Users</span>
          <span className="text-[0.62rem] font-extrabold bg-[var(--primary)]/20 text-[#9b8be0] rounded-full px-2 py-0.5">
            {users.length} total
          </span>
        </div>
        <div className="flex items-center gap-2 bg-[var(--sidebar-hover-bg)] border border-[var(--sidebar-border)] rounded-lg px-3 py-1.5">
          <Search className="h-3 w-3 text-[var(--sidebar-muted)] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="flex-1 bg-transparent text-[0.76rem] text-[var(--sidebar-fg)] placeholder:text-[var(--sidebar-muted)] outline-none"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-[var(--sidebar-border)]">
        {(["All", "Verified", "Unverified", "Admins"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 text-[0.62rem] font-bold transition-all duration-150 border-b-2 ${
              filter === f
                ? "text-[var(--sidebar-fg)] border-[#6d5bba]"
                : "text-[var(--sidebar-muted)] border-transparent hover:text-[var(--sidebar-fg)]/70"
            }`}
          >
            {f === "Admins" ? `Admins${adminCount > 0 ? ` (${adminCount})` : ""}` : f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.map((u, i) => (
          <div key={u.id}>
            <UserCard u={u} active={selectedId === u.id} onClick={() => onSelect(u.id)} />
            {i < filtered.length - 1 && <div className="mx-3 h-px bg-[var(--sidebar-border)]" />}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-[var(--sidebar-muted)] text-sm">No users found</div>
        )}
      </div>
    </div>
  );
}
