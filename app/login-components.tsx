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
      className="flex w-full items-center justify-center gap-3 rounded-[22px] border border-border/60 bg-[color-mix(in_srgb,var(--surface)_88%,white)] px-5 py-4 text-lg font-semibold text-foreground shadow-[0_10px_26px_rgba(34,27,61,0.07)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-surface-soft"
    >
      <span className="flex h-7 w-7 items-center justify-center">{icon}</span>
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
    <label className="flex w-full items-center gap-3 rounded-[22px] border border-border/60 bg-[color-mix(in_srgb,var(--surface)_92%,white)] px-6 py-4 shadow-[0_10px_26px_rgba(34,27,61,0.07)] backdrop-blur-sm transition-all duration-200 focus-within:border-primary/45 focus-within:bg-surface-soft focus-within:shadow-[0_12px_32px_rgba(59,42,128,0.12)]">
      <input
        type={type}
        placeholder={placeholder}
        className="w-full bg-transparent text-lg text-foreground outline-none placeholder:text-text-muted"
      />
      {trailingIcon ? (
        <span className="shrink-0 text-text-muted">{trailingIcon}</span>
      ) : null}
    </label>
  );
}

export function Divider() {
  return (
    <div className="flex items-center gap-5 px-1 text-lg font-semibold tracking-[0.24em] text-text-secondary">
      <span className="h-px flex-1 bg-border/90" />
      <span>OR</span>
      <span className="h-px flex-1 bg-border/90" />
    </div>
  );
}
