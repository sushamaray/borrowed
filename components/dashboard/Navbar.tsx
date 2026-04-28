"use client";

import { Menu, ChevronDown, Search } from "lucide-react";

type NavbarProps = {
  onMenuClick: () => void;
  onCollapseClick: () => void;
  isSidebarCollapsed: boolean;
  pageTitle: string;
};

export default function Navbar({
  onMenuClick,
  onCollapseClick,
  isSidebarCollapsed,
  pageTitle,
}: NavbarProps) {
  return (
    <nav className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden rounded-lg bg-[var(--surface-soft)] p-2 text-[var(--text-secondary)] hover:text-[var(--foreground)]"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onCollapseClick}
            className="hidden lg:block rounded-lg bg-[var(--surface-soft)] p-2 text-[var(--text-secondary)] hover:text-[var(--foreground)]"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-lg font-semibold text-[var(--foreground)]">{pageTitle}</h1>
            <p className="text-sm text-[var(--text-secondary)]">Manage your items and connections</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-[var(--surface-soft)] px-3 py-2">
            <Search className="h-4 w-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search items, users..."
              className="bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--text-secondary)] outline-none"
            />
          </div>

          <button className="flex items-center gap-2 rounded-lg bg-[var(--surface-soft)] px-3 py-2 text-[var(--foreground)] hover:bg-[var(--border)]">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
              D
            </div>
            <span className="hidden sm:inline text-sm font-medium">Demo User</span>
            <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>
    </nav>
  );
}
