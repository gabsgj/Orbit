"use client";

/**
 * Signup — /signup (customer self-registration, FR-AUTH-01/02). Ledger folio.
 * Calls trpc.auth.signup; on success auto-signs in via next-auth.
 */
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/shared/trpc/react";
import { signupSchema } from "@/modules/auth/client";
import { AuthLayout, authFieldClass, authLabelClass, authButtonClass } from "@/shared/ui/auth-layout";
import { DemoCredentials } from "@/shared/ui/demo-credentials";

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
        setServerError("An account with this email already exists. Try signing in instead.");
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
    <AuthLayout title="Create your account" subtitle="Start your subscription with Brightloop Software — invoiced monthly, never twice.">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="companyName" className={authLabelClass}>Company name</label>
          <input
            id="companyName"
            type="text"
            autoComplete="organization"
            placeholder="Acme Corp"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className={authFieldClass}
          />
          {fieldErrors.companyName && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{fieldErrors.companyName}</p>}
        </div>

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
          <label htmlFor="password" className={authLabelClass}>Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Choose a strong password"
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

        {serverError && (
          <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--status-overdue-ink))]/20 bg-[hsl(var(--status-overdue-bg))] px-3 py-2 text-xs font-medium text-[hsl(var(--status-overdue-ink))]">
            {serverError}
          </div>
        )}

        <button type="submit" disabled={signupMutation.isPending} className={authButtonClass}>
          {signupMutation.isPending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 border-t border-[hsl(var(--border))] pt-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[hsl(var(--foreground))] hover:underline">
          Sign in
        </Link>
      </p>
          <div className="mt-6">
        <DemoCredentials />
      </div>
    </AuthLayout>
  );
}
