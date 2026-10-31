import Link from "next/link";

/**
 * AuthLayout — the ledger "folio" for all auth surfaces (Gate-3/landing world).
 * Left: quiet brand panel with the ledger motif + three product facts (desktop).
 * Right: the form as a bordered ledger sheet. Achromatic, 1px rules, no
 * gradients, no stock illustration. Used by /login /signup /forgot-password
 * /reset-password.
 */
export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen bg-[hsl(var(--background))] lg:grid-cols-[44%_56%]">
      {/* brand panel */}
      <aside className="relative hidden flex-col justify-between border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] p-10 lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-[hsl(var(--primary))] text-sm font-bold text-[hsl(var(--primary-foreground))]">O</span>
          <span className="text-base font-bold tracking-tight">Orbit</span>
        </Link>

        <div>
          <p className="max-w-[30ch] text-3xl font-bold leading-tight tracking-[-0.02em] [text-wrap:balance]">
            The ledger that bills itself — and never bills twice.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              ["Idempotent by constraint", "UNIQUE(subscription_id, period_start) makes a duplicate invoice physically impossible."],
              ["Offline-first", "Local PostgreSQL, a local billing worker, mail staged in an outbox. Zero internet needed."],
              ["Proven, not claimed", "10,007 subscriptions seeded; the slowest dashboard query runs in 10.55 ms."],
            ].map(([k, d]) => (
              <li key={k} className="flex gap-3 border-t border-[hsl(var(--border))] pt-4">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--chart-1))]" />
                <p className="text-sm leading-relaxed">
                  <strong className="font-semibold">{k}.</strong>{" "}
                  <span className="text-[hsl(var(--muted-foreground))]">{d}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        <p className="font-mono text-xs text-[hsl(var(--muted-foreground))]">
          offline-first · local PostgreSQL · zero dependencies
        </p>
      </aside>

      {/* form panel */}
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[hsl(var(--primary))] text-sm font-bold text-[hsl(var(--primary-foreground))]">O</span>
            <span className="text-base font-bold tracking-tight">Orbit</span>
          </Link>
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <h1 className="text-2xl font-bold tracking-[-0.02em] [text-wrap:balance]">{title}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))] [text-wrap:pretty]">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Shared field styling for auth forms — inputs as ruled ledger lines. */
export const authFieldClass =
  "w-full rounded-[var(--radius-sm)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--placeholder-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1 transition";

export const authLabelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]";

export const authButtonClass =
  "w-full rounded-[var(--radius-sm)] bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-[0_8px_20px_-8px_rgba(15,23,42,0.5)] transition hover:translate-y-[-1px] disabled:translate-y-0 disabled:opacity-50";
