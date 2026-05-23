import {
  Package, Camera, Clock, AlertTriangle, Shield, CheckCircle2,
  MessageSquare, RefreshCw,
} from "lucide-react";
import type { DisputeEventItem } from "@/lib/disputes/types";

const ICON_MAP: Record<string, React.ReactNode> = {
  pickup:           <Package       className="h-3 w-3" />,
  photo_uploaded:   <Camera        className="h-3 w-3" />,
  return_initiated: <Clock         className="h-3 w-3" />,
  raised:           <AlertTriangle className="h-3 w-3" />,
  status_changed:   <Shield        className="h-3 w-3" />,
  resolved:         <CheckCircle2  className="h-3 w-3" />,
  message:          <MessageSquare className="h-3 w-3" />,
  escalated:        <RefreshCw     className="h-3 w-3" />,
};

const ROLE_COLOR: Record<string, string> = {
  borrower: "#5b3dbf",
  lender:   "#3b2a80",
  admin:    "#0369a1",
  system:   "#9489b8",
};

const ROLE_BG: Record<string, string> = {
  borrower: "bg-violet-100 text-violet-700",
  lender:   "bg-indigo-100 text-indigo-700",
  admin:    "bg-blue-100 text-blue-700",
  system:   "bg-gray-100 text-gray-500",
};

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
    " · " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const LABEL_MAP: Record<string, string> = {
  pickup:           "Item picked up",
  photo_uploaded:   (e: DisputeEventItem) => e.body ?? "Condition photos saved",
  return_initiated: "Return initiated",
  raised:           "Damage dispute raised",
  status_changed:   (e: DisputeEventItem) => e.body ?? "Status changed",
  resolved:         "Dispute resolved",
  message:          (e: DisputeEventItem) => e.body ?? "Message sent",
  escalated:        "Escalated to admin",
} as unknown as Record<string, string>;

function getLabel(e: DisputeEventItem): string {
  const entry = LABEL_MAP[e.type];
  if (!entry) return e.body ?? e.type;
  if (typeof entry === "function") return (entry as (e: DisputeEventItem) => string)(e);
  return entry;
}

export default function TransactionTimeline({ events }: { events: DisputeEventItem[] }) {
  return (
    <div className="relative pl-3">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#5b3dbf44] to-transparent" />

      <div className="space-y-4">
        {events.map((e, i) => {
          const color = ROLE_COLOR[e.actorRole] ?? "#9489b8";
          const roleBg = ROLE_BG[e.actorRole] ?? "bg-gray-100 text-gray-500";
          const icon = ICON_MAP[e.type] ?? <Clock className="h-3 w-3" />;
          const isSystem = e.actorRole === "system";

          return (
            <div key={e.id ?? i} className="flex gap-3 relative">
              {/* Icon dot */}
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2"
                style={{
                  background: isSystem ? "var(--surface-soft)" : `${color}18`,
                  borderColor: isSystem ? "var(--border)" : `${color}44`,
                  color,
                }}
              >
                {icon}
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[var(--ink)] text-sm">{getLabel(e)}</span>
                  {!isSystem && (
                    <span className={`text-[0.6rem] font-extrabold rounded-full px-2 py-0.5 ${roleBg}`}>
                      {e.actorRole}
                    </span>
                  )}
                </div>
                <div className="text-[0.7rem] text-[var(--text-muted)] mt-0.5">{fmt(e.createdAt)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
