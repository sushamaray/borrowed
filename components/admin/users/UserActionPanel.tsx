"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, ShieldOff } from "lucide-react";
import type { UserDetail } from "@/lib/admin/users/types";

// ── Animated trust score ring ─────────────────────────────────────────────────

function TrustRing({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0);
  const radius = 40;
  const stroke = 7;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayed / 100) * circumference;

  const ringColor =
    score >= 80 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const textColor =
    score >= 80 ? "text-emerald-500" : score >= 40 ? "text-amber-500" : "text-red-500";

  useEffect(() => {
    setDisplayed(0);
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed((prev) => {
          if (prev >= score) {
            clearInterval(interval);
            return score;
          }
          return prev + 2;
        });
      }, 12);
      return () => clearInterval(interval);
    }, 80);
    return () => clearTimeout(timeout);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Background ring */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        {/* Progress ring */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 0.05s linear" }}
        />
        {/* Score text */}
        <text
          x="50" y="46"
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-black"
          style={{ fontSize: 18, fontWeight: 800, fill: ringColor }}
        >
          {displayed}
        </text>
        <text
          x="50" y="60"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 9, fill: "var(--text-muted)", fontWeight: 600 }}
        >
          /100
        </text>
      </svg>
      <span className={`text-[0.65rem] font-extrabold uppercase tracking-widest ${textColor}`}>
        Trust Score
      </span>
    </div>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  checked,
  onToggle,
  saving,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-[var(--border)] last:border-0">
      <div className={`h-2 w-2 rounded-full shrink-0 ${checked ? "bg-emerald-500" : "bg-[var(--border)]"}`} />
      <span className="flex-1 text-xs font-semibold text-[var(--ink)]">{label}</span>
      <button
        onClick={onToggle}
        disabled={saving}
        className={`relative h-5 w-9 rounded-full transition-colors duration-200 shrink-0 focus:outline-none disabled:opacity-50 ${
          checked ? "bg-[var(--primary)]" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

const VERIFICATION_FIELDS = [
  { field: "identityVerified", label: "Identity" },
  { field: "contactVerified",  label: "Contact" },
  { field: "idVerified",       label: "ID Document" },
  { field: "addressVerified",  label: "Address" },
  { field: "meetupVerified",   label: "Meetup" },
] as const;

type VerificationField = (typeof VERIFICATION_FIELDS)[number]["field"];

export default function UserActionPanel({
  user,
  onUpdate,
}: {
  user: UserDetail;
  onUpdate: () => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const [confirmAdmin, setConfirmAdmin] = useState(false);

  async function toggle(field: string, currentValue: boolean) {
    setSaving(field);
    try {
      await fetch(`/api/admin/users/${user.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value: !currentValue }),
      });
      onUpdate();
    } finally {
      setSaving(null);
    }
  }

  async function toggleAdmin() {
    if (!confirmAdmin && !user.isAdmin) {
      setConfirmAdmin(true);
      return;
    }
    setConfirmAdmin(false);
    await toggle("isAdmin", user.isAdmin);
  }

  const verState: Record<VerificationField, boolean> = {
    identityVerified: user.verifications.identity,
    contactVerified:  user.verifications.contact,
    idVerified:       user.verifications.id,
    addressVerified:  user.verifications.address,
    meetupVerified:   user.verifications.meetup,
  };

  return (
    <div className="space-y-4">
      {/* Trust ring */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm p-4 flex flex-col items-center gap-2">
        <TrustRing score={user.trustScore} />
        <div className="text-[0.65rem] text-[var(--text-muted)] text-center">
          {user.verifications.identity ? "" : "Identity · "}
          {user.verifications.contact  ? "" : "Contact · "}
          {user.verifications.id       ? "" : "ID · "}
          {user.verifications.address  ? "" : "Address · "}
          {user.verifications.meetup   ? "" : "Meetup · "}
        </div>
        {user.trustScore === 100 && (
          <span className="text-[0.65rem] font-extrabold text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-0.5">
            Fully Verified
          </span>
        )}
      </div>

      {/* Verification toggles */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <span className="text-[0.65rem] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">
            Verifications
          </span>
        </div>
        <div className="px-4 py-1">
          {VERIFICATION_FIELDS.map(({ field, label }) => (
            <ToggleRow
              key={field}
              label={label}
              checked={verState[field]}
              onToggle={() => toggle(field, verState[field])}
              saving={saving === field}
            />
          ))}
        </div>
      </div>

      {/* Admin toggle */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <ShieldAlert className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <span className="text-[0.65rem] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">
            Admin Access
          </span>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${user.isAdmin ? "bg-red-500" : "bg-[var(--border)]"}`} />
            <span className="flex-1 text-xs font-semibold text-[var(--ink)]">
              {user.isAdmin ? "Admin user" : "Regular user"}
            </span>
          </div>

          {confirmAdmin && !user.isAdmin && (
            <p className="text-[0.68rem] text-amber-600 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
              This will grant full admin access. Are you sure?
            </p>
          )}

          <button
            onClick={toggleAdmin}
            disabled={saving === "isAdmin"}
            className={`w-full rounded-xl text-xs font-bold py-2.5 transition-colors disabled:opacity-50 ${
              user.isAdmin
                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
                : confirmAdmin
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)]/20"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {user.isAdmin ? (
                <><ShieldOff className="h-3.5 w-3.5" /> Revoke Admin</>
              ) : confirmAdmin ? (
                <><ShieldAlert className="h-3.5 w-3.5" /> Confirm Grant Admin</>
              ) : (
                <><ShieldCheck className="h-3.5 w-3.5" /> Grant Admin Access</>
              )}
            </span>
          </button>

          {confirmAdmin && !user.isAdmin && (
            <button
              onClick={() => setConfirmAdmin(false)}
              className="w-full rounded-xl text-xs font-bold py-2 text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
