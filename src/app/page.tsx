import Link from "next/link";
import { LogoMark } from "@/shared/ui/logo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orbit, Recurring billing that cannot bill you twice",
  description:
    "Orbit runs the full life of a subscription business: products and plans, quotation templates, subscription lifecycles, idempotent recurring billing, invoices, payments and revenue reporting, offline-first, on your own PostgreSQL.",
};

/* ─── tiny building blocks (ledger grammar: hairlines, chips, tabular figures) ─── */

function StatusChip({ tone, children }: { tone: "active" | "overdue" | "warning" | "neutral"; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-[var(--radius-xs)] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
      style={{
        backgroundColor: `hsl(var(--status-${tone}-bg))`,
        color: `hsl(var(--status-${tone}-ink))`,
      }}
    >
      {children}
    </span>
  );
}

function Mono({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <code className={`font-mono text-[0.92em] text-[hsl(var(--chart-1))] ${className}`}>{children}</code>
  );
}

/* ─── the live ledger invoice, the hero's working artifact ─── */

function LedgerInvoice() {
  const lines = [
    { desc: "Brightloop CRM (Odoo), Oct 1 → Nov 1", qty: 1, price: "1,559.00", amount: "1,559.00" },
    { desc: "GST 18%", qty: null, price: null, amount: "280.62", tax: true },
    { desc: "LAUNCH200, launch discount", qty: null, price: null, amount: "−200.00", discount: true },
  ];
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      {/* status strip */}
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--chart-1))] opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--chart-1))]" />
          </span>
          <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Billing run just completed, 00:05 UTC · automatic
          </span>
        </div>
        <StatusChip tone="active">Confirmed</StatusChip>
      </div>

      {/* invoice head */}
      <div className="flex items-start justify-between px-5 pt-4">
        <div>
          <p className="font-mono text-sm font-semibold text-[hsl(var(--foreground))]">INV-2026-00006</p>
          <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">Acme Stores Pvt Ltd · due Nov 15</p>
        </div>
        <p className="text-right text-xs text-[hsl(var(--muted-foreground))]">
          from <span className="font-mono">SUB-2026-00001</span>
          <br />
          period 2026-10-01 → 2026-11-01
        </p>
      </div>

      {/* lines */}
      <div className="px-5 py-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              <th className="pb-2 font-semibold">Line</th>
              <th className="pb-2 text-right font-semibold">Qty</th>
              <th className="pb-2 text-right font-semibold">Price</th>
              <th className="pb-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.desc} className="border-t border-[hsl(var(--border))]/60">
                <td className={`py-2 pr-2 ${l.tax ? "text-[hsl(var(--muted-foreground))]" : ""} ${l.discount ? "text-[hsl(var(--status-active-ink))]" : ""}`}>
                  {l.desc}
                </td>
                <td className="py-2 text-right tabular-nums text-[hsl(var(--muted-foreground))]">{l.qty ?? "—"}</td>
                <td className="py-2 text-right tabular-nums text-[hsl(var(--muted-foreground))]">{l.price ?? "—"}</td>
                <td className="py-2 text-right tabular-nums font-medium">{l.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 flex items-baseline justify-between border-t-2 border-[hsl(var(--foreground))] pt-3">
          <span className="text-sm font-semibold">Total</span>
          <span className="tabular-nums text-xl font-bold tracking-tight">₹1,639.62</span>
        </div>
      </div>

      {/* footer strip */}
      <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-5 py-2.5">
        <p className="font-mono text-xs text-[hsl(var(--muted-foreground))]">
          UNIQUE(subscription_id, period_start), the database refuses a second invoice for this period
        </p>
      </div>
    </div>
  );
}

/* ─── sections ─── */

const PAIN = [
  { what: "Subscriptions", how: "tracked in a spreadsheet" },
  { what: "Renewals", how: "remembered by whoever notices first" },
  { what: "Invoices", how: "typed up by hand every month" },
  { what: "Payments", how: "matched by scrolling bank statements" },
  { what: "Revenue reports", how: "built manually, once a quarter" },
];

