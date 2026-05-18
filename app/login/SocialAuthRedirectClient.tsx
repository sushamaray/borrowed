"use client";

import { useEffect, useMemo } from "react";

import Link from "next/link";
import { signIn } from "next-auth/react";

type SocialAuthRedirectClientProps = {
  provider: "google" | "facebook";
  mode: "login" | "register";
};

const providerLabels: Record<SocialAuthRedirectClientProps["provider"], string> = {
  google: "Google",
  facebook: "Facebook",
};

export default function SocialAuthRedirectClient({
  provider,
  mode,
}: SocialAuthRedirectClientProps) {
  const label = providerLabels[provider];
  const actionWord = mode === "register" ? "Creating account" : "Signing in";
  const heading = useMemo(
    () => `${actionWord} with ${label}`,
    [actionWord, label],
  );
  const supportingCopy = useMemo(
    () =>
      mode === "register"
        ? `Please wait while we redirect you to ${label} to create your Borrowed account.`
        : `Please wait while we redirect you to ${label} to finish authentication.`,
    [label, mode],
  );

  useEffect(() => {
    void signIn(provider, { callbackUrl: "/" });
  }, [provider]);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background px-6 py-8">
      <div className="flex w-full items-center justify-center">
        <section className="flex min-h-[360px] w-full max-w-[760px] items-center justify-center rounded-[24px] border border-border/90 bg-[radial-gradient(circle_at_top,rgba(224,244,244,0.72),rgba(255,255,255,0.97)_40%,rgba(255,255,255,1)_100%)] px-8 py-10 shadow-[0_24px_72px_rgba(12,32,30,0.11)] sm:px-10">
          <div className="w-full max-w-[620px] text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft shadow-[0_10px_30px_rgba(47,158,68,0.16)]">
              <div className="relative h-11 w-11 animate-spin rounded-full bg-[conic-gradient(from_220deg,var(--success-soft)_0deg,var(--success)_120deg,var(--success)_245deg,var(--success-soft)_360deg)]">
                <div className="absolute inset-[4px] rounded-full bg-white" />
                <div className="absolute inset-[10px] rounded-full bg-success-soft/80" />
              </div>
            </div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-text-muted">
              Borrowed
            </p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-primary sm:text-[3.25rem]">
              {heading}
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] text-base leading-7 text-text-secondary">
              {supportingCopy}
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href={mode === "register" ? "/register" : "/login"}
                className="inline-flex min-w-44 items-center justify-center rounded-full bg-text-secondary px-6 py-4 text-sm font-bold uppercase text-white shadow-[0_14px_28px_rgba(103,93,139,0.24)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-primary active:translate-y-0 active:bg-ink"
              >
                Go back
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
