"use client";

export default function DashboardPage() {
  return (
    <div className="animate-fadeIn">
      {/* Hero Section - Welcome Card */}
      <div className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 py-8 shadow-sm">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          Welcome to Borrowed 👋
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          A peer-to-peer lending and borrowing platform for sharing items in your community.
        </p>
      </div>

      {/* Empty State */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-6 py-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--primary-soft)]">
          <svg className="h-6 w-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.5v2.25m6-2.25v2.25m-13.5-4h2.25A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0118.75 7.5h2.25" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          No Items Yet
        </h2>
        <p className="mt-2 text-[var(--text-secondary)]">
          Start by adding items to lend or browsing available items to borrow.
        </p>
      </div>
    </div>
  );
}
