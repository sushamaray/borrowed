import { Divider, SocialButton, TextField } from "./login-components";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.6 3.5 14.5 2.6 12 2.6A9.4 9.4 0 0 0 2.6 12 9.4 9.4 0 0 0 12 21.4c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.9H12Z"
      />
      <path
        fill="#34A853"
        d="M2.6 7.4 5.8 9.8A6 6 0 0 1 12 6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.6 3.5 14.5 2.6 12 2.6c-3.6 0-6.8 2.1-8.3 4.8Z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.4c2.5 0 4.6-.8 6.1-2.3l-2.8-2.2c-.8.6-1.8 1.1-3.3 1.1-3.8 0-5.1-2.6-5.4-3.8l-3.2 2.5c1.5 2.8 4.6 4.7 8.6 4.7Z"
      />
      <path
        fill="#4285F4"
        d="M21 12.2c0-.6-.1-1.1-.2-1.9H12v3.9h5.4a4.8 4.8 0 0 1-2 2.9l2.8 2.2c1.6-1.5 2.8-3.9 2.8-7.1Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M13.6 20v-6h2l.3-2.3h-2.3v-1.5c0-.7.2-1.2 1.2-1.2H16V6.9c-.2 0-.9-.1-1.8-.1-1.8 0-3.1 1.1-3.1 3.3v1.7H9v2.3h2.1V20h2.5Z"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path
        fill="currentColor"
        d="M3.3 4.7 2 6l3.1 3.1C3.2 10.6 2 12 2 12s3.6 6 10 6c2 0 3.7-.6 5.1-1.4L20.7 20 22 18.7 3.3 4.7ZM12 16c-3.5 0-6-2.8-7.2-4 0 0 .7-.8 2-1.7l1.7 1.7A3.9 3.9 0 0 0 12 16Zm0-8c3.5 0 6 2.8 7.2 4-.5.6-1.6 1.8-3.2 2.8l-1.7-1.7a3.9 3.9 0 0 0-5.4-5.4L7.4 6.3C8.7 5.5 10.2 5 12 5Z"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--background)_0%,color-mix(in_srgb,var(--background)_72%,var(--secondary))_34%,color-mix(in_srgb,var(--background)_56%,var(--primary))_72%,color-mix(in_srgb,var(--background)_68%,var(--accent))_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0.12)_32%,rgba(255,255,255,0.02)_58%,rgba(255,255,255,0.14)_100%)]" />
      <div className="absolute inset-x-[-12%] top-[-12%] h-[24rem] rounded-full bg-white/35 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(244,248,255,0)_0%,rgba(244,248,255,0.04)_38%,rgba(244,248,255,0.28)_72%,rgba(244,248,255,0.36)_100%)]" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-12 pt-20">
        <header className="mb-14">
          <p className="text-2xl font-bold tracking-tight text-primary-strong">
            Welcome to
          </p>
          <h1 className="text-6xl font-extrabold leading-none tracking-[-0.06em] text-primary-strong">
            Borrowed
          </h1>
        </header>

        <div className="space-y-6">
          <SocialButton provider="Google" icon={<GoogleIcon />} />
          <SocialButton provider="Facebook" icon={<FacebookIcon />} />
        </div>

        <div className="my-10">
          <Divider />
        </div>

        <form className="mx-[-2px] space-y-5">
          <TextField placeholder="Enter Your Email or Phone Number" />
          <TextField
            type="password"
            placeholder="Password"
            trailingIcon={<EyeOffIcon />}
          />

          <div className="flex items-center justify-between gap-4 px-1 text-base font-medium text-foreground">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-primary-strong/40 bg-transparent accent-[var(--primary-strong)]"
              />
              <span>Remember me</span>
            </label>
            <button type="button" className="text-primary-strong">
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="mt-8 w-full rounded-[20px] bg-primary px-5 py-5 text-2xl font-bold text-white shadow-[0_16px_30px_rgba(88,88,198,0.24)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Login
          </button>
        </form>

        <p className="mt-8 text-center text-lg font-semibold text-foreground">
          Don&apos;t have an account?{" "}
          <button type="button" className="text-surface-strong">
            Sign Up Now!
          </button>
        </p>
      </section>
    </main>
  );
}
