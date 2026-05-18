"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, Navigation, X, Check, Loader } from "lucide-react";

const MapWithPin = dynamic(() => import("./MapWithPin"), { ssr: false });

const DHAKA = { lat: 23.8103, lng: 90.4125 };

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationResult {
  location: string;
  latitude: number;
  longitude: number;
}

interface Props {
  initialLocation?: string;
  initialLat?: number | null;
  initialLng?: number | null;
  onConfirm: (result: LocationResult) => void;
  onClose: () => void;
}

export function LocationPickerModal({
  initialLocation,
  initialLat,
  initialLng,
  onConfirm,
  onClose,
}: Props) {
  const [query, setQuery] = useState(initialLocation || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  // null = not searched yet, true = searched with results, false = searched empty
  const [suggestionState, setSuggestionState] = useState<"idle" | "open" | "empty">("idle");
  const [lat, setLat] = useState(initialLat ?? DHAKA.lat);
  const [lng, setLng] = useState(initialLng ?? DHAKA.lng);
  const [label, setLabel] = useState(initialLocation || "");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Prevents map-click / GPS / suggestion-select from re-triggering the search debounce
  const skipNextSearch = useRef(false);
  // Abort in-flight search when a new one starts
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // For click-outside to close suggestions
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Click-outside handler
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSuggestionState("idle");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setSuggestionState("idle");
      return;
    }
    // Abort previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setSearchLoading(true);
    try {
      const res = await fetch(
        `/api/geocode?action=search&q=${encodeURIComponent(q)}`,
        { signal: abortRef.current.signal }
      );
      const data: Suggestion[] = await res.json();
      setSuggestions(data);
      setSuggestionState(data.length > 0 ? "open" : "empty");
    } catch (err: unknown) {
      // AbortError is expected when a new search cancels the old one
      if (err instanceof Error && err.name !== "AbortError") {
        setSuggestions([]);
        setSuggestionState("empty");
      }
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounce search, skip if the query was set programmatically
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const reverseGeocode = async (la: number, lo: number): Promise<string> => {
    try {
      const res = await fetch(`/api/geocode?action=reverse&lat=${la}&lon=${lo}`);
      const data = await res.json();
      return (data.display_name as string) || "";
    } catch {
      return "";
    }
  };

  const handleSuggestionSelect = (s: Suggestion) => {
    const name = s.display_name.trim();
    skipNextSearch.current = true;
    setQuery(name);
    setLabel(name);
    setLat(parseFloat(s.lat));
    setLng(parseFloat(s.lon));
    setSuggestions([]);
    setSuggestionState("idle");
  };

  const handleMapMove = async (la: number, lo: number) => {
    setLat(la);
    setLng(lo);
    setSuggestionState("idle");
    const name = await reverseGeocode(la, lo);
    if (name) {
      const fullAddress = name.trim();
      skipNextSearch.current = true;
      setLabel(fullAddress);
      setQuery(fullAddress);
    }
  };

  const handleGps = () => {
    if (!("geolocation" in navigator)) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude;
        const lo = pos.coords.longitude;
        setLat(la);
        setLng(lo);
        setSuggestionState("idle");
        const name = await reverseGeocode(la, lo);
        const fullAddress = (name || "Current location").trim();
        skipNextSearch.current = true;
        setLabel(fullAddress);
        setQuery(fullAddress);
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    if (!label) return;
    onConfirm({ location: label, latitude: lat, longitude: lng });
  };

  const showDropdown = suggestionState !== "idle";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-[rgba(10,28,28,0.7)] backdrop-blur-[4px] sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-[1.5rem] bg-[var(--surface)] shadow-[0_40px_100px_rgba(0,0,0,0.35)] sm:rounded-[1.5rem]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[var(--primary)]" />
            <span className="text-base font-extrabold text-[var(--ink)]">Set your location</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search row */}
        <div className="flex gap-2 px-5 pb-3">
          {/* z-[9999] on the container so the dropdown renders above the Leaflet map */}
          <div ref={searchContainerRef} className="relative flex-1 z-[9999]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim().length >= 2) setSuggestionState("open");
              }}
              onFocus={() => {
                if (suggestions.length > 0) setSuggestionState("open");
              }}
              placeholder="Search for an area in Bangladesh…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 pl-9 pr-9 text-sm text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            />
            {searchLoading && (
              <Loader className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--primary)] pointer-events-none" />
            )}

            {/* Suggestions dropdown — above Leaflet via inherited z-[9999] */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
                {suggestionState === "open" && suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={(e) => {
                      // Use mousedown so this fires before input's onBlur
                      e.preventDefault();
                      handleSuggestionSelect(s);
                    }}
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-[var(--surface-soft)] transition-colors"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                    <span className="text-xs leading-snug text-[var(--foreground)]">
                      {s.display_name}
                    </span>
                  </button>
                ))}
                {suggestionState === "empty" && !searchLoading && (
                  <div className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    No results found for &ldquo;{query}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* GPS button */}
          <button
            type="button"
            onClick={handleGps}
            disabled={gpsLoading}
            title="Use my current location"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--primary)] hover:bg-[var(--primary)]/10 disabled:opacity-50 transition-colors"
          >
            {gpsLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Map */}
        <div className="mx-5 h-[300px] overflow-hidden rounded-xl">
          <MapWithPin lat={lat} lng={lng} onMove={handleMapMove} />
        </div>

        {/* Selected location label */}
        <div className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-[var(--surface-soft)] px-3 py-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-[var(--primary)]" />
          <span className="min-w-0 flex-1 break-words text-sm font-medium text-[var(--foreground)]">
            {label || <span className="text-[var(--text-secondary)]">No location selected</span>}
          </span>
          {label && (
            <button
              type="button"
              onClick={() => { setLabel(""); setQuery(""); setSuggestionState("idle"); }}
              className="text-[var(--text-secondary)] hover:text-[var(--foreground)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Hint */}
        <p className="px-5 pt-2 pb-1 text-xs text-[var(--text-secondary)]">
          Search, tap the map, or drag the pin to fine-tune your location.
        </p>

        {/* Confirm */}
        <div className="px-5 pb-5 pt-2">
          <button
            onClick={handleConfirm}
            disabled={!label}
            className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-extrabold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              label ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-soft)] text-[var(--text-secondary)]"
            }`}
          >
            <Check className="h-4 w-4" />
            Confirm location
          </button>
        </div>
      </div>
    </div>
  );
}
