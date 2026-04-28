"use client";

type StatusType = "active" | "pending" | "completed" | "overdue";

type ActivityItemProps = {
  title: string;
  subtitle: string;
  timestamp: string;
  status: StatusType;
  icon?: React.ReactNode;
};

const statusConfig = {
  active: {
    label: "Active",
    color: "bg-[var(--status-success-soft)] text-[var(--status-success)]",
    dot: "bg-[var(--status-success)]",
  },
  pending: {
    label: "Pending",
    color: "bg-[var(--status-warning-soft)] text-[var(--status-warning)]",
    dot: "bg-[var(--status-warning)]",
  },
  completed: {
    label: "Completed",
    color: "bg-[var(--primary-soft)] text-[var(--primary)]",
    dot: "bg-[var(--primary)]",
  },
  overdue: {
    label: "Overdue",
    color: "bg-[var(--status-danger-soft)] text-[var(--status-danger)]",
    dot: "bg-[var(--status-danger)]",
  },
};

export default function ActivityItem({
  title,
  subtitle,
  timestamp,
  status,
  icon,
}: ActivityItemProps) {
  const config = statusConfig[status];

  return (
    <div className="group flex gap-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-200 hover:bg-[var(--surface-soft)] hover:shadow-md hover:border-[var(--primary)]/30">
      {/* Timeline dot */}
      <div className="mt-1 flex flex-col items-center">
        <div className={`h-3 w-3 rounded-full transition-all ${config.dot}`} />
        <div className="mt-1 h-6 w-0.5 bg-[var(--border)]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-semibold text-[var(--foreground)]">
              {title}
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${config.color}`}>
              {config.label}
            </span>
            {icon && <div className="flex-shrink-0 text-[var(--text-secondary)]">{icon}</div>}
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          {timestamp}
        </p>
      </div>
    </div>
  );
}
