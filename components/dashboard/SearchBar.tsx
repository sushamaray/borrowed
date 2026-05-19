"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Sparkles, Package, ClipboardList, User2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SearchItem {
  id: string;
  title: string;
  category: string | null;
  imageUrl: string | null;
  pricePerDay: number | null;
  location: string | null;
  lenderName: string;
}

interface SearchRequest {
  id: string;
  title: string;
  category: string | null;
  neededFrom: string;
  neededUntil: string;
  budgetPerDay: number | null;
}

interface SearchUser {
  id: string;
  name: string;
  userName: string | null;
  avatarLabel: string;
  location: string | null;
  itemCount: number;
}

interface SearchResults {
  items: SearchItem[];
  requests: SearchRequest[];
  users: SearchUser[];
  aiMatched: boolean;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Click-outside closes the dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const isLongQuery = q.trim().split(/\s+/).length >= 3;
      const url = isLongQuery
        ? `/api/search?q=${encodeURIComponent(q)}&limit=4&ai=true`
        : `/api/search?q=${encodeURIComponent(q)}&limit=4`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json() as SearchResults;
      setResults(data);
      setOpen(true);
      setActiveIndex(-1);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void fetchResults(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  // Flatten all navigable rows for keyboard nav
  const allRows: { href: string }[] = results
    ? [
        ...results.items.map((i) => ({ href: `/dashboard/items/${i.id}` })),
        ...results.requests.map((r) => ({ href: `/dashboard/borrow-requests/${r.id}` })),
        ...results.users.map((u) => ({ href: `/dashboard/browse?lender=${u.id}` })),
        { href: `/dashboard/browse?q=${encodeURIComponent(query)}` },
      ]
    : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allRows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = activeIndex >= 0 ? allRows[activeIndex]?.href : `/dashboard/browse?q=${encodeURIComponent(query)}`;
      if (target) router.push(target);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const hasResults = results && (
    results.items.length > 0 || results.requests.length > 0 || results.users.length > 0
  );

  // Compute row indices for active tracking
  const itemStart = 0;
  const reqStart = results ? results.items.length : 0;
  const userStart = reqStart + (results ? results.requests.length : 0);
  const viewAllIndex = userStart + (results ? results.users.length : 0);

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <div className="flex items-center gap-2 rounded-xl bg-[var(--surface-soft)] border border-transparent px-3 py-2 transition-colors focus-within:border-[var(--primary)]/30 focus-within:bg-[var(--surface)]">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[var(--text-secondary)] shrink-0" />
        ) : (
          <Search className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search items, users…"
          className="w-48 bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--text-secondary)] outline-none lg:w-64"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute right-0 top-full z-[200] mt-2 w-[380px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
          {/* AI badge */}
          {results?.aiMatched && (
            <div className="flex items-center gap-1.5 border-b border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2">
              <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
              <span className="text-[0.72rem] font-semibold text-[var(--primary)]">AI-matched results</span>
            </div>
          )}

          {!hasResults && !loading && (
            <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Items section */}
          {results && results.items.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-4 pb-1 pt-3">
                <Package className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <span className="text-[0.68rem] font-black uppercase tracking-wider text-[var(--text-muted)]">Items for Rent</span>
              </div>
              {results.items.map((item, idx) => {
                const rowIdx = itemStart + idx;
                return (
                  <Link
                    key={item.id}
                    href={`/dashboard/items/${item.id}`}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--surface-soft)] ${activeIndex === rowIdx ? "bg-[var(--surface-soft)]" : ""}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-soft)]">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-[var(--text-muted)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        {item.category && <span className="rounded-full bg-[var(--primary)]/10 px-1.5 py-0.5 text-[0.65rem] font-bold text-[var(--primary)]">{item.category}</span>}
                        {item.pricePerDay != null && <span>TK {item.pricePerDay}/day</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Borrow Requests section */}
          {results && results.requests.length > 0 && (
            <div className={results.items.length > 0 ? "border-t border-[var(--border)]" : ""}>
              <div className="flex items-center gap-1.5 px-4 pb-1 pt-3">
                <ClipboardList className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <span className="text-[0.68rem] font-black uppercase tracking-wider text-[var(--text-muted)]">Borrow Requests</span>
              </div>
              {results.requests.map((req, idx) => {
                const rowIdx = reqStart + idx;
                return (
                  <Link
                    key={req.id}
                    href={`/dashboard/borrow-requests/${req.id}`}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--surface-soft)] ${activeIndex === rowIdx ? "bg-[var(--surface-soft)]" : ""}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)]">
                      <ClipboardList className="h-5 w-5 text-[var(--text-muted)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">{req.title}</p>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        {req.category && <span className="rounded-full bg-[var(--surface-soft)] px-1.5 py-0.5 text-[0.65rem] font-bold">{req.category}</span>}
                        <span>{fmtDate(req.neededFrom)} – {fmtDate(req.neededUntil)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Users section */}
          {results && results.users.length > 0 && (
            <div className={(results.items.length > 0 || results.requests.length > 0) ? "border-t border-[var(--border)]" : ""}>
              <div className="flex items-center gap-1.5 px-4 pb-1 pt-3">
                <User2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <span className="text-[0.68rem] font-black uppercase tracking-wider text-[var(--text-muted)]">Users</span>
              </div>
              {results.users.map((user, idx) => {
                const rowIdx = userStart + idx;
                return (
                  <Link
                    key={user.id}
                    href={`/dashboard/browse?lender=${user.id}`}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--surface-soft)] ${activeIndex === rowIdx ? "bg-[var(--surface-soft)]" : ""}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-bold text-white">
                      {user.avatarLabel}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">{user.name}</p>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        {user.userName && <span>@{user.userName}</span>}
                        {user.location && <span>· {user.location.split(",")[0]}</span>}
                        <span>· {user.itemCount} item{user.itemCount !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* View all footer */}
          {hasResults && (
            <Link
              href={`/dashboard/browse?q=${encodeURIComponent(query)}`}
              onClick={() => setOpen(false)}
              className={`flex items-center justify-between border-t border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--surface-soft)] ${activeIndex === viewAllIndex ? "bg-[var(--surface-soft)]" : ""}`}
            >
              <span>View all results for &ldquo;{query}&rdquo;</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
