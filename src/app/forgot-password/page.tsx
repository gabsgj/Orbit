"use client";

/**
 * Forgot Password — /forgot-password (FR-AUTH-04). Ledger folio.
 * Offline mode: the reset link is staged in email_outbox (see Mail Outbox).
 */
import { useState } from "react";
import Link from "next/link";
import { api } from "@/shared/trpc/react";
import { forgotPasswordSchema } from "@/modules/auth/client";
import { AuthLayout, authFieldClass, authLabelClass, authButtonClass } from "@/shared/ui/auth-layout";

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

  if (submitted) {
    return (
      <AuthLayout title="Reset link generated" subtitle="One-time use, valid for one hour.">
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--status-active-bg))] text-[hsl(var(--status-active-ink))]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))] [text-wrap:pretty]">
            If an account exists for{" "}
            <span className="font-semibold text-[hsl(var(--foreground))]">{submittedEmail}</span>,
            a reset link has been created and staged.
          </p>

          <div className="rounded-[var(--radius-xs)] border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 p-3 text-left">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--foreground))]">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--chart-1))]" />
              Offline demo note
            </p>
            <p className="text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
              With no SMTP configured, outgoing mail is captured in the system outbox.
              Staff can open the link directly in{" "}
              <Link href="/admin/outbox" className="font-semibold text-[hsl(var(--foreground))] underline underline-offset-2">
                Mail Outbox
              </Link>.
            </p>
          </div>

          <Link href="/login" className={`${authButtonClass} inline-block`}>
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll generate a secure one-time reset link for your account.">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="email" className={authLabelClass}>Account email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authFieldClass}
          />
          {fieldError && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{fieldError}</p>}
        </div>

        <button type="submit" disabled={forgotMutation.isPending} className={authButtonClass}>
          {forgotMutation.isPending ? "Generating link…" : "Request reset link"}
        </button>

        <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
          Remembered it after all?{" "}
          <Link href="/login" className="font-semibold text-[hsl(var(--foreground))] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
