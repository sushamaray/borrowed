"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  User, ShieldCheck, Package, ArrowLeftRight,
  FileText, AlertTriangle, Activity, MapPin,
  Phone, Mail, Calendar, Star, ShoppingCart,
  Users, Video, Clock, ChevronDown, ChevronUp,
  Eye, EyeOff, Trash2, Flag,
} from "lucide-react";
import toast from "react-hot-toast";
import UserQueue from "@/components/admin/users/UserQueue";
import UserActionPanel from "@/components/admin/users/UserActionPanel";
import type { UserListItem, UserDetail } from "@/lib/admin/users/types";

// ── Shared helpers ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: "bg-amber-50",   text: "text-amber-700",   label: "Pending"   },
  active:    { bg: "bg-blue-50",    text: "text-blue-700",    label: "Active"    },
  accepted:  { bg: "bg-blue-50",    text: "text-blue-700",    label: "Accepted"  },
  returned:  { bg: "bg-emerald-50", text: "text-emerald-700", label: "Returned"  },
  fulfilled: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Fulfilled" },
  resolved:  { bg: "bg-emerald-50", text: "text-emerald-700", label: "Resolved"  },
  closed:    { bg: "bg-gray-100",   text: "text-gray-500",    label: "Closed"    },
  cancelled: { bg: "bg-gray-100",   text: "text-gray-500",    label: "Cancelled" },
  rejected:  { bg: "bg-red-50",     text: "text-red-600",     label: "Rejected"  },
  open:      { bg: "bg-amber-50",   text: "text-amber-700",   label: "Open"      },
  OPEN:          { bg: "bg-amber-50",   text: "text-amber-700",   label: "Open"       },
  UNDER_REVIEW:  { bg: "bg-blue-50",    text: "text-blue-700",    label: "Reviewing"  },
  ESCALATED:     { bg: "bg-red-50",     text: "text-red-600",     label: "Escalated"  },
  RESOLVED:      { bg: "bg-emerald-50", text: "text-emerald-700", label: "Resolved"   },
  CLOSED:        { bg: "bg-gray-100",   text: "text-gray-500",    label: "Closed"     },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "bg-gray-100", text: "text-gray-500", label: status };
  return (
    <span className={`text-[0.65rem] font-extrabold rounded-full px-2 py-0.5 ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Section({ title, icon, children, count }: { title: string; icon: React.ReactNode; children: React.ReactNode; count?: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--border)]">
        <span className="text-[var(--text-muted)]">{icon}</span>
        <span className="font-extrabold text-[var(--ink)] text-sm flex-1">{title}</span>
        {count !== undefined && (
          <span className="text-[0.65rem] font-bold text-[var(--text-muted)] bg-[var(--surface-soft)] rounded-full px-2 py-0.5">
            {count}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-sm text-[var(--text-muted)] text-center py-4">{label}</p>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({ u }: { u: UserDetail }) {
  const [borrowerRating, setBorrowerRating] = useState<{ count: number; average: number | null } | null>(null);

  useEffect(() => {
    fetch(`/api/user/${u.id}/borrower-rating`)
      .then((r) => r.ok ? r.json() as Promise<{ count: number; average: number | null }> : Promise.reject())
      .then(setBorrowerRating)
      .catch(() => setBorrowerRating(null));
  }, [u.id]);

  const verDots = [
    { key: "identity", label: "Identity",  done: u.verifications.identity },
    { key: "contact",  label: "Contact",   done: u.verifications.contact },
    { key: "id",       label: "ID Doc",    done: u.verifications.id },
    { key: "address",  label: "Address",   done: u.verifications.address },
    { key: "meetup",   label: "Meetup",    done: u.verifications.meetup },
  ];

  const stats = [
    { label: "Items Listed",    value: u.counts.products },
    { label: "Borrows",         value: u.counts.borrows },
    { label: "Lends",           value: u.counts.lends },
    { label: "Borrow Requests", value: u.counts.borrowRequests },
    { label: "Disputes",        value: u.counts.disputes },
    { label: "Trail Posts",     value: u.counts.trailEntries },
  ];

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm p-5">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[linear-gradient(135deg,#3b2a80,#6d5bba)] flex items-center justify-center text-white text-lg font-black shrink-0 shadow-md">
            {u.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xl font-black text-[var(--ink)] tracking-tight">{u.name}</span>
              {u.isAdmin && (
                <span className="text-[0.6rem] font-extrabold bg-red-50 border border-red-100 text-red-600 rounded-md px-1.5 py-0.5 uppercase tracking-widest">
                  Admin
                </span>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span>{u.email}</span>
              </div>
              {u.phoneNumber && (
                <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{u.phoneNumber}</span>
                </div>
              )}
              {u.location && (
                <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{u.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>Joined {fmt(u.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-(--surface) p-4 text-center shadow-md">
            <div className="text-2xl font-black text-[var(--ink)]">{s.value}</div>
            <div className="text-xs font-medium text-(--ink)/60 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Borrower Rating */}
      {borrowerRating !== null && (
        <div className="rounded-2xl border border-(--border) bg-(--surface) shadow-sm p-4 flex items-center gap-4">
          <div className="flex items-center gap-1.5 shrink-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < Math.round(borrowerRating.average ?? 0) ? "text-amber-400 fill-amber-400" : "text-(--border)"}`}
              />
            ))}
          </div>
          <div className="flex-1">
            <div className="text-sm font-extrabold text-(--ink)">
              {borrowerRating.average != null ? borrowerRating.average.toFixed(1) : "—"} / 5
            </div>
            <div className="text-xs text-(--text-muted)">
              Borrower Rating · {borrowerRating.count} {borrowerRating.count === 1 ? "review" : "reviews"} from lenders
            </div>
          </div>
        </div>
      )}

      {/* Verification DNA */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm p-5">
        <div className="text-[0.65rem] font-extrabold text-(--ink)/50 uppercase tracking-widest mb-3">
          Verification Status
        </div>
        <div className="flex gap-3">
          {verDots.map((v) => (
            <div key={v.key} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`h-2.5 rounded-full w-full ${v.done ? "bg-(--primary)" : "bg-(--border)"}`} />
              <span className="text-[0.68rem] font-semibold text-(--ink)/60">{v.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ID Lightbox ───────────────────────────────────────────────────────────────

function IDLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = React.useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom((z) => Math.min(8, Math.max(1, z - e.deltaY * 0.001)));
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.panX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.panY + (e.clientY - dragRef.current.startY),
    });
  }

  function handleMouseUp() {
    dragRef.current = null;
  }

  function reset() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex items-center justify-center w-full h-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 1 ? (dragRef.current ? "grabbing" : "grab") : "zoom-in" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="ID document"
          draggable={false}
          className="max-w-[90vw] max-h-[85vh] rounded-xl shadow-2xl object-contain select-none"
          style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, transition: dragRef.current ? "none" : "transform 0.15s ease" }}
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 rounded-full px-4 py-2 backdrop-blur-sm">
        <button onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))} className="text-white/80 hover:text-white text-lg font-bold w-6 text-center transition-colors">−</button>
        <span className="text-white/70 text-xs font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(8, +(z + 0.5).toFixed(1)))} className="text-white/80 hover:text-white text-lg font-bold w-6 text-center transition-colors">+</button>
        {zoom > 1 && (
          <><div className="w-px h-4 bg-white/20 mx-1" /><button onClick={reset} className="text-white/70 hover:text-white text-xs font-bold transition-colors">Reset</button></>
        )}
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center transition-colors backdrop-blur-sm"
      >
        ✕
      </button>
    </div>
  );
}

