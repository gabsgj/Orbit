"use client";

/**
 * Signup page — /signup (customer self-registration, FR-AUTH-01/02).
 * Calls trpc.auth.signup. On success, auto-signs in via next-auth.
 */
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/shared/trpc/react";
import { signupSchema } from "@/modules/auth/client";

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

export default function SignupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ companyName?: string; email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const signupMutation = api.auth.signup.useMutation({
    onSuccess: async (_, vars) => {
      await signIn("credentials", {
        email: vars.email,
        password: vars.password,
        redirect: false,
      });
      router.push("/portal");
      router.refresh();
    },
    onError: (err) => {
      if (err.data?.code === "CONFLICT") {
        setServerError(
          "An account with this email already exists. Try signing in instead.",
        );
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const parsed = signupSchema.safeParse({ companyName, email, password });
    if (!parsed.success) {
      const errMap: { companyName?: string; email?: string; password?: string } = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0] === "companyName") errMap.companyName = err.message;
        if (err.path[0] === "email") errMap.email = err.message;
        if (err.path[0] === "password") errMap.password = err.message;
      });
      setFieldErrors(errMap);
      return;
    }

    signupMutation.mutate(parsed.data);
  }

  const policy = checkPolicy(password);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--radius-xs)] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-lg font-bold">
            O
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Start your subscription with Brightloop Software
          </p>
        </div>

        <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            {/* Company name */}
            <div className="space-y-1.5">
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-[hsl(var(--foreground))]"
              >
                Company name
              </label>
              <input
                id="companyName"
                type="text"
                autoComplete="organization"
                placeholder="Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1"
              />
              {fieldErrors.companyName && (
                <p className="text-xs text-[hsl(var(--destructive))]">
                  {fieldErrors.companyName}
                </p>
              )}
            </div>

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
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1"
              />
              {fieldErrors.email && (
                <p className="text-xs text-[hsl(var(--destructive))]">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[hsl(var(--foreground))]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1"
              />
              {fieldErrors.password && (
                <p className="text-xs text-[hsl(var(--destructive))]">
                  {fieldErrors.password}
                </p>
              )}

              {/* Password policy live feedback */}
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
                        <span className="mr-1.5 inline-block w-3">
                          {met ? "✓" : "○"}
                        </span>
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="rounded-[var(--radius-xs)] bg-[hsl(var(--status-overdue-bg))] px-3 py-2 text-xs text-[hsl(var(--status-overdue-ink))]">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full rounded-[var(--radius-sm)] bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1"
            >
              {signupMutation.isPending ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[hsl(var(--foreground))] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
