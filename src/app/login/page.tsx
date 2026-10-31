"use client";

/**
 * Login page — /login (next-auth signIn page override).
 * Uses next-auth's signIn("credentials"). Client validation backed by loginSchema.
 */
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchema } from "@/modules/auth";

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
      setServerError("Invalid email or password. Please try again.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
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
            Sign in to Orbit
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Brightloop Software subscription platform
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[hsl(var(--foreground))]"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1"
              />
              {fieldErrors.email && (
                <p className="text-xs text-[hsl(var(--destructive))]">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[hsl(var(--foreground))]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] underline underline-offset-2"
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
                className="w-full rounded-[var(--radius-sm)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1"
              />
              {fieldErrors.password && (
                <p className="text-xs text-[hsl(var(--destructive))]">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="rounded-[var(--radius-xs)] bg-[hsl(var(--status-overdue-bg))] px-3 py-2 text-xs text-[hsl(var(--status-overdue-ink))]">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[var(--radius-sm)] bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <p className="mt-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
          New to Brightloop?{" "}
          <Link
            href="/signup"
            className="font-medium text-[hsl(var(--foreground))] hover:underline"
          >
            Create a customer account
          </Link>
        </p>
      </div>
    </div>
  );
}
