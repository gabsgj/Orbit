"use client";

/**
 * Login — /login (next-auth signIn override). The ledger folio (shared AuthLayout).
 * Client validation backed by loginSchema; server errors name the problem.
 */
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchema } from "@/modules/auth/client";
import { AuthLayout, authFieldClass, authLabelClass, authButtonClass } from "@/shared/ui/auth-layout";
import { DemoCredentials } from "@/shared/ui/demo-credentials";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errMap: { email?: string; password?: string } = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0] === "email") errMap.email = err.message;
        if (err.path[0] === "password") errMap.password = err.message;
      });
      setFieldErrors(errMap);
      return;
    }

    setLoading(true);
    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setServerError("Invalid email or password. Check your credentials and try again.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <AuthLayout title="Sign in to Orbit" subtitle="Your subscriptions, invoices and billing day — one ledger away.">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="email" className={authLabelClass}>Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authFieldClass}
          />
          {fieldErrors.email && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{fieldErrors.email}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={authLabelClass}>Password</label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[hsl(var(--muted-foreground))] underline underline-offset-2 hover:text-[hsl(var(--foreground))]"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authFieldClass}
          />
          {fieldErrors.password && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{fieldErrors.password}</p>}
        </div>

        {serverError && (
          <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--status-overdue-ink))]/20 bg-[hsl(var(--status-overdue-bg))] px-3 py-2 text-xs font-medium text-[hsl(var(--status-overdue-ink))]">
            {serverError}
          </div>
        )}

        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 border-t border-[hsl(var(--border))] pt-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
        New to Brightloop?{" "}
        <Link href="/signup" className="font-semibold text-[hsl(var(--foreground))] hover:underline">
          Create a customer&nbsp;account
        </Link>
      </p>
          <div className="mt-6">
        <DemoCredentials />
      </div>
    </AuthLayout>
  );
}
