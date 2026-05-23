"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const OPTIONS = [
  { value: "",         label: "Any listing status", dot: "bg-gray-300"    },
  { value: "active",   label: "Active",             dot: "bg-emerald-400" },
  { value: "borrowed", label: "Borrowed",           dot: "bg-blue-400"    },
  { value: "inactive", label: "Inactive",           dot: "bg-amber-400"   },
  { value: "unlisted", label: "Unlisted",           dot: "bg-gray-400"    },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function ListingStatusPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];
  const hasValue = value !== "";

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors focus:outline-none ${
          open
            ? "border-white/30 bg-white/15 text-white"
            : hasValue
            ? "border-white/25 bg-white/12 text-white"
            : "border-white/15 bg-white/8 text-white/60"
        }`}
      >
        <span className="flex items-center gap-2.5 truncate">
          <span className={`h-2 w-2 rounded-full shrink-0 ${open || hasValue ? selected.dot : "bg-white/25"}`} />
          {selected.label}
        </span>
        {open
          ? <ChevronUp className="ml-2 h-4 w-4 shrink-0 text-white/40" />
          : <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-white/40" />
        }
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[200] rounded-2xl border border-(--border) bg-white shadow-2xl overflow-hidden">
          {OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                  isSelected
                    ? "bg-(--primary-soft) text-(--primary)"
                    : "text-(--text-secondary) hover:bg-(--surface-soft)"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${isSelected ? "bg-(--primary)" : opt.dot}`} />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
