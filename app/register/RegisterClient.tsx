"use client";

import Image from "next/image";
import Link from "next/link";

import { TextField } from "../login";

export default function RegisterClient() {
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

          <form className="registration-form-fields flex flex-col gap-4">
            <div className="registration-name-fields flex flex-col gap-4">
              <TextField placeholder="First Name" />
              <TextField placeholder="Last Name" />
            </div>

            <TextField type="email" placeholder="Email Address" />
            <TextField type="password" placeholder="Password" />
            <TextField type="password" placeholder="Confirm Password" />

            <label className="registration-terms-control flex items-start gap-3 text-sm font-semibold text-text-secondary">
              <input
                type="checkbox"
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
              className="registration-submit-button mt-2 rounded-xl px-6 py-4 text-lg font-extrabold text-white transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              Sign Up
            </button>
          </form>

          <p className="registration-login-prompt mt-8 text-center text-lg font-semibold text-text-secondary">
            Already have an account?{" "}
            <Link
              href="/"
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
