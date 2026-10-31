"use client";

/**
 * Reset Password page — /reset-password (FR-AUTH-04).
 * Reads `token` query param and validates with password policy.
 * Single-use sha256 token verification on server.
 */
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/shared/trpc/react";
import { resetPasswordSchema } from "@/modules/auth/client";

const POLICY_RULES = [
  { id: "length", label: "More than 8 characters" },
  { id: "upper", label: "At least one uppercase letter (A–Z)" },
  { id: "lower", label: "At least one lowercase letter (a–z)" },
  { id: "special", label: "At least one special character (!@#$…)" },
];

function checkPolicy(password: string) {
  return {
    length: password.length > 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetMutation = api.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (err) => {
      setServerError(err.message || "Failed to reset password. Link may be expired or already used.");
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const parsed = resetPasswordSchema.safeParse({ token, password, confirmPassword });
    if (!parsed.success) {
      const errMap: { password?: string; confirmPassword?: string } = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0] === "password") errMap.password = err.message;
        if (err.path[0] === "confirmPassword") errMap.confirmPassword = err.message;
      });
      setFieldErrors(errMap);
      return;
    }

    resetMutation.mutate(parsed.data);
  }

  const policy = checkPolicy(password);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-[var(--radius-xs)] bg-[hsl(var(--status-overdue-bg))] p-3 text-xs text-[hsl(var(--status-overdue-ink))]">
          Missing reset token. Please request a new password reset link.
        </div>
        <Link
          href="/forgot-password"
          className="inline-block w-full rounded-[var(--radius-sm)] bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90"
        >
          Request new link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--status-active-bg))] text-[hsl(var(--status-active-ink))]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">Password updated</h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Your password has been changed successfully. You can now sign in with your new credentials.
        </p>
        <Link
          href="/login"
          className="inline-block w-full rounded-[var(--radius-sm)] bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-[hsl(var(--foreground))]">
          New password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="New secure password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1"
        />
        {fieldErrors.password && (
          <p className="text-xs text-[hsl(var(--destructive))]">
            {fieldErrors.password}
          </p>
        )}

        {password.length > 0 && (
          <ul className="mt-2 space-y-1 rounded-[var(--radius-xs)] bg-[hsl(var(--muted))] p-2.5 text-xs">
            {POLICY_RULES.map((rule) => {
              const met = policy[rule.id as keyof typeof policy];
              return (
                <li
                  key={rule.id}
                  className={
                    met
                      ? "text-[hsl(var(--status-active-ink))]"
                      : "text-[hsl(var(--muted-foreground))]"
                  }
                >
                  <span className="mr-1.5 inline-block w-3">{met ? "✓" : "○"}</span>
                  {rule.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-[hsl(var(--foreground))]">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1"
        />
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-[hsl(var(--destructive))]">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      {serverError && (
        <div className="rounded-[var(--radius-xs)] bg-[hsl(var(--status-overdue-bg))] px-3 py-2 text-xs text-[hsl(var(--status-overdue-ink))]">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={resetMutation.isPending}
        className="w-full rounded-[var(--radius-sm)] bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1"
      >
        {resetMutation.isPending ? "Resetting…" : "Reset password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--radius-xs)] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-lg font-bold">
            O
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Set new password
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Please enter your new credentials below
          </p>
        </div>

        <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
          <Suspense fallback={<div className="p-4 text-center text-xs text-[hsl(var(--muted-foreground))]">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
