"use client";

import { useEffect, useRef } from "react";
import { Package, Tag, Loader2 } from "lucide-react";
import type { ProductListItem } from "@/lib/admin/products/types";

interface Props {
  products: ProductListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

function statusColor(active: number, total: number) {
  if (total === 0) return "bg-gray-500";
  if (active > 0) return "bg-emerald-400";
  return "bg-amber-400";
}

export default function ProductQueue({ products, selectedId, onSelect, hasMore, loadingMore, onLoadMore }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loadingMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onLoadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-white/40" />
          <span className="text-[0.65rem] font-extrabold text-white/40 uppercase tracking-widest">
            Products
          </span>
          <span className="ml-auto text-[0.6rem] font-bold text-white/25 bg-white/5 rounded-full px-2 py-0.5">
            {products.length}{hasMore ? "+" : ""}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2 space-y-1">
        {products.map((p) => {
          const isSelected = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`w-full text-left rounded-xl px-3 py-2.5 transition-all ${
                isSelected
                  ? "bg-(--primary)/20 ring-1 ring-(--primary)/40"
                  : "hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-lg shrink-0 overflow-hidden bg-white/5 flex items-center justify-center">
                  {(p.images[0] ? `/api/products/images/${p.images[0].id}` : p.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0] ? `/api/products/images/${p.images[0].id}` : p.imageUrl!} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-4 w-4 text-white/20" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-[0.8rem] font-bold truncate leading-tight ${isSelected ? "text-white" : "text-white/75"}`}>
                    {p.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Tag className="h-2.5 w-2.5 text-white/25 shrink-0" />
                    <p className="text-[0.62rem] text-white/35 truncate">
                      {p.category}{p.subcategory ? ` · ${p.subcategory}` : ""}
                    </p>
                  </div>
                  <p className="text-[0.6rem] text-white/25 truncate mt-0.5">
                    by {p.createdBy.name}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[0.65rem] font-extrabold text-(--primary) bg-(--primary)/10 rounded-full px-1.5 py-0.5">
                    ৳{p.pricePerDay}/d
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${statusColor(p.activeLentItems, p.lentItemCount)}`} />
                    <span className="text-[0.58rem] text-white/25">
                      {p.activeLentItems}/{p.lentItemCount}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {/* Sentinel — watched by IntersectionObserver */}
        {hasMore && <div ref={sentinelRef} className="h-1" />}

        {/* Spinner shown while fetching next page */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 text-white/20 animate-spin" />
          </div>
        )}

        {!hasMore && products.length > 0 && (
          <p className="text-center text-[0.58rem] text-white/15 py-3 tracking-widest uppercase">
            End of list
          </p>
        )}
      </div>
    </div>
  );
}