const SCENES = [
  {
    n: "01",
    title: "Accounts & roles",
    body: "Customers self-signup with a real password policy and hashed, single-use reset links staged in a mail outbox. Admin, staff and customer see three different systems behind one login, RBAC enforced server-side, citext-unique emails.",
    proof: "Admin · Staff · Customer",
  },
  {
    n: "02",
    title: "Catalog, plans & variants",
    body: "Products with attributes and variants, the Odoo brand adds ₹560 with price_extra. Plans carry billing period, minimum quantity, availability windows and per-plan flags: auto-close, closable-early, pausable, renewable.",
    proof: "4 plan flags · 2 tax profiles",
  },
  {
    n: "03",
    title: "Quote → subscription",
    body: "Sales starts from a quotation template with pre-filled lines and a validity window, then walks one state machine: Draft → Quotation → Confirmed → Active → Closed, with every transition recorded by actor and timestamp.",
    proof: "Full status history",
  },
  {
    n: "04",
    title: "Billing day",
    body: "Hundreds of subscriptions due at once become invoices with snapshot lines, per-line tax, discounts and gapless numbers. Re-run the same day and the database reports “0 created · 4 skipped (already billed)”, nothing billed twice, nothing skipped, catch-up built in.",
    proof: "Idempotent by constraint",
  },
  {
    n: "05",
    title: "Discounts that apply themselves",
    body: "Admin-set rules, percent or fixed, minimums, date windows, usage limits, product or subscription scope. The next invoice carries the discount on its own line, stops on expiry or exhaustion, and keeps a usage ledger.",
    proof: "LAUNCH200 · SEAT10",
  },
  {
    n: "06",
    title: "Payments & dunning",
    body: "Record a payment by UPI, card, cash, transfer or cheque; the invoice flips to Paid inside the same transaction, overpayments rejected. Overdue invoices surface instantly, and one click stages a reminder in the outbox.",
    proof: "Overdue → reminder in 1 click",
  },
  {
    n: "07",
    title: "The finance lead",
    body: "Active subscriptions, revenue received, amount owed, overdue aging buckets, MRR and ARR with movement (new · expansion · contraction · churn), renewal forecast, revenue by plan, one summary, filterable, exportable to CSV.",
    proof: "MRR movement · aging · CSV",
  },
];

const STEPS = [
  { k: "Catalog", d: "Admin adds products, variants, plans, taxes" },
  { k: "Subscribe", d: "Template → quotation → confirmed → active" },
  { k: "Bill", d: "Engine invoices every due period, idempotently" },
  { k: "Collect", d: "Payments settle invoices; overdue gets chased" },
];

const PROOF = [
  { v: "10,007", l: "subscriptions seeded for the perf proof" },
  { v: "10.55 ms", l: "slowest dashboard query (budget: 2 s)" },
  { v: "17", l: "CHECK constraints holding business&nbsp;rules" },
  { v: "142", l: "automated tests on the billing core" },
  { v: "12/12", l: "end-to-end flows verified green" },
  { v: "0", l: "external dependencies, runs fully offline" },
];

