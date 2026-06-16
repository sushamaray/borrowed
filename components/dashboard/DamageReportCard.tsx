"use client";

interface DamageReportCardProps {
  aiDamageVerdict: string | null;
  aiDamageConfidence: number | null;
  aiDamageNotes: string | null;
  aiDamageCheckedAt: string | null;
  beforePhotoId: string | null;
  afterPhotoId: string | null;
}

const verdictConfig = {
  damaged: {
    label: "Potential damage detected",
    banner: "bg-amber-50 border-amber-200 text-amber-800",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
  },
  no_damage: {
    label: "No damage detected",
    banner: "bg-emerald-50 border-emerald-200 text-emerald-800",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  unclear: {
    label: "AI analysis inconclusive",
    banner: "bg-blue-50 border-blue-200 text-blue-800",
    bar: "bg-blue-400",
    dot: "bg-blue-400",
  },
};

export default function DamageReportCard({
  aiDamageVerdict,
  aiDamageConfidence,
  aiDamageNotes,
  aiDamageCheckedAt,
  beforePhotoId,
  afterPhotoId,
}: DamageReportCardProps) {
  if (!aiDamageVerdict) return null;

  const config =
    verdictConfig[aiDamageVerdict as keyof typeof verdictConfig] ??
    verdictConfig.unclear;

  const checkedAt = aiDamageCheckedAt
    ? new Date(aiDamageCheckedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${config.banner}`}
        >
          <span className={`h-2 w-2 rounded-full ${config.dot}`} />
          AI Damage Report — {config.label}
        </span>
      </div>

      {aiDamageNotes && (
        <p className="mb-3 text-sm text-[var(--text-muted)]">{aiDamageNotes}</p>
      )}

      {aiDamageConfidence !== null && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>AI confidence</span>
            <span className="font-bold">{aiDamageConfidence}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className={`h-full rounded-full ${config.bar} transition-all`}
              style={{ width: `${aiDamageConfidence}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Before
          </p>
          {beforePhotoId ? (
            <img
              src={`/api/condition-photos/${beforePhotoId}`}
              alt="Item condition before borrowing"
              className="h-28 w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-28 w-full items-center justify-center rounded-xl bg-[var(--surface-soft)] text-xs text-[var(--text-muted)]">
              No photo
            </div>
          )}
        </div>
        <div>
          <p className="mb-1 text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
            After
          </p>
          {afterPhotoId ? (
            <img
              src={`/api/condition-photos/${afterPhotoId}`}
              alt="Item condition after return"
              className="h-28 w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-28 w-full items-center justify-center rounded-xl bg-[var(--surface-soft)] text-xs text-[var(--text-muted)]">
              No photo
            </div>
          )}
        </div>
      </div>

      {checkedAt && (
        <p className="mt-2 text-right text-[0.68rem] text-[var(--text-muted)]">
          Checked {checkedAt}
        </p>
      )}
    </div>
  );
}
