"use client";

import { useEffect, useState } from "react";
import { Package, X, Loader2 } from "lucide-react";

interface LentItem {
  id: string;
  status: string;
  pricePerDay: number | null;
  product: {
    name: string;
    slug: string;
    category: string | null;
    imageUrl: string | null;
  };
}

interface ItemShareModalProps {
  onShare: (item: LentItem) => void;
  onClose: () => void;
}

export default function ItemShareModal({ onShare, onClose }: ItemShareModalProps) {
  const [items, setItems] = useState<LentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lent-items")
      .then((r) => r.json())
      .then((data: LentItem[]) => {
        setItems(data.filter((item) => item.status === "active"));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-(--border) px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--primary-soft)">
              <Package className="h-4 w-4 text-(--primary)" />
            </div>
            <span className="text-[0.95rem] font-black text-(--ink)">Share a Listed Item</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-(--text-muted) transition-colors hover:text-(--foreground)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List */}
        <div className="max-h-90 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-(--text-muted)" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-(--text-muted)">
              <Package className="mb-2 h-8 w-8" />
              <p className="text-sm font-semibold">No active listings</p>
              <p className="mt-1 text-xs">List an item first to share it here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onShare(item)}
                  className="flex items-center gap-3 rounded-xl border border-(--border) bg-(--surface-soft) p-3.5 text-left transition-all hover:border-(--primary) hover:bg-(--primary-soft)"
                >
                  {/* Thumbnail or fallback */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-(--border)">
                    {item.product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-(--text-muted)" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.88rem] font-bold text-(--ink)">
                      {item.product.name}
                    </p>
                    <p className="mt-0.5 text-[0.75rem] text-(--text-muted)">
                      {item.product.category ?? "General"}
                      {item.pricePerDay != null ? ` · ₹${item.pricePerDay}/day` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-[0.75rem] font-semibold text-(--primary)">
                    Share →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
