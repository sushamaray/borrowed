"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Menu, ChevronDown, ChevronLeft, ChevronRight, User, Settings, LogOut, MapPin, Pencil } from "lucide-react";
import NotificationBell from "./NotificationBell";
import { LocationPickerModal } from "@/components/LocationPickerModal";
import SearchBar from "./SearchBar";

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
  const { data: session } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const displayName = session?.user?.name || session?.user?.email || "Account";
  const avatarLabel = displayName.trim().charAt(0).toUpperCase() || "A";

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const response = await fetch("/api/user/location");
        if (response.ok) {
          const data = await response.json();
          setUserLocation(data.location ?? null);
          setUserLat(data.latitude ?? null);
          setUserLng(data.longitude ?? null);
        }
      } catch (error) {
        console.error("Error fetching user location:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserLocation();
  }, []);

  const handleLocationConfirm = async (result: { location: string; latitude: number; longitude: number }) => {
    setShowLocationModal(false);
    try {
      const res = await fetch("/api/user/location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (res.ok) {
        setUserLocation(result.location);
        setUserLat(result.latitude);
        setUserLng(result.longitude);
      }
    } catch {
      // silently fail — location display just won't update
    }
  };

  return (
    <>
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
              <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)] mt-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {loading ? (
                  <span>Loading…</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    title={userLocation ?? "Set your location"}
                    className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
                  >
                    <span>{userLocation ? userLocation : "Set your location"}</span>
                    <Pencil className="h-3 w-3 opacity-60" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SearchBar />

            <NotificationBell />

            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 rounded-lg bg-[var(--surface-soft)] px-3 py-2 text-[var(--foreground)] hover:bg-[var(--border)]"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
                  {avatarLabel}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{displayName}</span>
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
                    onClick={() => {
                      setIsProfileOpen(false);
                      void signOut({ redirectTo: "/login" });
                    }}
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

      {showLocationModal && (
        <LocationPickerModal
          initialLocation={userLocation ?? undefined}
          initialLat={userLat}
          initialLng={userLng}
          onConfirm={handleLocationConfirm}
          onClose={() => setShowLocationModal(false)}
        />
      )}
    </>
  );
}
