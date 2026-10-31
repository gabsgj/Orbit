import Link from "next/link";
import { LogoMark } from "@/shared/ui/logo";
import { GitHubIcon, FidgetSpinner, StickMan } from "@/shared/ui/easter-eggs";
import { DemoCredentials } from "@/shared/ui/demo-credentials";
import {
  SubscriptionLifecycleDiagram,
  BillingFlowDiagram,
  InvoiceAnatomyDiagram,
} from "@/app/_components/landing/diagrams";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orbit, Recurring billing that cannot bill you twice",
  description:
    "Orbit runs the full life of a subscription business: products and plans, quotation templates, subscription lifecycles, idempotent recurring billing, invoices, payments and revenue reporting, offline-first, on your own PostgreSQL.",
};

/* ─── shared bits ─── */

function StatusChip({ tone, children }: { tone: "active" | "overdue" | "warning" | "neutral"; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: `hsl(var(--status-${tone}-bg))`,
        color: `hsl(var(--status-${tone}-ink))`,
      }}
    >
      {children}
    </span>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-[0.92em] text-[hsl(var(--chart-1))]">{children}</code>;
}

/* ─── hero artifact: the live invoice, lifted like a card off the page ─── */

function LedgerInvoice() {
  const lines = [
    { desc: "Brightloop CRM (Odoo), Oct 1 → Nov 1", qty: 1, price: "1,559.00", amount: "1,559.00" },
    { desc: "GST 18%", qty: null, price: null, amount: "280.62", tax: true },
    { desc: "LAUNCH200, launch discount", qty: null, price: null, amount: "−200.00", discount: true },
  ];
  return (
    <div className="rounded-[var(--radius-lg)] bg-[hsl(var(--card))] shadow-[var(--shadow-lift)] ring-1 ring-[hsl(var(--border))]">
      <div className="flex items-center justify-between gap-2 px-4 pt-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--chart-1))] opacity-40" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(var(--chart-1))]" />
          </span>
          <span className="text-xs font-medium leading-snug text-[hsl(var(--muted-foreground))]">
            Billing run just completed, 00:05 UTC · automatic
          </span>
        </div>
        <StatusChip tone="active">Confirmed</StatusChip>
      </div>

      <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-6">
        <div className="min-w-0">
          <p className="font-mono text-base font-semibold">INV-2026-00006</p>
          <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">Acme Stores Pvt Ltd · due Nov 15</p>
        </div>
        <p className="shrink-0 text-right text-xs text-[hsl(var(--muted-foreground))]">
          from <span className="font-mono">SUB-2026-00001</span>
          <br />
          period 2026-10-01 → 2026-11-01
        </p>
      </div>

      <div className="px-4 py-4 sm:px-6">
        <table className="w-full text-[13px] sm:text-sm">
          <tbody>
            {lines.map((l) => (
              <tr key={l.desc} className="border-t border-[hsl(var(--border))]/60 first:border-0">
                <td className={`py-2.5 pr-2 align-top ${l.tax ? "text-[hsl(var(--muted-foreground))]" : ""} ${l.discount ? "font-medium text-[hsl(var(--status-active-ink))]" : ""}`}>
                  {l.desc}
                </td>
                <td className="whitespace-nowrap py-2.5 pl-2 text-right align-top tabular-nums text-[hsl(var(--muted-foreground))]">{l.qty ?? "—"}</td>
                <td className="whitespace-nowrap py-2.5 pl-2 text-right align-top tabular-nums text-[hsl(var(--muted-foreground))]">{l.price ?? "—"}</td>
                <td className="whitespace-nowrap py-2.5 pl-2 text-right align-top tabular-nums font-semibold">{l.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 flex items-baseline justify-between gap-3 rounded-[var(--radius-sm)] bg-[hsl(var(--tint-blue))] px-4 py-3">
          <span className="text-sm font-semibold text-[hsl(var(--tint-blue-ink))]">Total due</span>
          <span className="tabular-nums text-xl font-bold tracking-tight text-[hsl(var(--tint-blue-ink))] sm:text-2xl">₹1,639.62</span>
        </div>
      </div>

      <div className="rounded-b-[var(--radius-lg)] border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-3 sm:px-6">
        <p className="font-mono text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
          UNIQUE(subscription_id, period_start) — the database refuses a second invoice for this period
        </p>
      </div>
    </div>
  );
}

/* ─── content ─── */

const PAIN = [
  { what: "Subscriptions", how: "tracked in a spreadsheet" },
  { what: "Renewals", how: "remembered by whoever notices first" },
  { what: "Invoices", how: "typed up by hand every month" },
  { what: "Payments", how: "matched by scrolling bank statements" },
  { what: "Revenue reports", how: "built manually, once a quarter" },
];

const SCENES = [
  {
    n: "01", tint: "blue",
    title: "Accounts & roles",
    body: "Customers self-signup with a real password policy and hashed, single-use reset links staged in a mail outbox. Admin, staff and customer see three different systems behind one login, RBAC enforced server-side, citext-unique&nbsp;emails.",
    proof: "Admin · Staff · Customer",
  },
  {
    n: "02", tint: "green",
    title: "Catalog, plans & variants",
    body: "Products with attributes and variants, the Odoo brand adds ₹560 with price_extra. Plans carry billing period, minimum quantity, availability windows and per-plan flags: auto-close, closable-early, pausable, renewable.",
    proof: "4 plan flags · 2 tax profiles",
  },
  {
    n: "03", tint: "lavender",
    title: "Quote → subscription",
    body: "Sales starts from a quotation template with pre-filled lines and a validity window, then walks one state machine: Draft → Quotation → Confirmed → Active → Closed, with every transition recorded by actor and timestamp.",
    proof: "Full status history",
  },
  {
    n: "04", tint: "amber",
    title: "Billing day",
    body: "Hundreds of subscriptions due at once become invoices with snapshot lines, per-line tax, discounts and gapless numbers. Re-run the same day and the database reports “0 created · 4 skipped (already billed)”, nothing billed twice, nothing skipped, catch-up built in.",
    proof: "Idempotent by constraint",
  },
  {
    n: "05", tint: "rose",
    title: "Discounts that apply themselves",
    body: "Admin-set rules, percent or fixed, minimums, date windows, usage limits, product or subscription scope. The next invoice carries the discount on its own line, stops on expiry or exhaustion, and keeps a usage ledger.",
    proof: "LAUNCH200 · SEAT10",
  },
  {
    n: "06", tint: "teal",
    title: "Payments & dunning",
    body: "Record a payment by UPI, card, cash, transfer or cheque; the invoice flips to Paid inside the same transaction, overpayments rejected. Overdue invoices surface instantly, and one click stages a reminder in the outbox.",
    proof: "Overdue → reminder in 1 click",
  },
  {
    n: "07", tint: "peach",
    title: "The finance lead",
    body: "Active subscriptions, revenue received, amount owed, overdue aging buckets, MRR and ARR with movement (new · expansion · contraction · churn), renewal forecast, revenue by plan, one summary, filterable, exportable to CSV.",
    proof: "MRR movement · aging · CSV",
  },
];

const STEPS = [
  { k: "Catalog", d: "Admin adds products, variants, plans, taxes", tint: "blue" },
  { k: "Subscribe", d: "Template → quotation → confirmed → active", tint: "lavender" },
  { k: "Bill", d: "Engine invoices every due period, idempotently", tint: "amber" },
  { k: "Collect", d: "Payments settle invoices; overdue gets chased", tint: "green" },
];

const PROOF = [
  { v: "10,007", l: "subscriptions seeded for the perf proof" },
  { v: "10.55 ms", l: "slowest dashboard query (budget: 2 s)" },
  { v: "17", l: "CHECK constraints holding business rules" },
  { v: "142", l: "automated tests on the billing core" },
  { v: "12/12", l: "end-to-end flows verified green" },
  { v: "0", l: "external dependencies, runs fully offline" },
];

function tint(t: string, ink = false) {
  return `hsl(var(--tint-${t}${ink ? "-ink" : ""}))`;
}

/* ─── page ─── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* ── floating liquid-glass nav: brand pill + actions pill ── */}
      <header className="fixed inset-x-0 top-4 z-50 flex flex-wrap items-center justify-center gap-2 px-4 sm:gap-4">
        {/* brand pill */}
        <Link
          href="/"
          aria-label="Orbit home"
          className="flex items-center gap-2 rounded-full bg-[hsl(var(--card))]/35 px-4 py-2 shadow-[var(--shadow-soft)] ring-1 ring-white/40 backdrop-blur-2xl backdrop-saturate-150 transition hover:bg-[hsl(var(--card))]/60 sm:px-6 sm:py-2.5"
        >
          <LogoMark size={32} className="sm:hidden" />
          <LogoMark size={40} className="hidden sm:block" />
          <span className="text-xl font-bold tracking-tight sm:text-2xl">Orbit</span>
        </Link>

        {/* actions pill */}
        <nav className="flex items-center gap-1 rounded-full bg-[hsl(var(--card))]/35 p-1.5 shadow-[var(--shadow-soft)] ring-1 ring-white/40 backdrop-blur-2xl backdrop-saturate-150">
          <div className="hidden items-center md:flex">
            {[
              ["#scenes", "The month"],
              ["#engine", "Billing engine"],
              ["#diagrams", "Diagrams"],
              ["#proof", "Proof"],
              ["#stack", "Stack"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3.5 py-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              >
                {label}
              </a>
            ))}
          </div>
          <Link
            href="/login"
            className="rounded-full px-3.5 py-2 text-sm font-semibold transition hover:bg-[hsl(var(--muted))] sm:px-4"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[hsl(var(--primary))] px-3.5 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.7)] transition hover:translate-y-[-1px] sm:px-4"
          >
            Start free
          </Link>
        </nav>
      </header>

      {/* ── hero ── */}
      <section className="relative mx-auto grid max-w-7xl gap-10 overflow-hidden px-6 pb-16 pt-32 md:grid-cols-[46%_54%] md:gap-8 md:pt-32">
        {/* orbital vector art — crisp geometry behind the hero */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <svg
            className="absolute left-1/2 top-1/2 h-[900px] w-[1400px] -translate-x-1/2 -translate-y-1/2"
            viewBox="0 0 1400 900"
            fill="none"
          >
            {/* orbit ellipse 1 — rotated -18° */}
            <g transform="rotate(-18 700 450)">
              <ellipse cx="700" cy="450" rx="520" ry="180" stroke="hsl(var(--tint-blue))" strokeWidth="1.5" />
              {/* satellite dot on this ellipse path */}
              <circle cx="1220" cy="450" r="5" fill="hsl(var(--primary))" />
            </g>
            {/* orbit ellipse 2 — rotated -28° */}
            <g transform="rotate(-28 700 450)">
              <ellipse cx="700" cy="450" rx="420" ry="140" stroke="hsl(var(--tint-blue))" strokeWidth="1.5" />
              {/* satellite dot on this ellipse path */}
              <circle cx="700" cy="310" r="4.5" fill="hsl(var(--primary))" />
            </g>
            {/* orbit ellipse 3 — rotated -18°, wider */}
            <g transform="rotate(-18 700 450)">
              <ellipse cx="700" cy="450" rx="640" ry="240" stroke="hsl(var(--tint-blue))" strokeWidth="1" />
            </g>
          </svg>
          {/* animated orbiting dot — wrapper tilted -18°, inner spins 24s linear infinite */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{ transform: "rotate(-18deg)", transformOrigin: "0 0" }}
          >
            <style>{`
              @keyframes orbit-sat-spin { to { transform: rotate(360deg); } }
              .orbit-sat-wrapper {
                animation: orbit-sat-spin 24s linear infinite;
                transform-origin: 0 0;
              }
            `}</style>
            <div className="orbit-sat-wrapper">
              <div
                className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--primary))]"
                style={{ transform: "translate(520px, -5px)" }}
              />
            </div>
          </div>
        </div>

        <div className="relative flex flex-col justify-center">
          <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-[hsl(var(--tint-blue))] px-3.5 py-1.5 text-xs font-semibold text-[hsl(var(--tint-blue-ink))]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--chart-1))]" />
            Idempotent billing engine, enforced by the database
          </div>
          <h1 className="mt-5 text-[clamp(2.2rem,9vw,4.2rem)] font-bold leading-[1.03] tracking-[-0.025em] [text-wrap:balance]">
            Recurring billing that cannot bill you twice.
          </h1>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-[hsl(var(--muted-foreground))] [text-wrap:pretty] sm:text-lg">
            Orbit runs the full life of a subscription business: plans, subscriptions,
            recurring invoices, payments and revenue reporting, with an idempotent
            billing engine enforced by the database itself. Offline-first, on your
            own PostgreSQL.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-[hsl(var(--primary))] px-6 py-3.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-[0_12px_28px_-10px_hsl(var(--primary)/0.7)] transition hover:translate-y-[-1px]"
            >
              Start free, create your account
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-[hsl(var(--card))] px-6 py-3.5 text-sm font-semibold ring-1 ring-[hsl(var(--border))] transition hover:bg-[hsl(var(--muted))]"
            >
              Enter Orbit →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { v: "0", l: "duplicate invoices, ever", t: "green" },
              { v: "₹1,639.62", l: "invoice just generated", t: "blue" },
              { v: "100%", l: "offline, no internet", t: "lavender" },
            ].map((f) => (
              <div key={f.l} className="rounded-[var(--radius-lg)] px-4 py-3.5" style={{ backgroundColor: tint(f.t) }}>
                <p className="tabular-nums text-xl font-bold tracking-tight" style={{ color: tint(f.t, true) }}>{f.v}</p>
                <p className="mt-0.5 text-xs font-medium leading-snug" style={{ color: tint(f.t, true) }}>{f.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex flex-col justify-center">
          <LedgerInvoice />
          <p className="mt-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
            Live artifact from the demo dataset, every number computed by the engine
          </p>
        </div>
      </section>

      {/* ── pain ── */}
      <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-[38%_62%]">
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.02em] [text-wrap:balance] sm:text-3xl">How things run today.</h2>
              <p className="mt-3 leading-relaxed text-[hsl(var(--muted-foreground))] [text-wrap:pretty]">
                Renewals get missed, invoices go out wrong, and nobody can say how much
                recurring revenue the company actually has. Orbit replaces that whole month.
              </p>
            </div>
            <ul className="divide-y divide-[hsl(var(--border))]">
              {PAIN.map((p) => (
                <li key={p.what} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="font-semibold">{p.what}</span>
                  <span className="text-right text-sm text-[hsl(var(--muted-foreground))]">{p.how}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 7 scenes, pastel cards (HORMN grammar) ── */}
      <section id="scenes" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16">
        <h2 className="max-w-[20ch] text-2xl font-bold tracking-[-0.02em] [text-wrap:balance] sm:text-3xl md:text-4xl">
          One billing month at Brightloop, every scene, handled.
        </h2>
        <p className="mt-3 max-w-[62ch] leading-relaxed text-[hsl(var(--muted-foreground))]">
          From a new customer signing up to the finance lead closing the month:
          the seven moments that break a spreadsheet workflow, each a working part of Orbit.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {SCENES.map((s) => (
            <article
              key={s.n}
              className="group rounded-[var(--radius-lg)] p-6 transition hover:translate-y-[-2px]"
              style={{ backgroundColor: tint(s.tint) }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="grid h-9 w-9 place-items-center rounded-full font-mono text-sm font-bold"
                  style={{ backgroundColor: "hsl(var(--card))", color: tint(s.tint, true) }}
                >
                  {s.n}
                </span>
                <span className="rounded-full px-2.5 py-1 font-mono text-xs font-medium" style={{ backgroundColor: "hsl(var(--card)/0.7)", color: tint(s.tint, true) }}>
                  {s.proof}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-tight" style={{ color: tint(s.tint, true) }}>
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: tint(s.tint, true) }}>
                {s.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── engine spotlight ── */}
      <section id="engine" className="scroll-mt-24 border-y border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-2xl font-bold tracking-[-0.02em] [text-wrap:balance] sm:text-3xl">The engine is the product.</h2>
            <p className="leading-relaxed text-[hsl(var(--muted-foreground))]">
              Most subscription tools promise careful billing. Orbit makes it a
              database-level property you can demonstrate, not a convention you hope for.
            </p>
            <ul className="mt-6 space-y-4">
              {[
                ["Never twice", <>A <Mono>UNIQUE(subscription_id, period_start)</Mono> constraint makes a duplicate period physically impossible.</>],
                ["Never concurrent", <><Mono>pg_try_advisory_xact_lock</Mono> serializes billing runs — cron and the button cannot overlap.</>],
                ["Never skipped", "The catch-up loop invoices every missed period after downtime, one invoice per period, capped at 12."],
                ["Never partial", "Each subscription runs under a SAVEPOINT: one failure rolls back only that subscription, never the run."],
              ].map(([k, d]) => (
                <li key={k as string} className="flex gap-3 rounded-[var(--radius-lg)] bg-[hsl(var(--background))] p-4">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--chart-1))]" />
                  <p className="text-sm leading-relaxed"><strong className="font-semibold">{k}.</strong>{" "}<span className="text-[hsl(var(--muted-foreground))]">{d}</span></p>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-center overflow-x-auto rounded-[var(--radius-lg)] bg-[#101b33] p-5 font-mono text-xs leading-relaxed text-slate-300 shadow-[var(--shadow-lift)] sm:p-6 sm:text-[13px]">
            <p className="text-slate-400">-- a billing run, replayed the same day</p>
            <p className="mt-3">orbit&gt; <span className="text-white">billing.run(asOf: today)</span></p>
            <p className="mt-1 text-emerald-400">{"{"} created: 4, skipped: 0, errors: 0 {"}"}</p>
            <p className="mt-3">orbit&gt; <span className="text-white">billing.run(asOf: today)</span></p>
            <p className="mt-1 text-emerald-400">{"{"} created: 0, skipped: 4 (already billed), errors: 0 {"}"}</p>
            <p className="mt-4 border-t border-slate-700 pt-3 text-slate-400">
              -- the constraint that makes it true
            </p>
            <p className="mt-1 text-sky-300">UNIQUE(subscription_id, period_start)</p>
          </div>
        </div>
      </section>

      {/* ── the mechanics, drawn ── */}
      <section className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16" id="diagrams">
        <h2 className="text-2xl font-bold tracking-[-0.02em] [text-wrap:balance] sm:text-3xl md:text-4xl">
          The mechanics, drawn.
        </h2>
        <p className="mt-3 max-w-[62ch] leading-relaxed text-[hsl(var(--muted-foreground))]">
          No abstractions: the lifecycle a subscription walks, the pipeline the engine
          runs every billing day, and exactly how one invoice gets its total.
        </p>

        <div className="mt-10 space-y-6">
          <figure className="rounded-[var(--radius-lg)] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--border))] sm:p-6">
            <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="font-bold tracking-tight">Subscription lifecycle</span>
              <span className="font-mono text-[11px] text-[hsl(var(--muted-foreground))] sm:text-xs">state machine, every transition audited</span>
            </figcaption>
            <div className="min-w-0">
              <SubscriptionLifecycleDiagram />
            </div>
          </figure>

          <figure className="rounded-[var(--radius-lg)] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--border))] sm:p-6">
            <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="font-bold tracking-tight">Billing day, as a pipeline</span>
              <span className="font-mono text-[11px] text-[hsl(var(--muted-foreground))] sm:text-xs">idempotent by constraint</span>
            </figcaption>
            <div className="overflow-x-auto">
              <BillingFlowDiagram />
            </div>
          </figure>

          <figure className="rounded-[var(--radius-lg)] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--border))] sm:p-6">
            <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="font-bold tracking-tight">Anatomy of one invoice</span>
              <span className="font-mono text-[11px] text-[hsl(var(--muted-foreground))] sm:text-xs">INV-2026-00006, computed by the engine</span>
            </figcaption>
            <div className="overflow-x-auto">
              <InvoiceAnatomyDiagram />
            </div>
          </figure>
        </div>
      </section>

      {/* ── how it works ── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-2xl font-bold tracking-[-0.02em] [text-wrap:balance] sm:text-3xl">From catalog to collected, in four moves.</h2>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.k} className="relative rounded-[var(--radius-lg)] p-4 sm:p-6" style={{ backgroundColor: tint(s.tint) }}>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[hsl(var(--card))] tabular-nums text-lg font-bold" style={{ color: tint(s.tint, true) }}>
                {i + 1}
              </span>
              <h3 className="mt-3 font-bold tracking-tight" style={{ color: tint(s.tint, true) }}>{s.k}</h3>
              <p className="mt-1 text-[13px] leading-relaxed sm:text-sm" style={{ color: tint(s.tint, true) }}>{s.d}</p>
              {i < 3 && <span className="absolute right-4 top-6 hidden text-xl md:block" style={{ color: tint(s.tint, true) }}>→</span>}
            </div>
          ))}
        </div>

        {/* roles */}
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            { r: "Admin", t: "blue", d: "Owns the system: products, plans, taxes, discount rules, staff, billing runs, outbox, audit&nbsp;trail." },
            { r: "Staff", t: "green", d: "Runs the month: quotations, subscriptions, invoices, payments, billing day — no staff mgmt, no discount rules." },
            { r: "Customer", t: "lavender", d: "A portal of their own: subscriptions, invoices, print, pause/resume/renew — only their data,&nbsp;ever." },
          ].map((x) => (
            <div key={x.r} className="rounded-[var(--radius-lg)] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--border))]">
              <span className="inline-block rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: tint(x.t), color: tint(x.t, true) }}>
                {x.r}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── proof band ── */}
      <section id="proof" className="scroll-mt-24 border-y border-[hsl(var(--border))] bg-[#101b33] text-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-white [text-wrap:balance] md:text-3xl">
            Prove it, don’t claim it.
          </h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-slate-400">
            Every figure below is reproducible: volume-seed the database, run the EXPLAIN
            ANALYZE kit, or execute the flow verifier. Numbers ship with their scripts.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {PROOF.map((p) => (
              <div key={p.l} className="rounded-[var(--radius-lg)] bg-white/5 p-4 ring-1 ring-white/10 sm:p-5">
                <p className="tabular-nums text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">{p.v}</p>
                <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">{p.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── stack / craft ── */}
      <section id="stack" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.02em] [text-wrap:balance] sm:text-3xl">Built like the ledger it keeps.</h2>
            <p className="mt-3 leading-relaxed text-[hsl(var(--muted-foreground))]">
              Local-first by design: the whole demo runs with the WiFi off — local
              PostgreSQL, a node-cron billing worker, and mail staged in an outbox
              table instead of SMTP. No fonts from a CDN, no cloud APIs, no mocks.
            </p>
          </div>
          <ul className="space-y-2.5 text-sm">
            {[
              ["Next.js 15 + TypeScript", "one codebase, App Router"],
              ["tRPC v11", "end-to-end typesafe API, server-side RBAC"],
              ["Prisma 6", "schema-as-code, migrations, citext emails"],
              ["PostgreSQL 18 (local)", "18 tables, 3NF, 17 CHECK constraints"],
              ["Tailwind v4 + shadcn", "achromatic ledger design system"],
              ["Vitest + CI gate", "npm ci · typecheck · lint · test · build on every push"],
            ].map(([k, d]) => (
              <li key={k} className="flex items-baseline justify-between gap-4 border-b border-[hsl(var(--border))] pb-2.5">
                <span className="font-semibold">{k}</span>
                <span className="text-right text-[hsl(var(--muted-foreground))]">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── final CTA ── */}
      <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <h2 className="mx-auto max-w-[22ch] text-2xl font-bold tracking-[-0.02em] [text-wrap:balance] sm:text-3xl md:text-4xl">
            Put your revenue in orbit.
          </h2>
          <p className="mx-auto mt-3 max-w-[52ch] leading-relaxed text-[hsl(var(--muted-foreground))]">
            Create an account and run your first billing day in minutes, or sign in
            to the demo workspace and watch the engine skip an already-billed&nbsp;one.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-[hsl(var(--primary))] px-7 py-3.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-[0_12px_28px_-10px_hsl(var(--primary)/0.7)] transition hover:translate-y-[-1px]"
            >
              Start free
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-[hsl(var(--card))] px-7 py-3.5 text-sm font-semibold ring-1 ring-[hsl(var(--border))] transition hover:bg-[hsl(var(--muted))]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── demo access ── */}
      <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <DemoCredentials />
        </div>
      </section>

      {/* ── footer — Faizur-style grand footer ── */}
      <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        {/* top zone: tagline / links / arrow cards */}
        <div className="mx-auto max-w-7xl px-6 pb-10 pt-14">
          <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
            {/* LEFT — tagline block with fidget at far-left */}
            <div className="flex items-start gap-4">
              <span
                className="mt-1 shrink-0 text-[hsl(var(--muted-foreground))]"
                title="A fidget spinner, because billing should spin this smoothly"
                aria-label="Easter egg: a spinning fidget"
              >
                <FidgetSpinner />
              </span>
              <div>
                <p className="text-xl font-bold leading-snug tracking-tight sm:text-2xl">
                  The ledger that bills itself — and never bills twice.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  Subscription management for Brightloop Software, offline-first on your own PostgreSQL.
                </p>
              </div>
            </div>

            {/* MIDDLE — link columns */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Explore</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {[
                    ["#scenes", "The month"],
                    ["#engine", "Engine"],
                    ["#diagrams", "Diagrams"],
                    ["#proof", "Proof"],
                    ["#stack", "Stack"],
                  ].map(([href, label]) => (
                    <li key={href}>
                      <a href={href} className="text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--foreground))]">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Follow</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <a
                      href="https://github.com/gabsgj/Orbit"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--foreground))]"
                    >
                      <GitHubIcon size={14} />
                      GitHub Source
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* RIGHT — arrow-link cards */}
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                className="group flex items-center justify-between rounded-[var(--radius-lg)] border border-[hsl(var(--border))] px-5 py-4 transition hover:bg-[hsl(var(--muted))]"
              >
                <span className="font-semibold">Enter Orbit →</span>
                <span className="text-lg text-[hsl(var(--muted-foreground))] transition group-hover:translate-x-0.5 group-hover:text-[hsl(var(--foreground))]">↗</span>
              </Link>
              <Link
                href="/signup"
                className="group flex items-center justify-between rounded-[var(--radius-lg)] border border-[hsl(var(--border))] px-5 py-4 transition hover:bg-[hsl(var(--muted))]"
              >
                <span className="font-semibold">Start free →</span>
                <span className="text-lg text-[hsl(var(--muted-foreground))] transition group-hover:translate-x-0.5 group-hover:text-[hsl(var(--foreground))]">↗</span>
              </Link>
            </div>
          </div>
        </div>

        {/* GIANT WORDMARK — clipped at the bottom, satellite dot orbiting the O */}
        <div className="relative overflow-hidden">
          {/* decorative orbit ring behind the wordmark */}
          <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <svg className="h-[130%] w-full" viewBox="0 0 1400 400" fill="none" preserveAspectRatio="xMidYMid slice">
              <ellipse cx="700" cy="200" rx="620" ry="150" stroke="hsl(var(--tint-blue))" strokeWidth="1.5" transform="rotate(-14 700 200)" />
            </svg>
          </div>
          <div className="relative mx-auto max-w-7xl px-6">
            <p
              aria-hidden
              className="translate-y-[12%] text-center font-extrabold leading-[0.85] tracking-[-0.05em] text-[hsl(var(--foreground))]"
              style={{ fontSize: "clamp(6rem, 19vw, 22rem)", fontWeight: 800 }}
            >
              <span className="relative inline-block">
                ORBIT
                {/* satellite dot orbiting the O — positioned top-right of the O */}
                <span className="absolute -top-[0.06em] left-[0.62em]">
                  <LogoMark size={40} bare className="h-[0.14em] w-[0.14em] sm:h-[0.16em] sm:w-[0.16em]" />
                </span>
              </span>
            </p>
          </div>
        </div>

        {/* bottom bar */}
        <div className="border-t border-[hsl(var(--border))]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-xs text-[hsl(var(--muted-foreground))]">
            <p>Orbit ©2026 · Put your revenue in orbit</p>
            <div className="flex items-center gap-2">
              <p>Kochi · offline-first · zero dependencies</p>
              <span
                className="text-[hsl(var(--muted-foreground))]"
                title="The billing-day stick man. Hover him, he waves."
                aria-label="Easter egg: a stick man who waves on hover"
              >
                <StickMan size={22} />
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
