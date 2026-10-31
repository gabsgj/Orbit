import { DEMO_LOGINS } from "@/shared/lib/demo";

/**
 * DemoCredentials — the demo-access card (DEMO ONLY).
 * Values come from src/shared/lib/demo.ts, the single source of truth that the
 * seed script also uses — nothing here is invented for the page.
 */
export function DemoCredentials() {
  return (
    <section
      aria-label="Demo access credentials"
      className="mx-auto w-full max-w-2xl rounded-[var(--radius-lg)] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--border))]"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold tracking-tight">Try the demo workspace</h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--status-warning-bg))] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--status-warning-ink))]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--status-warning-ink))] opacity-50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-warning-ink))]" />
          </span>
          Demo only
        </span>
      </div>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
        Three seeded accounts, three different views of the same system.
      </p>

      <ul className="mt-4 divide-y divide-[hsl(var(--border))]">
        {DEMO_LOGINS.map((d) => (
          <li key={d.email} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-sm font-semibold">{d.role}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{d.note}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs sm:justify-end">
              <span className="rounded bg-[hsl(var(--muted))] px-2 py-1">{d.email}</span>
              <span className="rounded bg-[hsl(var(--muted))] px-2 py-1">{d.password}</span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
        Seeded demo accounts — the entire workspace resets with one seed run.
        Not for any real deployment.
      </p>
    </section>
  );
}
