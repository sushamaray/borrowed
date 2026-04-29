"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader } from "lucide-react";

const DHAKA_AREAS = [
  "Banani",
  "Baridhara",
  "Dhanmondi",
  "Gulshan",
  "Kawran Bazar",
  "Mirpur",
  "Motijheel",
  "Old Dhaka",
  "Uttara",
  "Farmgate",
  "Shyamoli",
  "Adabor",
  "Mohakhali",
];

interface LocationPickerProps {
  initialLocation?: string;
  onLocationChange: (location: string) => void;
  autoDetect?: boolean;
}

export function LocationPicker({
  initialLocation,
  onLocationChange,
  autoDetect = true,
}: LocationPickerProps) {
  const [location, setLocation] = useState(initialLocation || "");
  const [filteredAreas, setFilteredAreas] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // Auto-detect location on mount
  useEffect(() => {
    if (autoDetect && !initialLocation) {
      detectLocation();
    }
  }, []);

  const detectLocation = () => {
    setIsDetecting(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Use reverse geocoding (mock for now - returns a default area)
            // In production, use a real geocoding service like Google Maps
            const detectedLocation = "Gulshan"; // Mock detection
            setLocation(detectedLocation);
            onLocationChange(detectedLocation);
          } catch (error) {
            console.error("Geolocation error:", error);
          } finally {
            setIsDetecting(false);
          }
        },
        () => {
          // User denied permission or error occurred
          setIsDetecting(false);
        }
      );
    }
  };

  const handleInputChange = (value: string) => {
    setLocation(value);
    if (value.trim() === "") {
      setFilteredAreas([]);
    } else {
      const filtered = DHAKA_AREAS.filter((area) =>
        area.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredAreas(filtered);
    }
    setShowDropdown(true);
  };

  const selectArea = (area: string) => {
    setLocation(area);
    onLocationChange(area);
    setShowDropdown(false);
    setFilteredAreas([]);
  };

  return (
    <div className="relative w-full">
      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
        Your Location
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
          <MapPin className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={location}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          placeholder="Select or enter your area..."
          className="w-full pl-10 pr-10 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]"
        />
        {isDetecting && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader className="h-4 w-4 animate-spin text-[var(--primary)]" />
          </div>
        )}
        {!isDetecting && location === "" && (
          <button
            type="button"
            onClick={detectLocation}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--primary)] hover:text-[var(--primary)]/80 text-xs font-medium"
          >
            Detect
          </button>
        )}
      </div>

      {showDropdown && filteredAreas.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-50">
          {filteredAreas.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => selectArea(area)}
              className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-soft)] first:rounded-t-lg last:rounded-b-lg transition-colors"
            >
              {area}, Dhaka
            </button>
          ))}
        </div>
      )}

      {showDropdown && location && filteredAreas.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 shadow-lg z-50">
          <p className="text-xs text-[var(--text-muted)]">
            {location.includes(",") ? location : `${location}, Dhaka`}
          </p>
        </div>
      )}
    </div>
  );
}
