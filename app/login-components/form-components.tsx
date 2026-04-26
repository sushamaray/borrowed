type SocialButtonProps = {
  provider: "Google" | "Facebook";
  icon: React.ReactNode;
};

type TextFieldProps = {
  type?: string;
  placeholder: string;
  trailingIcon?: React.ReactNode;
};

export function SocialButton({ provider, icon }: SocialButtonProps) {
  return (
    <button
      type="button"
      className="social-login-button flex w-full items-center justify-center gap-3 rounded-full border border-transparent bg-surface-soft px-5 py-4 text-base font-semibold text-text-secondary transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-soft hover:text-primary"
    >
      <span className="social-login-button-icon flex h-6 w-6 items-center justify-center [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </span>
      <span>Login with {provider}</span>
    </button>
  );
}

export function TextField({
  type = "text",
  placeholder,
  trailingIcon,
}: TextFieldProps) {
  return (
    <label className="login-text-field flex w-full items-center gap-3 rounded-full border border-transparent bg-surface-soft px-5 py-4 transition-all duration-200 focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-[0_10px_24px_rgba(122,108,240,0.12)]">
      <input
        type={type}
        placeholder={placeholder}
        className="login-text-field-input w-full bg-transparent text-base font-medium text-foreground outline-none placeholder:text-text-muted"
      />
      {trailingIcon ? (
        <span className="login-text-field-icon shrink-0 text-text-muted [&>svg]:h-6 [&>svg]:w-6">
          {trailingIcon}
        </span>
      ) : null}
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
