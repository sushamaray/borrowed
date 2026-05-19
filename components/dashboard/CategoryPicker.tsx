"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, X, Check } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

type Props = {
  mode: "single" | "multi";
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function CategoryPicker({
  mode,
  value,
  onChange,
  disabled = false,
  placeholder = "Select a category",
}: Props) {
  const [open, setOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
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

  function toggleSub(sub: string) {
    if (mode === "single") {
      onChange([sub]);
      setOpen(false);
    } else {
      if (value.includes(sub)) {
        onChange(value.filter((v) => v !== sub));
      } else {
        onChange([...value, sub]);
      }
    }
  }

  function removePill(sub: string) {
    onChange(value.filter((v) => v !== sub));
  }

  const triggerLabel =
    value.length === 0
      ? placeholder
      : mode === "single"
      ? value[0]
      : `${value.length} area${value.length > 1 ? "s" : ""} selected`;

  const hasValue = value.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors focus:outline-none disabled:opacity-50 ${
          open
            ? "border-(--primary) bg-white text-(--foreground)"
            : hasValue
            ? "border-(--primary)/50 bg-(--primary-soft) text-(--primary)"
            : "border-(--border) bg-(--surface-soft) text-(--text-muted)"
        }`}
      >
        <span className="truncate">{triggerLabel}</span>
        {open ? (
          <ChevronUp className="ml-2 h-4 w-4 shrink-0 text-(--text-muted)" />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-(--text-muted)" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-72 overflow-y-auto rounded-2xl border border-(--border) bg-white shadow-2xl [scrollbar-width:thin] [scrollbar-color:#6d5bba_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#6d5bba] [&::-webkit-scrollbar-thumb:hover]:bg-[#3b2a80]">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isExpanded = expandedCat === cat.name;
            const anySelected = cat.subcategories.some((s) => value.includes(s));

            return (
              <div key={cat.name}>
                {/* Category row */}
                <button
                  type="button"
                  onClick={() => setExpandedCat(isExpanded ? null : cat.name)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-(--surface-soft) ${
                    anySelected ? "text-(--primary)" : "text-(--text-secondary)"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                  <span className="flex-1">{cat.name}</span>
                  {anySelected && (
                    <span className="mr-1 rounded-full bg-(--primary-soft) px-2 py-0.5 text-[0.6rem] font-black text-(--primary)">
                      {cat.subcategories.filter((s) => value.includes(s)).length}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 shrink-0 text-(--text-muted)" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-(--text-muted)" />
                  )}
                </button>

                {/* Subcategory rows */}
                {isExpanded && (
                  <div className="border-t border-(--border)/50 pb-1">
                    {cat.subcategories.map((sub) => {
                      const selected = value.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => toggleSub(sub)}
                          className={`flex w-full items-center gap-3 py-2 pl-11 pr-4 text-left text-xs font-semibold transition-colors ${
                            selected
                              ? "bg-(--primary-soft) text-(--primary)"
                              : "text-(--text-secondary) hover:bg-(--surface-soft)"
                          }`}
                        >
                          {mode === "multi" ? (
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                selected
                                  ? "border-(--primary) bg-(--primary)"
                                  : "border-(--border) bg-white"
                              }`}
                            >
                              {selected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                            </span>
                          ) : (
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                selected
                                  ? "border-(--primary) bg-(--primary)"
                                  : "border-(--border) bg-white"
                              }`}
                            >
                              {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                            </span>
                          )}
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pills */}
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((sub) => (
            <span
              key={sub}
              className="inline-flex items-center gap-1 rounded-full bg-(--primary-soft) px-3 py-1 text-xs font-semibold text-(--primary)"
            >
              {sub}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removePill(sub)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-(--primary)/10"
                  aria-label={`Remove ${sub}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
