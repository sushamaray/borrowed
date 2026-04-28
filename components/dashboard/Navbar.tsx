"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ChevronDown, Search, ChevronLeft, ChevronRight, User, Settings, LogOut } from "lucide-react";

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
            {isSidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
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

          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 rounded-lg bg-[var(--surface-soft)] px-3 py-2 text-[var(--foreground)] hover:bg-[var(--border)]"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
                D
              </div>
              <span className="hidden sm:inline text-sm font-medium">Demo User</span>
              <ChevronDown className={`h-4 w-4 text-[var(--text-secondary)] transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-lg z-50">
                <Link 
                  href="/dashboard/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-soft)] first:rounded-t-lg transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link 
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-soft)] transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button 
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-red-500/10 hover:text-red-600 rounded-b-lg transition-colors border-t border-[var(--border)]"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
