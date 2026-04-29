"use client";

import React from "react";

type StatCardProps = {
  title: string;
  value: number | string;
  subtitle?: string;
  quickView?: string;
  quickViewLabel?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  href?: string;
};

const variantClasses = {
  default: "bg-[var(--surface)] border-[var(--border)] text-[var(--primary)]",
  success: "bg-[var(--success-soft)] border-[var(--success)]/20 text-[var(--success)]",
  warning: "bg-[var(--warning-soft)] border-[var(--warning)]/20 text-[var(--warning)]",
  danger: "bg-[var(--danger-soft)] border-[var(--danger)]/20 text-[var(--danger)]",
  info: "bg-[var(--primary-soft)] border-[var(--primary)]/20 text-[var(--primary)]",
};

const sizeClasses = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

const iconSizeClasses = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export default function StatCard({
  title,
  value,
  subtitle,
  quickView,
  quickViewLabel,
  icon,
  variant = "default",
  size = "md",
  onClick,
  href,
}: StatCardProps) {
  const content = (
    <div className="flex h-full flex-col">
      {/* Header with Icon - Fixed alignment */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {title}
          </p>
        </div>
        {icon && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
            <span className={iconSizeClasses[size]}>{icon}</span>
          </div>
        )}
      </div>

      {/* Value Section - Prevents overlap */}
      <div className="mb-auto">
        <p className="text-4xl font-bold text-[var(--foreground)] break-words">
          {value}
        </p>
        {subtitle && (
          <p className="mt-2 text-xs text-[var(--text-muted)] line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>

      {/* Quick View Section */}
      {quickView && (
        <div className="mt-4 border-t border-[var(--border)] pt-3">
          {quickViewLabel && (
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              {quickViewLabel}
            </p>
          )}
          <p className="text-xs text-[var(--foreground)] line-clamp-2 font-medium">
            {quickView}
          </p>
        </div>
      )}
    </div>
  );

  const classes = `
    group relative rounded-lg border transition-all duration-200 flex flex-col
    hover:shadow-md hover:border-primary/70 hover:bg-opacity-80 cursor-pointer
    ${size === "lg" ? "min-h-[200px]" : size === "md" ? "min-h-[160px]" : "min-h-auto"}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
  `;

  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {content}
    </button>
  );
}