"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import FallbackImage from "@/components/FallbackImage";

interface BrowseItem {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  pricePerDay: number | null;
  deposit: number | null;
  description: string | null;
  imageUrl: string | null;
  lenderName: string;
}

export default function BrowseItemsPage() {
  const [items, setItems] = useState<BrowseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/browse")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data: BrowseItem[]) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Browse Items</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Discover items available for lending in your community
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg bg-[var(--surface)] animate-pulse h-72" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--text-secondary)]">No items available right now.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCard({ item }: { item: BrowseItem }) {
  return (
    <Link href={`/dashboard/items/${item.id}`}>
      <div className="group rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface)] transition-all duration-300 hover:shadow-lg hover:border-[var(--primary)]/50">
        <div className="relative overflow-hidden h-48 bg-[var(--surface-soft)]">
          <FallbackImage
            src={item.imageUrl ?? ""}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-4 space-y-3">
          <div>
            {item.category && (
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">
                {item.category}
              </p>
            )}
            <h3 className="text-sm font-bold text-[var(--foreground)] mt-1 line-clamp-2">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>

          {item.location && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <MapPin className="h-4 w-4" />
              {item.location}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Price/Day</p>
              <p className="text-lg font-bold text-[var(--primary)]">
                {item.pricePerDay != null ? `TK ${item.pricePerDay}` : "—"}
              </p>
            </div>
            {item.deposit != null && (
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)]">Deposit</p>
                <p className="text-sm font-semibold text-[var(--foreground)]">TK {item.deposit}</p>
              </div>
            )}
          </div>

          <div className="text-xs text-[var(--text-secondary)]">
            by <span className="font-medium text-[var(--foreground)]">{item.lenderName}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
