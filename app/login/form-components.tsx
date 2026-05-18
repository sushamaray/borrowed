import Link from "next/link";
import type { InputHTMLAttributes, ReactNode } from "react";

type SocialButtonProps = {
  provider: "Google" | "Facebook";
  icon: ReactNode;
  href: string;
  actionLabel?: "Login" | "Sign up" | "Continue";
};

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  placeholder: string;
  trailingIcon?: ReactNode;
  trailingElement?: ReactNode;
};

export function SocialButton({
  provider,
  icon,
  href,
  actionLabel = "Login",
}: SocialButtonProps) {
  return (
    <Link
      href={href}
      className="social-login-button flex w-full items-center justify-center gap-3 rounded-full border border-transparent bg-surface-soft px-5 py-4 text-base font-semibold text-text-secondary transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-soft hover:text-primary"
    >
      <span className="social-login-button-icon flex h-6 w-6 items-center justify-center [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </span>
      <span>{actionLabel} with {provider}</span>
    </Link>
  );
}

export function TextField({
  placeholder,
  trailingIcon,
  trailingElement,
  className,
  ...inputProps
}: TextFieldProps) {
  return (
    <label className="login-text-field flex w-full items-center gap-3 rounded-full border border-transparent bg-surface-soft px-5 py-4 transition-all duration-200 focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-[0_10px_24px_rgba(26,107,110,0.12)]">
      <input
        placeholder={placeholder}
        className={`login-text-field-input w-full bg-transparent text-base font-medium text-foreground outline-none placeholder:text-text-muted ${className ?? ""}`.trim()}
        {...inputProps}
      />
      {trailingIcon ? (
        <span className="login-text-field-icon shrink-0 text-text-muted [&>svg]:h-6 [&>svg]:w-6">
          {trailingIcon}
        </span>
      ) : null}
      {trailingElement}
    </label>
  );
}

export function Divider() {
  return (
    <div className="login-divider flex items-center gap-4 px-1 text-xs font-semibold uppercase text-text-muted">
      <span className="login-divider-line h-px flex-1 bg-border/90" />
      <span>OR</span>
      <span className="login-divider-line h-px flex-1 bg-border/90" />
    </div>
  );
}
