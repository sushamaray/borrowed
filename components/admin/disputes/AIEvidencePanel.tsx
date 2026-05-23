import { Zap, ImageOff } from "lucide-react";

const VERDICT_CONFIG = {
  lender_favored: {
    label: "Possible damage — see highlight",
    bannerBg: "bg-amber-50 border-amber-100",
    iconBg:   "bg-amber-500",
    textColor: "text-amber-700",
    barColor:  "bg-amber-400",
  },
  borrower_favored: {
    label: "No damage detected",
    bannerBg: "bg-emerald-50 border-emerald-100",
    iconBg:   "bg-emerald-500",
    textColor: "text-emerald-700",
    barColor:  "bg-emerald-500",
  },
  inconclusive: {
    label: "Inconclusive — manual review required",
    bannerBg: "bg-blue-50 border-blue-100",
    iconBg:   "bg-blue-500",
    textColor: "text-blue-700",
    barColor:  "bg-blue-400",
  },
};

function PhotoBox({
  label,
  date,
  badge,
  badgeCls,
  photoUrl,
  flagged,
  confidence,
}: {
  label: string;
  date: string;
  badge: string;
  badgeCls: string;
  photoUrl?: string | null;
  flagged?: boolean;
  confidence?: number | null;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[0.67rem] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">
          {label} · {date}
        </span>
        <span className={`text-[0.6rem] font-extrabold rounded-full px-2 py-0.5 ${badgeCls}`}>
          {badge}
        </span>
      </div>

      <div
        className={`relative h-40 rounded-xl overflow-hidden border-2 ${
          flagged ? "border-red-400" : "border-[var(--border)]"
        } bg-gradient-to-br from-violet-950 to-violet-800 flex items-center justify-center`}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={label} className="absolute inset-0 w-full h-full object-contain" />
        ) : (
          <ImageOff className="h-10 w-10 text-white/20" />
        )}

        {/* Damage highlight for flagged photo */}
        {flagged && (
          <div className="absolute top-[32%] left-[26%] w-[40%] h-[32%] border-2 border-red-400 rounded-lg">
            <div className="absolute -top-5 left-0 bg-red-500 text-white text-[0.5rem] font-extrabold px-1.5 py-0.5 rounded-sm whitespace-nowrap tracking-wide">
              AI FLAGGED · {confidence ?? "?"}%
            </div>
            {/* Simulated scratch line */}
            <div
              className="absolute top-1/2 left-[15%] w-[70%] h-0.5 bg-red-400/60 rounded"
              style={{ transform: "rotate(-12deg)" }}
            />
          </div>
        )}

        {flagged && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-red-500/90 text-white text-[0.55rem] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
              AI FLAGGED
            </span>
          </div>
        )}

        {!flagged && (
          <div className="absolute bottom-2 left-2">
            <span className="text-white/40 text-[0.58rem] font-semibold">4 photos · all angles</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIEvidencePanel({
  aiVerdict,
  aiConfidence,
  aiNotes,
  beforePhotoUrl,
  afterPhotoUrl,
  raisedAt,
}: {
  aiVerdict?: string | null;
  aiConfidence?: number | null;
  aiNotes?: string | null;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  raisedAt: string;
}) {
  const cfg = VERDICT_CONFIG[aiVerdict as keyof typeof VERDICT_CONFIG] ?? VERDICT_CONFIG.inconclusive;
  const conf = aiConfidence ?? 0;

  const returnDate = new Date(raisedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <div>
      {/* Verdict banner */}
      <div className={`flex items-center gap-3 rounded-xl border p-3 mb-4 ${cfg.bannerBg}`}>
        <div className={`h-8 w-8 rounded-lg ${cfg.iconBg} flex items-center justify-center shrink-0`}>
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-[var(--ink)] text-sm">
            AI Verdict: <span className={cfg.textColor}>{cfg.label}</span>
          </div>
          {aiNotes && (
            <div className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{aiNotes}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className={`text-2xl font-black leading-none ${cfg.textColor}`}>{conf}%</div>
          <div className="text-[0.62rem] text-[var(--text-muted)] mt-0.5">confidence</div>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-4">
        <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${cfg.barColor}`}
            style={{ width: `${conf}%` }}
          />
        </div>
      </div>

      {/* Photo comparison */}
      <div className="grid grid-cols-2 gap-3">
        <PhotoBox
          label="Pickup"
          date="Apr 15"
          badge="Clean"
          badgeCls="bg-emerald-50 text-emerald-700"
          photoUrl={beforePhotoUrl}
          flagged={false}
        />
        <PhotoBox
          label="Return"
          date={returnDate}
          badge="Flagged"
          badgeCls="bg-red-50 text-red-600"
          photoUrl={afterPhotoUrl}
          flagged={!!aiVerdict && aiVerdict !== "borrower_favored"}
          confidence={aiConfidence}
        />
      </div>
    </div>
  );
}
