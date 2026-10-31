import Link from "next/link";
import { LogoMark } from "./logo";

/**
 * AuthLayout — the ledger "folio" for all auth surfaces (Gate-3/landing world).
 * Left: quiet brand panel with a pastel gradient ground + three product facts
 * (desktop). Right: the form as a bordered ledger sheet. Liquid-glass brand
 * pill floats at the top of both panels. Used by /login /signup
 * /forgot-password /reset-password.
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
      <aside
        className="relative hidden flex-col justify-between border-r border-[hsl(var(--border))] p-10 lg:flex"
        style={{
          background:
            "linear-gradient(160deg, hsl(var(--tint-blue)) 0%, hsl(var(--card)) 55%)",
        }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-3 self-start rounded-full bg-[hsl(var(--card)/0.6)] px-5 py-3 shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--card)/0.5)] backdrop-blur-xl"
          aria-label="Orbit home"
        >
          <LogoMark size={40} />
          <span className="text-2xl font-bold tracking-tight">Orbit</span>
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
      <main className="relative flex items-center justify-center overflow-hidden p-6">
        {/* orbital backdrop art (crisp geometry, decorative only) */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 800 800"
          fill="none"
        >
          <ellipse
            cx="680"
            cy="120"
            rx="260"
            ry="110"
            transform="rotate(-22 680 120)"
            stroke="hsl(var(--tint-blue))"
            strokeWidth="1.5"
            opacity="0.9"
          />
          {/* satellite dot placed ON the top-right ellipse path (cx+rx·cos(-22°), cy+ry·sin(-22°)) */}
          <circle cx={680 + 260 * Math.cos((-22 * Math.PI) / 180)} cy={120 + 110 * Math.sin((-22 * Math.PI) / 180)} r="5" fill="hsl(var(--chart-1))" opacity="0.55" />
          <ellipse
            cx="60"
            cy="720"
            rx="300"
            ry="130"
            transform="rotate(18 60 720)"
            stroke="hsl(var(--tint-lavender))"
            strokeWidth="1.5"
            opacity="0.8"
          />
          {/* satellite dot placed ON the bottom-left ellipse path */}
          <circle cx={60 + 300 * Math.cos((18 * Math.PI) / 180)} cy={720 + 130 * Math.sin((18 * Math.PI) / 180)} r="5" fill="hsl(var(--tint-lavender-ink))" opacity="0.4" />
        </svg>

        <div className="relative w-full max-w-md">
          <div className="mb-6 flex justify-center lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-full bg-[hsl(var(--card)/0.6)] px-5 py-3 shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--card)/0.5)] backdrop-blur-xl"
              aria-label="Orbit home"
            >
              <LogoMark size={40} />
              <span className="text-2xl font-bold tracking-tight">Orbit</span>
            </Link>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-[var(--shadow-lift)]">
            <h1 className="text-2xl font-bold tracking-[-0.02em] [text-wrap:balance]">{title}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))] [text-wrap:pretty]">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </main>

      {/* DEMO ONLY indicator — all auth surfaces */}
      <span className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--status-warning-bg))] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--status-warning-ink))] shadow-[var(--shadow-soft)]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--status-warning-ink))] opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-warning-ink))]" />
        </span>
        Demo only
      </span>
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
