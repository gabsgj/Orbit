"use client";

/**
 * Reset Password — /reset-password (FR-AUTH-04). Ledger folio.
 * Reads `token` query param; single-use sha256 token verified on server.
 */
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/shared/trpc/react";
import { resetPasswordSchema } from "@/modules/auth/client";
import { AuthLayout, authFieldClass, authLabelClass, authButtonClass } from "@/shared/ui/auth-layout";

const POLICY_RULES = [
  { id: "length", label: "More than 8 characters" },
  { id: "upper", label: "One uppercase letter (A–Z)" },
  { id: "lower", label: "One lowercase letter (a–z)" },
  { id: "special", label: "One special character (!@#$…)" },
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
    onSuccess: () => setSuccess(true),
    onError: (err) =>
      setServerError(err.message || "Failed to reset password. The link may be expired or already used."),
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
      <div className="space-y-5">
        <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--status-overdue-ink))]/20 bg-[hsl(var(--status-overdue-bg))] px-3 py-2 text-xs font-medium text-[hsl(var(--status-overdue-ink))]">
          This reset link is missing its token. Request a fresh one below.
        </div>
        <Link href="/forgot-password" className={`${authButtonClass} inline-block`}>
          Request new link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--status-active-bg))] text-[hsl(var(--status-active-ink))]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">Password updated</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            You can now sign in with your new credentials.
          </p>
        </div>
        <Link href="/login" className={`${authButtonClass} inline-block`}>
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="password" className={authLabelClass}>New password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="New secure password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={authFieldClass}
        />
        {fieldErrors.password && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{fieldErrors.password}</p>}

        {password.length > 0 && (
          <ul className="mt-3 space-y-1.5 rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/60 p-3 text-xs">
            {POLICY_RULES.map((rule) => {
              const met = policy[rule.id as keyof typeof policy];
              return (
                <li key={rule.id} className={met ? "font-medium text-[hsl(var(--status-active-ink))]" : "text-[hsl(var(--muted-foreground))]"}>
                  <span className="mr-1.5 inline-block w-3 text-center">{met ? "✓" : "○"}</span>
                  {rule.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className={authLabelClass}>Confirm new password</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={authFieldClass}
        />
        {fieldErrors.confirmPassword && (
          <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {serverError && (
        <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--status-overdue-ink))]/20 bg-[hsl(var(--status-overdue-bg))] px-3 py-2 text-xs font-medium text-[hsl(var(--status-overdue-ink))]">
          {serverError}
        </div>
      )}

      <button type="submit" disabled={resetMutation.isPending} className={authButtonClass}>
        {resetMutation.isPending ? "Resetting…" : "Reset password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Set a new password" subtitle="Choose something strong — your billing depends on it.">
      <Suspense fallback={<div className="p-4 text-center text-xs text-[hsl(var(--muted-foreground))]">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
