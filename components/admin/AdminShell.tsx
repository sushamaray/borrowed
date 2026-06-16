"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const NAV_TABS = [
  { label: "Cases",   href: "/admin/disputes" },
  { label: "Users",   href: "/admin/users" },
  { label: "Products", href: "/admin/products" },
  { label: "Reports", href: "/admin/reports" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "Admin";
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="h-screen flex flex-col bg-(--background)">
      {/* Top nav */}
      <header className="h-14 flex-shrink-0 flex items-center gap-4 px-6 bg-[var(--surface)]/95 backdrop-blur-sm shadow-[0_1px_0_rgba(27,21,48,0.10),0_2px_6px_rgba(27,21,48,0.06)] sticky top-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-7 w-7 rounded-lg bg-[linear-gradient(135deg,#3b2a80,#5b3dbf)] flex items-center justify-center shadow-[0_2px_8px_rgba(59,42,128,0.4)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="white" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-black text-[var(--ink)] text-[0.93rem] tracking-tight">borrowed</span>
          <span className="rounded-md bg-red-50 border border-red-100 text-red-600 text-[0.58rem] font-extrabold px-1.5 py-0.5 uppercase tracking-widest">
            Admin
          </span>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-[var(--border)] shrink-0" />

        {/* Nav tabs */}
        <nav className="flex items-center gap-0.5">
          {NAV_TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-150 ${
                  active
                    ? "text-[var(--primary)] bg-[var(--primary-soft)]"
                    : "text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Search */}
        <div className="flex items-center gap-2 bg-[var(--surface-soft)] border border-[var(--border)] rounded-full px-3 py-1.5 w-44 transition-colors hover:border-[var(--accent)] focus-within:border-[var(--primary)] focus-within:bg-[var(--surface)]">
          <Search className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search…"
            className="flex-1 bg-transparent text-xs text-[var(--ink)] placeholder:text-[var(--text-muted)] outline-none"
          />
        </div>

        {/* Admin avatar + name */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-[0.72rem] font-bold text-[var(--ink)] leading-none">{userName.split(" ")[0]}</p>
            <p className="text-[0.6rem] font-medium text-[var(--text-muted)] mt-0.5">Admin</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] flex items-center justify-center text-white text-[0.67rem] font-black shrink-0 shadow-[0_2px_8px_rgba(59,42,128,0.3)]">
            {initials}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-(--text-muted) hover:text-red-500 hover:bg-red-50 transition-all duration-150 shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
