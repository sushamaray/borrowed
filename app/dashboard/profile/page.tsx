"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { LocationPicker } from "@/components/LocationPicker";
import { AlertCircle, CheckCircle2, Loader } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Fetch location separately
      const fetchLocation = async () => {
        try {
          const locationRes = await fetch("/api/user/location");
          if (locationRes.ok) {
            const { location } = await locationRes.json();
            setLocation(location || "");
          }
        } catch (error) {
          console.error("Error fetching location:", error);
        }
      };

      fetchLocation();
    }
  }, [status, session]);

  const handleLocationChange = async (newLocation: string) => {
    setLocation(newLocation);
    setSaving(true);

    try {
      const response = await fetch("/api/user/location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: newLocation }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Location updated successfully!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: "Failed to update location" });
      }
    } catch (error) {
      console.error("Error updating location:", error);
      setMessage({ type: "error", text: "Error updating location" });
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-800">Please log in to access your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Your Profile</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <p
            className={
              message.type === "success"
                ? "text-green-800 text-sm font-medium"
                : "text-red-800 text-sm font-medium"
            }
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6">
        {/* User Info Section */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Account Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Name
              </label>
              <input
                type="text"
                value={session?.user?.name || ""}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground)] text-sm disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Email
              </label>
              <input
                type="email"
                value={session?.user?.email || ""}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground)] text-sm disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="border-t border-[var(--border)] pt-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Location Settings
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Set your location to help other users find items near you. We can auto-detect your location or you can manually select it.
          </p>
          <div className="max-w-md">
            <LocationPicker
              initialLocation={location}
              onLocationChange={handleLocationChange}
              autoDetect={!location}
            />
          </div>
          {saving && (
            <div className="flex items-center gap-2 mt-3 text-sm text-[var(--primary)]">
              <Loader className="h-4 w-4 animate-spin" />
              Saving location...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
