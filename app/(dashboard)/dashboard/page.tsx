"use client";

import { useState } from "react";
import StatCard from "@/components/dashboard/StatCard";

export default function DashboardPage() {
  const [isDismissed, setIsDismissed] = useState(false);

  const categories = [
    { id: 1, name: "Electronics", icon: "📱" },
    { id: 2, name: "Books", icon: "📚" },
    { id: 3, name: "Tools", icon: "🔧" },
    { id: 4, name: "Sports", icon: "⚽" },
    { id: 5, name: "Furniture", icon: "🪑" },
    { id: 6, name: "Kitchen", icon: "🍳" },
  ];

  return (
    <div className="space-y-6">
      {/* Return Overdue Alert */}
      {!isDismissed && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Return Overdue</h3>
                <p className="text-sm text-red-700">You have items that need to be returned</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Mark Resolved
              </button>
              <button onClick={() => setIsDismissed(true)} className="rounded-lg p-2 hover:bg-red-100">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Active Borrows"
          value={3}
          subtitle="Currently borrowing"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3-8.25H18a2.25 2.25 0 012.25 2.25v6A2.25 2.25 0 0118 21H6a2.25 2.25 0 01-2.25-2.25v-6A2.25 2.25 0 016 9h.75" />
            </svg>
          }
          variant="info"
        />

        <StatCard
          title="Your Items"
          value={8}
          subtitle="Available to lend"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H2.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          }
          variant="success"
        />

        <StatCard
          title="Messages"
          value={2}
          subtitle="Unread messages"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0h-15m0 0l-3-3m3 3l3-3" />
            </svg>
          }
          variant="warning"
        />
      </div>

      {/* Browse Categories */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Browse Categories</h2>
          <a href="#" className="text-sm font-semibold text-[var(--primary)] hover:underline">
            View all →
          </a>
        </div>
        <div className="grid grid-cols-6 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              className="group rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center shadow-sm transition-all duration-200 hover:shadow-lg hover:border-[var(--primary)]/50"
            >
              <div className="mb-3 text-2xl">{category.icon}</div>
              <p className="text-xs font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)]">
                {category.name}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
