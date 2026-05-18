"use client";

import type { FormEvent } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { SocialButton, TextField } from "../login";

function PasswordToggleButton({
  isVisible,
  onToggle,
}: {
  isVisible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={isVisible ? "Hide password" : "Show password"}
      aria-pressed={isVisible}
      onClick={onToggle}
      className="shrink-0 text-text-muted transition-colors hover:text-primary"
    >
      {isVisible ? (
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
  );
}

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

export default function RegisterClient() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function updateField(name: keyof typeof formData, value: string) {
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("[register-client] Submitting registration form", {
      firstName: formData.firstName,
      lastName: formData.lastName,
      userName: formData.userName,
      email: formData.email,
      passwordLength: formData.password.length,
    });
    setError("");
    setSuccessMessage("");

    if (formData.password !== formData.confirmPassword) {
      console.warn("[register-client] Password confirmation mismatch");
      setError("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      console.warn("[register-client] Terms not accepted");
      setError("Please accept the terms to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          userName: formData.userName,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = (await response.json()) as { message?: string };

      console.log("[register-client] Registration response received", {
        ok: response.ok,
        status: response.status,
        message: data.message,
      });

      if (!response.ok) {
        console.warn("[register-client] Registration failed", data);
        setError(data.message ?? "Unable to create account.");
        return;
      }

      console.log("[register-client] Registration successful");
      setSuccessMessage("Account created. Redirecting to login...");
      setFormData({
        firstName: "",
        lastName: "",
        userName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      router.push("/login");
    } catch (error) {
      console.error("[register-client] Network or server error", error);
      setError("Unable to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="registration-page-layout grid min-h-screen overflow-hidden bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(34rem,0.95fr)]">
      <section className="registration-page-hero-panel relative min-h-[36vh] overflow-hidden px-6 py-10 text-white sm:px-10 lg:min-h-screen lg:px-16 lg:py-20">
        <Image
          src="/Borrowed BG.jpeg"
          alt="Borrowed registration background"
          fill
          priority
          sizes="(min-width: 1024px) 52vw, 100vw"
          className="registration-page-hero-image object-cover"
        />
        <div className="registration-page-hero-gradient absolute inset-0" />
        <div className="registration-page-hero-soft-light absolute inset-0" />

        <div className="registration-page-hero-content relative z-10 flex h-full min-h-[20rem] max-w-xl flex-col justify-center">
          <p className="registration-page-brand-label mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/75">
            Borrowed
          </p>
          <h1 className="registration-page-hero-title text-5xl font-extrabold leading-tight sm:text-6xl">
            Join Borrowed
          </h1>
          <p className="registration-page-hero-description mt-5 max-w-md text-base leading-7 text-white/82">
            Create your account and start managing borrowed items, requests,
            and returns from one clean workspace.
          </p>
        </div>
      </section>

      <section className="registration-page-form-panel flex min-h-[64vh] items-center justify-center px-6 py-12 lg:min-h-screen">
        <div className="registration-form-card w-full max-w-2xl rounded-3xl border border-border/90 bg-white/92 px-8 py-10 shadow-[0_28px_84px_rgba(34,27,61,0.14)] backdrop-blur-xl sm:px-12 sm:py-12">
          <header className="registration-form-header mb-9">
            <h2 className="registration-form-title text-5xl font-extrabold leading-none text-primary">
              Sign Up
            </h2>
            <p className="registration-form-description mt-4 text-lg font-medium text-text-secondary">
              Please fill in this form to create an account.
            </p>
          </header>

          <div className="social-login-button-list mb-7 flex flex-col gap-4">
            <SocialButton
              provider="Google"
              icon={<GoogleIcon />}
              href="/register/google"
              actionLabel="Sign up"
            />
            <SocialButton
              provider="Facebook"
              icon={<FacebookIcon />}
              href="/register/facebook"
              actionLabel="Sign up"
            />
          </div>

          <div className="login-divider-wrapper mb-7">
            <div className="login-divider flex items-center gap-4 px-1 text-xs font-semibold uppercase text-text-muted">
              <span className="login-divider-line h-px flex-1 bg-border/90" />
              <span>OR</span>
              <span className="login-divider-line h-px flex-1 bg-border/90" />
            </div>
          </div>

          <form className="registration-form-fields flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="registration-name-fields flex flex-col gap-4">
              <TextField
                name="firstName"
                placeholder="First Name"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                required
              />
              <TextField
                name="lastName"
                placeholder="Last Name"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                required
              />
            </div>

            <TextField
              type="text"
              name="userName"
              placeholder="Username"
              autoComplete="username"
              value={formData.userName}
              onChange={(event) => updateField("userName", event.target.value)}
              required
            />
            <TextField
              type="email"
              name="email"
              placeholder="Email Address"
              autoComplete="email"
              value={formData.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
            />
            <TextField
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              autoComplete="new-password"
              value={formData.password}
              onChange={(event) => updateField("password", event.target.value)}
              trailingElement={
                <PasswordToggleButton
                  isVisible={showPassword}
                  onToggle={() => setShowPassword((current) => !current)}
                />
              }
              required
            />
            <TextField
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              trailingElement={
                <PasswordToggleButton
                  isVisible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((current) => !current)}
                />
              }
              required
            />

            {error ? (
              <p className="text-sm font-semibold text-red-600">{error}</p>
            ) : null}
            {successMessage ? (
              <p className="text-sm font-semibold text-emerald-600">{successMessage}</p>
            ) : null}

            <label className="registration-terms-control flex items-start gap-3 text-sm font-semibold text-text-secondary">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="registration-terms-checkbox mt-1 h-4 w-4 rounded border border-primary/40 bg-transparent accent-[var(--primary)]"
              />
              <span>
                I accept the{" "}
                <button
                  type="button"
                  className="registration-inline-link text-primary transition-colors hover:text-primary-hover"
                >
                  Terms of Use &amp; Privacy Policy
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="registration-submit-button mt-2 rounded-xl px-6 py-4 text-lg font-extrabold text-white transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isSubmitting ? "Creating..." : "Sign Up"}
            </button>
          </form>

          <p className="registration-login-prompt mt-8 text-center text-lg font-semibold text-text-secondary">
            Already have an account?{" "}
            <Link
              href="/login"
              className="registration-login-link text-primary transition-colors hover:text-primary-hover"
            >
              Login Here!
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
