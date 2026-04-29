"use client";
import React from "react";

type FeaturedCardProps = {
  title: string;
  subtitle?: string;
  description: string;
  cta: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  icon?: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger";
  image?: string;
  onDismiss?: () => void;
};

const variantGradients = {
  primary: "from-[var(--primary-soft)] to-[var(--surface)] border-[var(--primary)]/20",
  success: "from-[var(--success-soft)] to-[var(--surface)] border-[var(--success)]/20",
  warning: "from-[var(--warning-soft)] to-[var(--surface)] border-[var(--warning)]/20",
  danger: "from-[var(--danger-soft)] to-[var(--surface)] border-[var(--danger)]/20",
};

const variantAccents = {
  primary: "bg-[var(--primary)]/5",
  success: "bg-[var(--success)]/5",
  warning: "bg-[var(--warning)]/5",
  danger: "bg-[var(--danger)]/5",
};

const variantButtons = {
  primary: "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white",
  success: "bg-[var(--success)] hover:bg-[var(--success)] text-white",
  warning: "bg-[var(--warning)] hover:bg-[var(--warning)] text-white",
  danger: "bg-[var(--danger)] hover:bg-[var(--danger)] text-white",
};

const variantIcons = {
  primary: "text-[var(--primary)]",
  success: "text-[var(--success)]",
  warning: "text-[var(--warning)]",
  danger: "text-[var(--danger)]",
};

export default function FeaturedCard({
  title,
  subtitle,
  description,
  cta,
  icon,
  variant = "primary",
  onDismiss,
}: FeaturedCardProps) {
  const Component = cta.href ? "a" : "button";
  const componentProps = cta.href ? { href: cta.href } : { onClick: cta.onClick };

  return (
    <div
      className={`group relative overflow-hidden rounded-[12px] border bg-gradient-to-br p-8 transition-all duration-300 hover:shadow-xl shadow-lg ${variantGradients[variant]}`}
    >
      {/* Accent decoration */}
      <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full ${variantAccents[variant]} blur-3xl`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            {subtitle && (
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                {subtitle}
              </p>
            )}
            <h3 className="mt-2 text-3xl font-bold text-[var(--foreground)]">
              {title}
            </h3>
          </div>
          {icon && (
            <div className={`flex-shrink-0 ${variantIcons[variant]}`}>
              {icon}
            </div>
          )}
        </div>

        <p className="mb-8 text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
          {description}
        </p>

        <div className="flex items-center gap-3">
          <Component
            {...componentProps}
            className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200 hover:shadow-lg active:scale-95 ${variantButtons[variant]}`}
          >
            {cta.label}
            <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Component>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors p-2 rounded-lg hover:bg-white/20"
              aria-label="Dismiss"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
