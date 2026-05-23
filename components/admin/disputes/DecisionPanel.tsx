"use client";

import { useState } from "react";
import { Landmark, RotateCcw, Scissors, CheckCircle2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

type Decision = "RELEASE_TO_LENDER" | "RETURN_TO_BORROWER" | "SPLIT";

const OPTIONS: { id: Decision; label: string; sub: string; icon: React.ReactNode; color: string; activeBg: string }[] = [
  {
    id: "RELEASE_TO_LENDER",
    label: "Release to lender",
    sub: "Full deposit → lender",
    icon: <Landmark className="h-4 w-4" />,
    color: "text-red-600",
    activeBg: "border-red-300 bg-red-50",
  },
  {
    id: "RETURN_TO_BORROWER",
    label: "Return to borrower",
    sub: "Full deposit → borrower",
    icon: <RotateCcw className="h-4 w-4" />,
    color: "text-emerald-600",
    activeBg: "border-emerald-300 bg-emerald-50",
  },
  {
    id: "SPLIT",
    label: "Split deposit",
    sub: "Custom percentage",
    icon: <Scissors className="h-4 w-4" />,
    color: "text-amber-600",
    activeBg: "border-amber-300 bg-amber-50",
  },
];

export default function DecisionPanel({
  depositAmount,
  caseId,
  onResolved,
}: {
  depositAmount: number;
  caseId: string;
  onResolved?: () => void;
}) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [splitPercent, setSplitPercent] = useState(50);
  const [justification, setJustification] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const lenderAmt  = decision === "RELEASE_TO_LENDER" ? depositAmount
                   : decision === "SPLIT"              ? Math.round(depositAmount * splitPercent / 100)
                   : 0;
  const borrowAmt  = depositAmount - lenderAmt;
  const canConfirm = decision !== null && justification.trim().length >= 20 && !submitting;

  async function handleConfirm() {
    if (!canConfirm) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/disputes/${caseId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionType: decision,
          amountToLender:   decision === "RETURN_TO_BORROWER" ? 0 : lenderAmt,
          amountToBorrower: decision === "RELEASE_TO_LENDER"  ? 0 : borrowAmt,
          justification: justification.trim(),
        }),
      });

      if (res.ok) {
        setConfirmed(true);
        onResolved?.();
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string };
        toast.error(data.error ?? "Failed to record decision");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm flex flex-col items-center justify-center min-h-64 text-center gap-3">
        <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </div>
        <div className="font-extrabold text-[var(--ink)]">Decision Recorded</div>
        <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Case <strong>{caseId.slice(-6).toUpperCase()}</strong> has been resolved. Both parties will be notified.
        </div>
        <span className="bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-extrabold">
          Resolved
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm flex flex-col gap-4">
      {/* Deposit amount */}
      <div className="rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] p-3">
        <div className="text-[0.62rem] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-1">
          Disputed Deposit
        </div>
        <div className="text-3xl font-black text-[var(--ink)] tracking-tight leading-none">
          ৳{depositAmount.toLocaleString()}
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-1">
          #{caseId.slice(-6).toUpperCase()}
        </div>
      </div>

      <div className="h-px bg-[var(--border)]" />

      {/* Decision options */}
      <div>
        <div className="text-xs font-extrabold text-[var(--ink)] mb-2">Admin Decision</div>
        <div className="space-y-2">
          {OPTIONS.map((o) => {
            const on = decision === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setDecision(o.id)}
                className={`w-full text-left rounded-xl border-2 px-3.5 py-3 transition-all ${
                  on ? o.activeBg : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--primary-soft)]"
                }`}
              >
                <div className={`flex items-center gap-2 font-extrabold text-sm mb-0.5 ${on ? o.color : "text-[var(--ink)]"}`}>
                  <span className={on ? o.color : "text-[var(--text-muted)]"}>{o.icon}</span>
                  {o.label}
                </div>
                <div className="text-xs text-[var(--text-muted)]">{o.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Split slider */}
      {decision === "SPLIT" && (
        <div className="rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] p-3 space-y-2">
          <div className="flex justify-between text-sm font-extrabold">
            <div className="text-center">
              <div className="text-red-600 text-base">৳{lenderAmt.toLocaleString()}</div>
              <div className="text-[0.62rem] text-[var(--text-muted)]">→ Lender</div>
            </div>
            <div className="text-center">
              <div className="text-emerald-600 text-base">৳{borrowAmt.toLocaleString()}</div>
              <div className="text-[0.62rem] text-[var(--text-muted)]">→ Borrower</div>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={splitPercent}
            onChange={(e) => setSplitPercent(Number(e.target.value))}
            className="w-full cursor-pointer"
            style={{ accentColor: "#5b3dbf" }}
          />
          <div className="flex justify-between text-[0.62rem] text-[var(--text-muted)]">
            <span>0% to lender</span>
            <span className="font-extrabold text-[var(--primary)]">{splitPercent}% to lender</span>
            <span>100% to lender</span>
          </div>
        </div>
      )}

      {/* Justification */}
      <div>
        <div className="text-xs font-extrabold text-[var(--ink)] mb-1.5">
          Written Justification <span className="text-red-500">*</span>
        </div>
        <textarea
          rows={4}
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="Describe the basis for this decision (min. 20 characters)…"
          className={`w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--text-muted)] bg-[var(--surface-soft)] focus:outline-none transition-colors leading-relaxed ${
            justification.length > 0 && justification.length < 20
              ? "border-red-300 focus:border-red-400"
              : "border-[var(--border)] focus:border-[var(--primary)]"
          }`}
        />
        <div className="flex justify-end mt-1">
          {justification.length >= 20 ? (
            <span className="text-[0.65rem] text-emerald-600 font-semibold">✓ Sufficient detail</span>
          ) : (
            <span className="text-[0.65rem] text-[var(--text-muted)]">{justification.length}/20 min.</span>
          )}
        </div>
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={!canConfirm}
        className={`flex items-center justify-center gap-2 w-full rounded-full py-3 font-extrabold text-sm transition-all ${
          canConfirm
            ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-[0_4px_14px_rgba(91,61,191,0.35)]"
            : "bg-[var(--surface-soft)] text-[var(--text-muted)] cursor-not-allowed"
        }`}
      >
        {submitting ? "Recording…" : "Confirm Decision"}
        {!submitting && <ArrowRight className="h-4 w-4" />}
      </button>

      <p className="text-[0.65rem] text-[var(--text-muted)] text-center leading-relaxed">
        This action is permanent. Both parties will be notified.
      </p>
    </div>
  );
}