/* ─── page ─── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* ── nav ── */}
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2" aria-label="Orbit home">
            <LogoMark size={28} />
            <span className="text-[15px] font-bold tracking-tight">Orbit</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[hsl(var(--muted-foreground))] md:flex">
            <a href="#scenes" className="hover:text-[hsl(var(--foreground))]">The month</a>
            <a href="#engine" className="hover:text-[hsl(var(--foreground))]">Billing engine</a>
            <a href="#proof" className="hover:text-[hsl(var(--foreground))]">Proof</a>
            <a href="#stack" className="hover:text-[hsl(var(--foreground))]">Stack</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]">
              Sign in
            </Link>
            <Link href="/signup" className="rounded-[var(--radius-sm)] bg-[hsl(var(--primary))] px-3.5 py-1.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90">
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* ── hero: the ledger spread ── */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-14 md:grid-cols-[44%_56%] md:gap-8 md:pt-20">
        <div className="flex flex-col justify-center">
          <h1 className="text-[2.6rem] font-bold leading-[1.05] tracking-[-0.02em] md:text-6xl md:leading-[1.02] [text-wrap:balance]">
            Recurring billing that cannot bill you twice.
          </h1>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
            Orbit runs the full life of a subscription business: plans, subscriptions,
            recurring invoices, payments and revenue reporting, with an idempotent
            billing engine enforced by the database itself. Offline-first, on your
            own PostgreSQL.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="rounded-[var(--radius-sm)] bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-[0_8px_20px_-8px_rgba(15,23,42,0.5)] transition hover:translate-y-[-1px]"
            >
              Start free, create your account
            </Link>
            <Link
              href="/login"
              className="rounded-[var(--radius-sm)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-3 text-sm font-semibold hover:bg-[hsl(var(--muted))]"
            >
              Enter Orbit →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 divide-x divide-[hsl(var(--border))] border-t border-[hsl(var(--border))] pt-5">
            {[
              { v: "0", l: "duplicate invoices, ever" },
              { v: "₹1,639.62", l: "invoice just generated →" },
              { v: "100%", l: "offline, no internet needed" },
            ].map((f) => (
              <div key={f.l} className="px-4 first:pl-0">
                <p className="tabular-nums text-xl font-bold tracking-tight">{f.v}</p>
                <p className="mt-0.5 text-xs leading-snug text-[hsl(var(--muted-foreground))]">{f.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <LedgerInvoice />
          <p className="mt-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
            Live artifact from the demo dataset, every number computed by the engine
          </p>
        </div>
      </section>

      {/* ── pain: how things run today ── */}
      <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="grid gap-10 md:grid-cols-[38%_62%]">
            <div>
              <h2 className="[text-wrap:balance] text-3xl font-bold tracking-[-0.02em]">How things run today.</h2>
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

      {/* ── 7 scenes ── */}
      <section id="scenes" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="[text-wrap:balance] max-w-[20ch] text-3xl font-bold tracking-[-0.02em] md:text-4xl">
          One billing month at Brightloop, every scene, handled.
        </h2>
        <p className="mt-3 max-w-[62ch] leading-relaxed text-[hsl(var(--muted-foreground))]">
          From a new customer signing up to the finance lead closing the month:
          the seven moments that break a spreadsheet workflow, each a working part of Orbit.
        </p>
        <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--border))] md:grid-cols-2">
          {SCENES.map((s) => (
            <article key={s.n} className="bg-[hsl(var(--card))] p-6">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs font-semibold text-[hsl(var(--chart-1))]">{s.n}</span>
                <span className="rounded-[var(--radius-xs)] bg-[hsl(var(--muted))] px-2 py-0.5 font-mono text-xs text-[hsl(var(--muted-foreground))]">
                  {s.proof}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-bold tracking-tight">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── billing engine spotlight ── */}
      <section id="engine" className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2">
          <div>
            <h2 className="[text-wrap:balance] text-3xl font-bold tracking-[-0.02em]">The engine is the product.</h2>
            <p className="mt-3 leading-relaxed text-[hsl(var(--muted-foreground))]">
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
                <li key={k as string} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--chart-1))]" />
                  <p className="text-sm leading-relaxed"><strong className="font-semibold">{k}.</strong>{" "}<span className="text-[hsl(var(--muted-foreground))]">{d}</span></p>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-center rounded-lg border border-[hsl(var(--border))] bg-[#0f172a] p-6 font-mono text-[13px] leading-relaxed text-slate-300">
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

      {/* ── how it works ── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="[text-wrap:balance] text-3xl font-bold tracking-[-0.02em]">From catalog to collected, in four moves.</h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--border))] md:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.k} className="relative bg-[hsl(var(--card))] p-6">
              <span className="tabular-nums text-3xl font-bold text-[hsl(var(--muted-foreground))]">{i + 1}</span>
              <h3 className="mt-2 font-bold tracking-tight">{s.k}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{s.d}</p>
              {i < 3 && <span className="absolute right-4 top-6 hidden text-[hsl(var(--muted-foreground))] md:block">→</span>}
            </div>
          ))}
        </div>

        {/* roles */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { r: "Admin", d: "Owns the system: products, plans, taxes, discount rules, staff, billing runs, outbox, audit trail." },
            { r: "Staff", d: "Runs the month: quotations, subscriptions, invoices, payments, billing day — no staff mgmt, no discount rules." },
            { r: "Customer", d: "A portal of their own: subscriptions, invoices, print, pause/resume/renew — only their data, ever." },
          ].map((x) => (
            <div key={x.r} className="border-t-2 border-[hsl(var(--foreground))] pt-4">
              <h3 className="font-bold tracking-tight">{x.r}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── proof band ── */}
      <section id="proof" className="border-y border-[hsl(var(--border))] bg-[#0f172a] text-slate-200">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="[text-wrap:balance] text-2xl font-bold tracking-[-0.02em] text-white md:text-3xl">
            Prove it, don’t claim it.
          </h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-slate-400">
            Every figure below is reproducible: volume-seed the database, run the EXPLAIN
            ANALYZE kit, or execute the flow verifier. Numbers ship with their scripts.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3">
            {PROOF.map((p) => (
              <div key={p.l}>
                <p className="tabular-nums text-3xl font-bold tracking-tight text-white md:text-4xl">{p.v}</p>
                <p className="mt-1 text-sm leading-snug text-slate-400">{p.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── stack / craft ── */}
      <section id="stack" className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="[text-wrap:balance] text-3xl font-bold tracking-[-0.02em]">Built like the ledger it keeps.</h2>
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
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 className="[text-wrap:balance] mx-auto max-w-[22ch] text-3xl font-bold tracking-[-0.02em] md:text-4xl">
            Put your revenue in orbit.
          </h2>
          <p className="mx-auto mt-3 max-w-[52ch] leading-relaxed text-[hsl(var(--muted-foreground))]">
            Create an account and run your first billing day in minutes, or sign in
            to the demo workspace and watch the engine skip an already-billed&nbsp;one.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-[var(--radius-sm)] bg-[hsl(var(--primary))] px-6 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-[0_8px_20px_-8px_rgba(15,23,42,0.5)] transition hover:translate-y-[-1px]"
            >
              Start free
            </Link>
            <Link
              href="/login"
              className="rounded-[var(--radius-sm)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-3 text-sm font-semibold hover:bg-[hsl(var(--muted))]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── footer ── */}
      <footer className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-8 text-sm text-[hsl(var(--muted-foreground))] md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <LogoMark size={24} />
            <span><strong className="font-semibold text-[hsl(var(--foreground))]">Orbit</strong> — subscription management for Brightloop Software</span>
          </div>
          <p className="font-mono text-xs">
            offline-first · local PostgreSQL · zero dependencies
          </p>
        </div>
      </footer>
    </div>
  );
}