// ── Tab: Verifications ────────────────────────────────────────────────────────

function VerificationsTab({ u, onUpdate }: { u: UserDetail; onUpdate: () => void }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  const rows = [
    { key: "identity", label: "Identity",     done: u.verifications.identity },
    { key: "contact",  label: "Contact",      done: u.verifications.contact },
    { key: "id",       label: "ID Document",  done: u.verifications.id },
    { key: "address",  label: "Address",      done: u.verifications.address },
    { key: "meetup",   label: "Meetup",       done: u.verifications.meetup },
  ];

  async function toggle(field: string, currentValue: boolean) {
    await fetch(`/api/admin/users/${u.id}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field: `${field}Verified`, value: !currentValue }),
    });
    onUpdate();
  }

  return (
    <div className="space-y-4">
      <Section title="Verification Flags" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
              <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${r.done ? "bg-emerald-500" : "bg-[var(--border)]"}`} />
              <span className="flex-1 text-sm font-semibold text-[var(--ink)]">{r.label}</span>
              <span className={`text-[0.65rem] font-bold ${r.done ? "text-emerald-600" : "text-[var(--text-muted)]"}`}>
                {r.done ? "Verified" : "Not verified"}
              </span>
              <button
                onClick={() => toggle(r.key, r.done)}
                className={`text-[0.65rem] font-extrabold rounded-full px-3 py-1 transition-colors ${
                  r.done
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {r.done ? "Revoke" : "Verify"}
              </button>
            </div>
          ))}
        </div>
        {u.verifications.verifiedAt && (
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Fully verified on {fmt(u.verifications.verifiedAt)}
          </p>
        )}
      </Section>

      {u.idVerification && (
        <Section title="ID Document Submission" icon={<FileText className="h-3.5 w-3.5" />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">Status</span>
              <StatusBadge status={u.idVerification.status} />
            </div>
            {u.idVerification.faceMatchScore !== null && (
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-[var(--text-muted)]">Face match score</span>
                  <span className={`text-sm font-extrabold ${
                    u.idVerification.faceMatchScore >= 70 ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {Number(u.idVerification.faceMatchScore).toFixed(2)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${u.idVerification.faceMatchScore >= 70 ? "bg-emerald-500" : "bg-red-500"}`}
                    style={{ width: `${Math.min(u.idVerification.faceMatchScore, 100)}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">Submitted</span>
              <span className="text-sm font-semibold text-[var(--ink)]">{fmt(u.idVerification.submittedAt)}</span>
            </div>
            {u.idVerification.reviewedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-muted)]">Reviewed</span>
                <span className="text-sm font-semibold text-[var(--ink)]">{fmt(u.idVerification.reviewedAt)}</span>
              </div>
            )}
          </div>

          {(u.idVerification.hasFront || u.idVerification.hasBack || u.idVerification.hasSelfie) && (
            <div className="mt-4 space-y-2">
              <p className="text-[0.65rem] font-extrabold text-(--ink)/50 uppercase tracking-widest">Submitted Photos</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { has: u.idVerification.hasFront,  type: "front",  label: "Front"  },
                  { has: u.idVerification.hasBack,   type: "back",   label: "Back"   },
                  { has: u.idVerification.hasSelfie, type: "selfie", label: "Selfie" },
                ].filter((p) => p.has).map((p) => {
                  const src = `/api/admin/users/${u.id}/id-image?type=${p.type}`;
                  return (
                    <div key={p.type} className="space-y-1.5">
                      <p className="text-[0.65rem] font-bold text-(--text-muted) uppercase tracking-wider">{p.label}</p>
                      <button
                        onClick={() => setLightbox(src)}
                        className="w-full rounded-xl border border-(--border) overflow-hidden aspect-3/2 focus:outline-none hover:ring-2 hover:ring-(--primary) transition-all"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={p.label} className="w-full h-full object-cover" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Lightbox */}
      {lightbox && <IDLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

// ── Tab: Listings ─────────────────────────────────────────────────────────────

function ListingsTab({ u }: { u: UserDetail }) {
  const lentStatusStyles: Record<string, string> = {
    active:   "bg-emerald-50 text-emerald-700",
    borrowed: "bg-blue-50 text-blue-700",
    inactive: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="space-y-4">
      <Section title="Products Listed" icon={<Package className="h-3.5 w-3.5" />} count={u.products.length}>
        {u.products.length === 0 ? (
          <EmptyState label="No products listed" />
        ) : (
          <div className="space-y-2">
            {u.products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
                <div className="h-10 w-10 rounded-xl bg-[var(--surface-soft)] flex items-center justify-center shrink-0 overflow-hidden">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-4 w-4 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)] truncate">{p.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{p.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[var(--ink)]">৳{p.pricePerDay}/day</p>
                  <p className="text-xs text-[var(--text-muted)]">{fmt(p.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Lent Item Listings" icon={<ArrowLeftRight className="h-3.5 w-3.5" />} count={u.lentItems.length}>
        {u.lentItems.length === 0 ? (
          <EmptyState label="No lent item listings" />
        ) : (
          <div className="space-y-2">
            {u.lentItems.map((li) => (
              <div key={li.id} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)] truncate">{li.productName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{fmt(li.createdAt)}</p>
                </div>
                <span className={`text-[0.65rem] font-extrabold rounded-full px-2.5 py-0.5 capitalize ${lentStatusStyles[li.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {li.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ── Tab: Transactions ─────────────────────────────────────────────────────────

function TransactionsTab({ u }: { u: UserDetail }) {
  const [sub, setSub] = useState<"borrower" | "lender">("borrower");
  const items = sub === "borrower" ? u.checkoutsAsBorrower : u.checkoutsAsLender;
  const counterLabel = sub === "borrower" ? "From" : "To";

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-[var(--surface-soft)] rounded-xl p-1">
        {(["borrower", "lender"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSub(t)}
            className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
              sub === t
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--ink)]"
            }`}
          >
            As {t === "borrower" ? "Borrower" : "Lender"} ({t === "borrower" ? u.checkoutsAsBorrower.length : u.checkoutsAsLender.length})
          </button>
        ))}
      </div>

      <Section title={`Checkouts as ${sub === "borrower" ? "Borrower" : "Lender"}`} icon={<ArrowLeftRight className="h-3.5 w-3.5" />} count={items.length}>
        {items.length === 0 ? (
          <EmptyState label="No transactions" />
        ) : (
          <div className="space-y-0">
            {items.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)] truncate">{c.itemName}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {counterLabel}: {c.counterpartyName}
                    {c.startDate && c.endDate && ` · ${fmt(c.startDate)} – ${fmt(c.endDate)}`}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <StatusBadge status={c.status} />
                  {c.totalPrice != null && (
                    <p className="text-xs font-bold text-[var(--ink)]">৳{c.totalPrice}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ── Tab: Requests ─────────────────────────────────────────────────────────────

function RequestsTab({ u }: { u: UserDetail }) {
  return (
    <div className="space-y-4">
      <Section title="Borrow Want-Ads" icon={<FileText className="h-3.5 w-3.5" />} count={u.borrowRequests.length}>
        {u.borrowRequests.length === 0 ? (
          <EmptyState label="No borrow requests" />
        ) : (
          <div className="space-y-0">
            {u.borrowRequests.map((r) => (
              <div key={r.id} className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)] truncate">{r.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {r.category && `${r.category} · `}
                    {fmt(r.neededFrom)} – {fmt(r.neededUntil)}
                    {r.budgetPerDay && ` · ৳${r.budgetPerDay}/day`}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Offers Made as Lender" icon={<Users className="h-3.5 w-3.5" />} count={u.borrowRequestOffers.length}>
        {u.borrowRequestOffers.length === 0 ? (
          <EmptyState label="No offers made" />
        ) : (
          <div className="space-y-0">
            {u.borrowRequestOffers.map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)] truncate">{o.productName}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    For: {o.requestTitle}
                  </p>
                </div>
                <div className="shrink-0 text-right space-y-1">
                  <StatusBadge status={o.status} />
                  <p className="text-xs text-[var(--text-muted)]">{fmt(o.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ── Tab: Disputes ─────────────────────────────────────────────────────────────

function DisputesTab({ u }: { u: UserDetail }) {
  const roleStyle = {
    borrower: "bg-blue-50 text-blue-700",
    lender:   "bg-amber-50 text-amber-700",
  };

  return (
    <Section title="All Disputes" icon={<AlertTriangle className="h-3.5 w-3.5" />} count={u.disputes.length}>
      {u.disputes.length === 0 ? (
        <EmptyState label="No disputes" />
      ) : (
        <div className="space-y-0">
          {u.disputes.map((d) => (
            <div key={`${d.id}-${d.role}`} className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-[var(--ink)] truncate">{d.itemName}</p>
                  <span className={`text-[0.6rem] font-extrabold rounded-full px-2 py-0.5 capitalize ${roleStyle[d.role]}`}>
                    {d.role}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate">{d.title} · {fmt(d.raisedAt)}</p>
              </div>
              <div className="shrink-0 text-right space-y-1">
                <StatusBadge status={d.status} />
                <p className="text-xs font-bold text-[var(--ink)]">৳{d.depositAmount}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ── Tab: Activity ─────────────────────────────────────────────────────────────

type TrailEntry = UserDetail["trailEntries"][number];

function TrailEntryRow({
  entry,
  onToggleVisibility,
  onDelete,
}: {
  entry: TrailEntry;
  onToggleVisibility: (id: string, isPublic: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState<"visibility" | "delete" | null>(null);

  const tags = Array.isArray(entry.tags) ? (entry.tags as string[]) : [];

  async function toggleVisibility() {
    setPending("visibility");
    try {
      const res = await fetch(`/api/admin/trail/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !entry.isPublic }),
      });
      if (res.ok) {
        onToggleVisibility(entry.id, !entry.isPublic);
        toast.success(entry.isPublic ? "Review hidden" : "Review made public");
      } else {
        toast.error("Failed to update visibility");
      }
    } finally {
      setPending(null);
    }
  }

  async function handleDelete() {
    setPending("delete");
    try {
      const res = await fetch(`/api/admin/trail/${entry.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(entry.id);
        toast.success("Review deleted");
      } else {
        toast.error("Failed to delete review");
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="py-3 border-b border-(--border) last:border-0">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-(--ink) truncate">{entry.productName ?? "Unknown item"}</p>
          <p className="text-xs text-(--text-muted) truncate">{entry.useFor}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < entry.itemRating ? "text-amber-400 fill-amber-400" : "text-(--border)"}`} />
            ))}
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded-lg text-(--text-muted) hover:text-(--ink) hover:bg-(--surface-soft) transition-colors"
            title="View details"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={toggleVisibility}
            disabled={pending !== null}
            className="p-1 rounded-lg text-(--text-muted) hover:text-(--ink) hover:bg-(--surface-soft) transition-colors disabled:opacity-50"
            title={entry.isPublic ? "Hide review" : "Make public"}
          >
            {entry.isPublic ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleDelete}
            disabled={pending !== null}
            className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Delete review"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mt-1">
        {entry.anonymous && (
          <span className="text-[0.58rem] font-bold bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">Anon</span>
        )}
        {!entry.isPublic && (
          <span className="text-[0.58rem] font-bold bg-amber-50 text-amber-600 rounded px-1.5 py-0.5">Hidden</span>
        )}
        <span className="text-[0.65rem] text-(--text-muted)">{fmt(entry.createdAt)}</span>
      </div>

      {expanded && (
        <div className="mt-2 rounded-xl bg-(--surface-soft) p-3 space-y-1.5 text-xs text-(--text-muted)">
          <p><span className="font-semibold text-(--ink)">Used for:</span> {entry.useFor}</p>
          {entry.location && <p><span className="font-semibold text-(--ink)">Location:</span> {entry.location}</p>}
          {tags.length > 0 && (
            <p><span className="font-semibold text-(--ink)">Tags:</span> {tags.join(", ")}</p>
          )}
          <p><span className="font-semibold text-(--ink)">Posted:</span> {new Date(entry.createdAt).toISOString()}</p>
        </div>
      )}
    </div>
  );
}

function ActivityTab({
  u,
  onUpdateTrail,
}: {
  u: UserDetail;
  onUpdateTrail: (updater: (entries: TrailEntry[]) => TrailEntry[]) => void;
}) {
  function handleToggleVisibility(id: string, isPublic: boolean) {
    onUpdateTrail((entries) =>
      entries.map((e) => (e.id === id ? { ...e, isPublic } : e))
    );
  }

  function handleDelete(id: string) {
    onUpdateTrail((entries) => entries.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-4">
      <Section title="Trail Posts" icon={<Activity className="h-3.5 w-3.5" />} count={u.trailEntries.length}>
        {u.trailEntries.length === 0 ? (
          <EmptyState label="No trail posts" />
        ) : (
          <div>
            {u.trailEntries.map((t) => (
              <TrailEntryRow
                key={t.id}
                entry={t}
                onToggleVisibility={handleToggleVisibility}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Mentor Bookings" icon={<Video className="h-3.5 w-3.5" />} count={u.mentorBookings.length}>
        {u.mentorBookings.length === 0 ? (
          <EmptyState label="No mentor bookings" />
        ) : (
          <div className="space-y-0">
            {u.mentorBookings.map((b) => (
              <div key={b.id} className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)]">{b.mentorName}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {b.sessionFormat === "VIDEO" ? "Video" : "In-Person"}
                    {b.scheduledAt && ` · ${fmt(b.scheduledAt)}`}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Cart" icon={<ShoppingCart className="h-3.5 w-3.5" />} count={u.cartItems.length}>
        {u.cartItems.length === 0 ? (
          <EmptyState label="Cart is empty" />
        ) : (
          <div className="space-y-0">
            {u.cartItems.map((ci) => (
              <div key={ci.id} className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)] truncate">{ci.itemName}</p>
                  <p className="text-xs text-[var(--text-muted)]">Added {fmt(ci.addedAt)}</p>
                </div>
                <span className="text-sm font-bold text-[var(--ink)]">{ci.days}d</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ── Tab: Reports ──────────────────────────────────────────────────────────────

const REPORT_REASON_LABELS: Record<string, string> = {
  spam:            "Spam",
  scam:            "Scam / Fraud",
  harassment:      "Harassment",
  fake_listing:    "Fake Listing",
  inappropriate:   "Inappropriate Content",
  other:           "Other",
};

const REPORT_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: "bg-amber-50",   text: "text-amber-700", label: "Pending"    },
  reviewed:  { bg: "bg-blue-50",    text: "text-blue-700",  label: "Reviewed"   },
  dismissed: { bg: "bg-gray-100",   text: "text-gray-500",  label: "Dismissed"  },
};

type ReportItem = UserDetail["reports"][number];

function ReportsTab({
  u,
  onUpdateReport,
}: {
  u: UserDetail;
  onUpdateReport: (id: string, status: string) => void;
}) {
  const [pending, setPending] = useState<string | null>(null);

  async function setStatus(reportId: string, status: "reviewed" | "dismissed") {
    setPending(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        onUpdateReport(reportId, status);
        toast.success(status === "reviewed" ? "Marked as reviewed" : "Report dismissed");
      } else {
        toast.error("Failed to update report");
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <Section title="Reports Received" icon={<Flag className="h-3.5 w-3.5" />} count={u.reports.length}>
      {u.reports.length === 0 ? (
        <EmptyState label="No reports against this user" />
      ) : (
        <div>
          {u.reports.map((r: ReportItem) => {
            const st = REPORT_STATUS_STYLES[r.status] ?? { bg: "bg-gray-100", text: "text-gray-500", label: r.status };
            return (
              <div key={r.id} className="py-3 border-b border-(--border) last:border-0 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-(--ink)">
                      {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                    </p>
                    <p className="text-xs text-(--text-muted)">
                      By {r.reporterName} · {fmt(r.createdAt)}
                    </p>
                    {r.description && (
                      <p className="mt-1 text-xs text-(--text-muted) italic line-clamp-2">{r.description}</p>
                    )}
                  </div>
                  <span className={`text-[0.65rem] font-extrabold rounded-full px-2.5 py-0.5 shrink-0 ${st.bg} ${st.text}`}>
                    {st.label}
                  </span>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      disabled={pending === r.id}
                      onClick={() => setStatus(r.id, "reviewed")}
                      className="flex-1 rounded-xl bg-blue-50 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                    >
                      Mark Reviewed
                    </button>
                    <button
                      disabled={pending === r.id}
                      onClick={() => setStatus(r.id, "dismissed")}
                      className="flex-1 rounded-xl bg-gray-100 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="px-6 py-5 space-y-4 animate-pulse">
      <div className="h-28 rounded-2xl bg-[var(--surface-soft)]" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-[var(--surface-soft)]" />)}
      </div>
      <div className="h-24 rounded-2xl bg-[var(--surface-soft)]" />
    </div>
  );
}

// ── Main Console ──────────────────────────────────────────────────────────────

type Tab = "overview" | "verifications" | "listings" | "transactions" | "requests" | "disputes" | "activity" | "reports";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",      label: "Overview",      icon: <User className="h-3.5 w-3.5" /> },
  { id: "verifications", label: "Verifications",  icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  { id: "listings",      label: "Listings",       icon: <Package className="h-3.5 w-3.5" /> },
  { id: "transactions",  label: "Transactions",   icon: <ArrowLeftRight className="h-3.5 w-3.5" /> },
  { id: "requests",      label: "Requests",       icon: <FileText className="h-3.5 w-3.5" /> },
  { id: "disputes",      label: "Disputes",       icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { id: "activity",      label: "Activity",       icon: <Activity className="h-3.5 w-3.5" /> },
  { id: "reports",       label: "Reports",        icon: <Flag className="h-3.5 w-3.5" /> },
];

export default function UserConsole() {
  const [users, setUsers]           = useState<UserListItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail]         = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab]   = useState<Tab>("overview");

  useEffect(() => {
    setUsersLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.ok ? r.json() as Promise<UserListItem[]> : Promise.reject())
      .then((data) => {
        setUsers(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, []);

  const fetchDetail = useCallback((id: string) => {
    setDetailLoading(true);
    setDetail(null);
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.ok ? r.json() as Promise<UserDetail> : Promise.reject())
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, []);

  useEffect(() => {
    if (selectedId) {
      setActiveTab("overview");
      fetchDetail(selectedId);
    }
  }, [selectedId, fetchDetail]);

  function handleUserSelect(id: string) {
    setSelectedId(id);
  }

  function refreshDetail() {
    if (selectedId) fetchDetail(selectedId);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── User Queue sidebar ── */}
      <div className="w-72 shrink-0 overflow-hidden flex flex-col bg-[#12082e] shadow-[1px_0_0_0_rgba(255,255,255,0.07)]">
        {usersLoading ? (
          <div className="flex-1 bg-[#18122e] p-3 space-y-2 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white/5" />
            ))}
          </div>
        ) : (
          <UserQueue users={users} selectedId={selectedId} onSelect={handleUserSelect} />
        )}
      </div>

      {/* ── Detail panel ── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Tab bar */}
        {detail && (
          <div className="flex-shrink-0 flex items-center gap-0.5 px-4 pt-3 pb-0 border-b border-[var(--border)] bg-[var(--surface)] overflow-x-auto scrollbar-none">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg whitespace-nowrap border-b-2 transition-all ${
                  activeTab === t.id
                    ? "text-[var(--primary)] border-[var(--primary)] bg-[var(--primary-soft)]"
                    : "text-[var(--text-muted)] border-transparent hover:text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin bg-(--surface-soft)">
          {detailLoading || !detail ? (
            <DetailSkeleton />
          ) : (
            <div className="px-6 py-5">
              {activeTab === "overview"      && <OverviewTab u={detail} />}
              {activeTab === "verifications" && <VerificationsTab u={detail} onUpdate={refreshDetail} />}
              {activeTab === "listings"      && <ListingsTab u={detail} />}
              {activeTab === "transactions"  && <TransactionsTab u={detail} />}
              {activeTab === "requests"      && <RequestsTab u={detail} />}
              {activeTab === "disputes"      && <DisputesTab u={detail} />}
              {activeTab === "activity"      && (
                <ActivityTab
                  u={detail}
                  onUpdateTrail={(updater) =>
                    setDetail((prev) =>
                      prev ? { ...prev, trailEntries: updater(prev.trailEntries) } : prev
                    )
                  }
                />
              )}
              {activeTab === "reports" && (
                <ReportsTab
                  u={detail}
                  onUpdateReport={(id, status) =>
                    setDetail((prev) =>
                      prev
                        ? { ...prev, reports: prev.reports.map((r) => r.id === id ? { ...r, status } : r) }
                        : prev
                    )
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Action panel ── */}
      <div className="w-[280px] shrink-0 border-l border-[var(--border)] overflow-y-auto scrollbar-thin p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[var(--text-muted)]" />
          <span className="text-[0.65rem] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">
            Admin Actions
          </span>
        </div>
        {detail ? (
          <UserActionPanel user={detail} onUpdate={refreshDetail} />
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] h-64 animate-pulse" />
        )}
      </div>
    </div>
  );
}
