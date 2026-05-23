import type { DisputeParty } from "@/lib/disputes/types";

function TrustBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-400" : "bg-red-500";
  const textColor =
    score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-red-600";
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-bold text-[var(--text-secondary)]">Trust score</span>
        <span className={`text-xs font-extrabold ${textColor}`}>{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function PartyCard({
  party,
  role,
  verdict,
}: {
  party: DisputeParty;
  role: "borrower" | "lender";
  verdict?: string | null;
}) {
  const isBorrower = role === "borrower";

  return (
    <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="text-[0.62rem] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-3">
        {role}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0 shadow-md"
          style={{
            background: `linear-gradient(135deg, ${isBorrower ? "#5b3dbf" : "#3b2a80"}, ${isBorrower ? "#7c5cbf" : "#5b3dbf"})`,
          }}
        >
          {party.initials}
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-[var(--ink)] text-sm truncate">{party.name}</div>
          <div className="text-xs text-[var(--text-muted)]">Member since {party.memberSince}</div>
        </div>
        {isBorrower && verdict === "lender_favored" && (
          <span className="ml-auto shrink-0 text-[0.62rem] font-extrabold bg-amber-50 text-amber-700 rounded-full px-2.5 py-1">
            Under review
          </span>
        )}
        {!isBorrower && (
          <span className="ml-auto shrink-0 text-[0.62rem] font-extrabold bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1">
            Claimant
          </span>
        )}
      </div>

      <TrustBar score={party.trustScore} />

      <div className="flex gap-5">
        {[
          { label: "Borrows", value: party.borrowCount },
          { label: "Lends",   value: party.lendCount },
        ].map((s) => (
          <div key={s.label}>
            <div className="font-extrabold text-[var(--ink)] text-base leading-none">{s.value}</div>
            <div className="text-[0.62rem] text-[var(--text-muted)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PartyCards({
  borrower,
  lender,
  verdict,
}: {
  borrower: DisputeParty;
  lender: DisputeParty;
  verdict?: string | null;
}) {
  return (
    <div className="flex gap-3 items-stretch">
      <PartyCard party={borrower} role="borrower" verdict={verdict} />
      <div className="flex items-center text-[var(--text-muted)] shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>
      <PartyCard party={lender} role="lender" verdict={verdict} />
    </div>
  );
}
