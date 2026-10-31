"use client";

/**
 * Forgot Password page — /forgot-password (FR-AUTH-04).
 * Submits email to trpc.auth.forgotPassword.
 * In offline/local mode, the reset link is staged in email_outbox.
 */
import { useState } from "react";
import Link from "next/link";
import { api } from "@/shared/trpc/react";
import { forgotPasswordSchema } from "@/modules/auth/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const forgotMutation = api.auth.forgotPassword.useMutation({
    onSuccess: (_, vars) => {
      setSubmittedEmail(vars.email);
      setSubmitted(true);
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.errors[0]?.message || "Invalid email address");
      return;
    }

    forgotMutation.mutate(parsed.data);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--radius-xs)] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-lg font-bold">
            O
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            We will generate a secure one-time password reset link
          </p>
        </div>

        <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--status-active-bg))] text-[hsl(var(--status-active-ink))]">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
                Reset link generated
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                If an account exists for <span className="font-medium text-[hsl(var(--foreground))]">{submittedEmail}</span>,
                a reset link has been created and staged.
              </p>
              
              <div className="rounded-[var(--radius-xs)] border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 p-3 text-left">
                <p className="text-[11px] font-semibold text-[hsl(var(--foreground))] mb-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--chart-1))]"></span>
                  Offline Demo Note:
                </p>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-normal">
                  In offline mode, outgoing emails are captured in the system outbox.
                  Admins can view and open the link directly in{" "}
                  <Link href="/admin/outbox" className="underline font-medium text-[hsl(var(--foreground))]">
                    Mail Outbox
                  </Link>.
                </p>
              </div>

              <Link
                href="/login"
                className="inline-block w-full rounded-[var(--radius-sm)] bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[hsl(var(--foreground))]"
                >
                  Account email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1"
                />
                {fieldError && (
                  <p className="text-xs text-[hsl(var(--destructive))]">
                    {fieldError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={forgotMutation.isPending}
                className="w-full rounded-[var(--radius-sm)] bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1"
              >
                {forgotMutation.isPending ? "Generating link…" : "Request reset link"}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] underline underline-offset-2"
                >
                  Remembered your password? Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
