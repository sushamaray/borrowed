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
      className="flex w-full items-center justify-center gap-3 rounded-[20px] border border-white/45 bg-surface px-5 py-5 text-lg font-semibold text-foreground shadow-[var(--shadow)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5"
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
    <label className="flex w-full items-center gap-3 rounded-[20px] border border-white/45 bg-surface px-6 py-5 shadow-[var(--shadow)] backdrop-blur-sm">
      <input
        type={type}
        placeholder={placeholder}
        className="w-full bg-transparent text-lg text-foreground outline-none placeholder:text-muted"
      />
      {trailingIcon ? (
        <span className="shrink-0 text-muted">{trailingIcon}</span>
      ) : null}
    </label>
  );
}

export function Divider() {
  return (
    <div className="flex items-center gap-5 text-lg font-semibold tracking-[0.24em] text-foreground/90">
      <span className="h-px flex-1 bg-line" />
      <span>OR</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
