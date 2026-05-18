"use client";

import type { FormEvent } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Divider, SocialButton, TextField } from "./form-components";

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

export default function LoginClient() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("[login-client] Submitting login form", {
      identifier,
      passwordLength: password.length,
    });
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          password,
        }),
      });
      const data = (await response.json()) as {
        message?: string;
        user?: { id: string; email: string; userName: string; name: string };
      };

      console.log("[login-client] Login response received", {
        ok: response.ok,
        status: response.status,
        message: data.message,
      });

      if (!response.ok) {
        console.warn("[login-client] Login failed", data);
        setError(data.message ?? "Unable to log in.");
        return;
      }

      console.log("[login-client] Login successful", data.user);
      setSuccessMessage("Login successful. Redirecting...");
      router.push("/dashboard");
    } catch (error) {
      console.error("[login-client] Network or server error", error);
      setError("Unable to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page-layout grid min-h-screen overflow-hidden bg-white lg:grid-cols-[minmax(0,2.7fr)_minmax(30rem,2.3fr)]">
      <section className="login-page-hero-panel relative min-h-[42vh] overflow-hidden bg-primary px-6 py-10 text-white sm:px-10 lg:min-h-screen lg:px-16 lg:py-20">
        <Image
          src="/Borrowed BG.jpeg"
          alt="Borrowed background"
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="login-page-hero-image object-cover"
        />
        <div className="login-page-hero-gradient absolute inset-0 bg-[linear-gradient(135deg,rgba(102,83,231,0.86)_0%,rgba(132,83,224,0.74)_42%,rgba(246,103,155,0.7)_100%)]" />
        <div className="login-page-hero-glow absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,150,0.55)_0%,transparent_24%),radial-gradient(circle_at_12%_84%,rgba(255,145,92,0.42)_0%,transparent_26%)]" />

        <div className="login-page-hero-content relative z-10 flex h-full min-h-[22rem] max-w-xl flex-col justify-center">
          <p className="login-page-brand-label mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/75">
            Borrowed
          </p>
          <h1 className="login-page-hero-title text-4xl font-extrabold leading-tight sm:text-5xl">
            Welcome to Borrowed
          </h1>
          <p className="login-page-hero-description mt-4 max-w-md text-sm leading-6 text-white/78 sm:text-base">
            Manage your borrowed items, requests, and account access from one
            clean dashboard.
          </p>
        </div>
      </section>

      <section className="login-page-form-panel flex min-h-[58vh] items-center justify-center bg-white px-6 py-12 lg:min-h-screen">
        <div className="login-form-card w-full max-w-xl rounded-2xl border border-border/90 bg-white px-10 py-12 shadow-[0_24px_70px_rgba(34,27,61,0.12)] sm:px-12 sm:py-14">
          <header className="login-form-header mb-9 text-center">
            <h1 className="login-form-title text-xl font-extrabold uppercase tracking-[0.1em] text-primary">
              User Login
            </h1>
          </header>

          <div className="social-login-button-list mb-7 flex flex-col gap-4">
            <SocialButton provider="Google" icon={<GoogleIcon />} href="/login/google" />
            <SocialButton provider="Facebook" icon={<FacebookIcon />} href="/login/facebook" />
          </div>

          <div className="login-divider-wrapper my-7">
            <Divider />
          </div>

          <form className="login-form-fields flex flex-col gap-4" onSubmit={handleSubmit}>
            <TextField
              type="text"
              name="identifier"
              autoComplete="username"
              placeholder="Enter Your Email or Username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
            <TextField
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              trailingElement={
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                  className="shrink-0 text-text-muted transition-colors hover:text-primary"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                      <path
                        d="M3 3l18 18"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                      <path
                        d="M10.6 10.7a3 3 0 0 0 4 4"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                      <path
                        d="M9.9 5.1A10.9 10.9 0 0 1 12 5c5 0 9.3 3.1 11 7-0.7 1.6-1.8 3.1-3.1 4.2"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                      <path
                        d="M6.6 6.7C4.8 8 3.5 9.8 3 12c1.7 3.9 6 7 11 7 1.5 0 2.9-.3 4.2-.8"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                      <path
                        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </button>
              }
              required
            />

            {error ? (
              <p className="text-sm font-semibold text-red-600">{error}</p>
            ) : null}
            {successMessage ? (
              <p className="text-sm font-semibold text-emerald-600">{successMessage}</p>
            ) : null}

            <div className="login-form-options flex items-center justify-between gap-3 px-0.5 text-sm font-medium text-text-secondary">
              <label className="remember-me-control flex items-center gap-3">
                <input
                  type="checkbox"
                  className="remember-me-checkbox h-4 w-4 rounded border border-primary/40 bg-transparent accent-[var(--primary)]"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="forgot-password-button text-primary transition-colors hover:text-primary-hover"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="login-submit-button mx-auto mt-8 block w-44 rounded-full px-6 py-4 text-sm font-bold uppercase text-white transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="sign-up-prompt mt-8 text-center text-sm font-semibold text-text-secondary">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="sign-up-button text-primary transition-colors hover:text-primary-hover"
            >
              Sign Up Now!
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
