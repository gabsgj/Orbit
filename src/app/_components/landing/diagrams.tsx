/**
 * Landing-page SVG diagrams — crisp vector geometry only (no pictorial
 * illustration, no emoji, no external assets). All colors come from the
 * Orbit Soft Ledger tokens in globals.css via `hsl(var(--token))` inline
 * styles, so the diagrams track the theme automatically.
 *
 * Exported:
 *   - SubscriptionLifecycleDiagram  (DRAFT → … → CLOSED state machine)
 *   - BillingFlowDiagram            (billing engine pipeline)
 *   - InvoiceAnatomyDiagram         (how one invoice is computed)
 */

import React from "react";

const TOK = {
  neutralBg: "hsl(var(--status-neutral-bg))",
  neutralInk: "hsl(var(--status-neutral-ink))",
  lavenderBg: "hsl(var(--tint-lavender))",
  lavenderInk: "hsl(var(--tint-lavender-ink))",
  blueBg: "hsl(var(--tint-blue))",
  blueInk: "hsl(var(--tint-blue-ink))",
  greenBg: "hsl(var(--tint-green))",
  greenInk: "hsl(var(--tint-green-ink))",
  amberBg: "hsl(var(--tint-amber))",
  amberInk: "hsl(var(--tint-amber-ink))",
  roseBg: "hsl(var(--tint-rose))",
  roseInk: "hsl(var(--tint-rose-ink))",
  tealBg: "hsl(var(--tint-teal))",
  tealInk: "hsl(var(--tint-teal-ink))",
  arrow: "hsl(var(--primary))",
  muted: "hsl(var(--muted-foreground))",
  border: "hsl(var(--border))",
  foreground: "hsl(var(--foreground))",
} as const;

/** Inline pill label so SVG text never needs letter-spacing attributes. */
function ChipLabel({
  x,
  y,
  text,
  ink,
  size = 11.5,
  tracking = 1.6,
  weight = 700,
}: {
  x: number;
  y: number;
  text: string;
  ink: string;
  size?: number;
  tracking?: number;
  weight?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={size}
      fontWeight={weight}
      fill={ink}
      style={{ letterSpacing: `${tracking}px`, textTransform: "uppercase" }}
    >
      {text}
    </text>
  );
}

/* ─── 1 · Subscription lifecycle state machine ─────────────────────────── */

const LIFECYCLE_STATES: ReadonlyArray<{ label: string; bg: string; ink: string }> = [
  { label: "DRAFT", bg: TOK.neutralBg, ink: TOK.neutralInk },
  { label: "QUOTATION", bg: TOK.lavenderBg, ink: TOK.lavenderInk },
  { label: "CONFIRMED", bg: TOK.blueBg, ink: TOK.blueInk },
  { label: "ACTIVE", bg: TOK.greenBg, ink: TOK.greenInk },
  { label: "CLOSED", bg: TOK.neutralBg, ink: TOK.neutralInk },
];

export function SubscriptionLifecycleDiagram() {
  const chipH = 38;
  const chipY = 44; // top edge of the main row
  const midY = chipY + chipH / 2;
  const gap = 36;
  // Chip widths sized to their labels (approx 7.4px per tracked uppercase char).
  const widths = [92, 132, 130, 92, 92];
  const xs: number[] = [];
  {
    let cursor = 28;
    for (let i = 0; i < widths.length; i++) {
      xs.push(cursor);
      cursor += widths[i] + gap;
    }
  }
  const activeIdx = 3;
  const activeCx = xs[activeIdx] + widths[activeIdx] / 2;
  const pausedW = 96;
  const pausedY = 128; // top edge of the PAUSED chip

  return (
    <svg
      viewBox="0 0 900 180"
      className="h-auto w-full"
      role="img"
      aria-label="Subscription lifecycle: Draft to Quotation to Confirmed to Active to Closed, with Paused dangling below Active via pause and resume."
    >
      <defs>
        <marker
          id="lc-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={TOK.arrow} />
        </marker>
      </defs>

      {/* main-row connectors */}
      {xs.slice(0, -1).map((x, i) => {
        const x1 = x + widths[i] + 6;
        const x2 = xs[i + 1] - 6;
        return (
          <line
            key={i}
            x1={x1}
            y1={midY}
            x2={x2}
            y2={midY}
            stroke={TOK.arrow}
            strokeWidth={1.8}
            markerEnd="url(#lc-arrow)"
          />
        );
      })}

      {/* state chips */}
      {LIFECYCLE_STATES.map((s, i) => (
        <g key={s.label}>
          <rect
            x={xs[i]}
            y={chipY}
            width={widths[i]}
            height={chipH}
            rx={chipH / 2}
            fill={s.bg}
            stroke={s.ink}
            strokeOpacity={0.22}
          />
          <ChipLabel x={xs[i] + widths[i] / 2} y={midY + 0.5} text={s.label} ink={s.ink} />
        </g>
      ))}

      {/* PAUSED dangling below ACTIVE — two-way pause / resume connector */}
      <line
        x1={activeCx - 9}
        y1={chipY + chipH + 8}
        x2={activeCx - 9}
        y2={pausedY - 14}
        stroke={TOK.arrow}
        strokeWidth={1.8}
        markerEnd="url(#lc-arrow)"
      />
      <line
        x1={activeCx + 9}
        y1={pausedY - 14}
        x2={activeCx + 9}
        y2={chipY + chipH + 8}
        stroke={TOK.arrow}
        strokeWidth={1.8}
        markerEnd="url(#lc-arrow)"
      />
      <text
        x={activeCx + 22}
        y={(chipY + chipH + pausedY) / 2 - 2}
        textAnchor="start"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
        fill={TOK.muted}
        style={{ letterSpacing: "0.6px" }}
      >
        pause / resume
      </text>

      <rect
        x={activeCx - pausedW / 2}
        y={pausedY}
        width={pausedW}
        height={chipH}
        rx={chipH / 2}
        fill={TOK.amberBg}
        stroke={TOK.amberInk}
        strokeOpacity={0.22}
      />
      <ChipLabel x={activeCx} y={pausedY + chipH / 2 + 0.5} text="PAUSED" ink={TOK.amberInk} />
    </svg>
  );
}

/* ─── 2 · Billing engine pipeline ──────────────────────────────────────── */

const FLOW_STAGES: ReadonlyArray<{
  title: string;
  sub: readonly [string, string];
  bg: string;
  ink: string;
  w: number;
}> = [
  {
    title: "Due subscriptions",
    sub: ["status = ACTIVE", "next_billing_date ≤ today"],
    bg: TOK.blueBg,
    ink: TOK.blueInk,
    w: 200,
  },
  {
    title: "Engine",
    sub: ["advisory lock", "one run at a time"],
    bg: TOK.amberBg,
    ink: TOK.amberInk,
    w: 164,
  },
  {
    title: "Invoice",
    sub: ["snapshot lines · tax", "discounts · gapless no."],
    bg: TOK.lavenderBg,
    ink: TOK.lavenderInk,
    w: 188,
  },
  {
    title: "Payment",
    sub: ["auto-PAID", "same transaction"],
    bg: TOK.tealBg,
    ink: TOK.tealInk,
    w: 150,
  },
  {
    title: "Dashboard",
    sub: ["MRR · aging", "renewals"],
    bg: TOK.greenBg,
    ink: TOK.greenInk,
    w: 150,
  },
];

export function BillingFlowDiagram() {
  const boxH = 84;
  const boxY = 34;
  const gap = 18;
  const xs: number[] = [];
  {
    let cursor = 14;
    for (const s of FLOW_STAGES) {
      xs.push(cursor);
      cursor += s.w + gap;
    }
  }
  const midY = boxY + boxH / 2;
  const engineCx = xs[1] + FLOW_STAGES[1].w / 2;

  return (
    <svg
      viewBox="0 0 960 220"
      className="h-auto w-full min-w-[620px] sm:min-w-0"
      role="img"
      aria-label="Billing pipeline: due subscriptions feed the engine under an advisory lock, producing invoices, payments, and dashboard metrics."
    >
      <defs>
        <marker
          id="bf-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={TOK.arrow} />
        </marker>
      </defs>

      {/* connectors */}
      {xs.slice(0, -1).map((x, i) => (
        <line
          key={i}
          x1={x + FLOW_STAGES[i].w + 5}
          y1={midY}
          x2={xs[i + 1] - 5}
          y2={midY}
          stroke={TOK.arrow}
          strokeWidth={1.8}
          markerEnd="url(#bf-arrow)"
        />
      ))}

      {/* stage boxes */}
      {FLOW_STAGES.map((s, i) => (
        <g key={s.title}>
          <rect
            x={xs[i]}
            y={boxY}
            width={s.w}
            height={boxH}
            rx={16}
            fill={s.bg}
            stroke={s.ink}
            strokeOpacity={0.22}
          />
          <text
            x={xs[i] + s.w / 2}
            y={boxY + 24}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={14}
            fontWeight={700}
            fill={s.ink}
            style={{ letterSpacing: "0.2px" }}
          >
            {s.title}
          </text>
          {s.sub.map((line, li) => (
            <text
              key={li}
              x={xs[i] + s.w / 2}
              y={boxY + 47 + li * 15}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fontWeight={500}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fill={s.ink}
              opacity={0.85}
            >
              {line}
            </text>
          ))}
        </g>
      ))}

      {/* idempotency footnote under the engine box */}
      <line
        x1={engineCx}
        y1={boxY + boxH + 6}
        x2={engineCx}
        y2={boxY + boxH + 26}
        stroke={TOK.border}
        strokeWidth={1.4}
      />
      <rect
        x={engineCx - 148}
        y={boxY + boxH + 26}
        width={296}
        height={34}
        rx={17}
        fill="none"
        stroke={TOK.border}
        strokeWidth={1.2}
        strokeDasharray="3 4"
      />
      <text
        x={engineCx}
        y={boxY + boxH + 43}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill={TOK.muted}
      >
        UNIQUE(subscription_id, period_start)
      </text>
    </svg>
  );
}

/* ─── 3 · Invoice anatomy — the equation ───────────────────────────────── */

const EQUATION_TERMS: ReadonlyArray<{
  title: string;
  sub: string;
  amount: string;
  bg: string;
  ink: string;
}> = [
  {
    title: "Lines",
    sub: "snapshot, never recomputed",
    amount: "₹1,559.00",
    bg: TOK.blueBg,
    ink: TOK.blueInk,
  },
  {
    title: "Tax",
    sub: "GST 18%",
    amount: "+ ₹280.62",
    bg: TOK.amberBg,
    ink: TOK.amberInk,
  },
  {
    title: "Discount",
    sub: "LAUNCH200",
    amount: "− ₹200.00",
    bg: TOK.roseBg,
    ink: TOK.roseInk,
  },
  {
    title: "Grand total",
    sub: "INV-2026-00006",
    amount: "₹1,639.62",
    bg: TOK.greenBg,
    ink: TOK.greenInk,
  },
];

export function InvoiceAnatomyDiagram() {
  const cardW = 196;
  const cardH = 96;
  const cardY = 40;
  const opW = 44; // operator slot between cards
  const operators = ["+", "−", "="];
  const xs: number[] = [];
  {
    let cursor = 28;
    for (let i = 0; i < EQUATION_TERMS.length; i++) {
      xs.push(cursor);
      cursor += cardW + opW;
    }
  }
  const midY = cardY + cardH / 2;

  return (
    <svg
      viewBox="0 0 960 200"
      className="h-auto w-full min-w-[620px] sm:min-w-0"
      role="img"
      aria-label="Invoice equation: snapshot lines plus GST 18 percent tax minus LAUNCH200 discount equals a grand total of ₹1,639.62."
    >
      {EQUATION_TERMS.map((t, i) => (
        <g key={t.title}>
          <rect
            x={xs[i]}
            y={cardY}
            width={cardW}
            height={cardH}
            rx={16}
            fill={t.bg}
            stroke={t.ink}
            strokeOpacity={0.22}
          />
          <text
            x={xs[i] + cardW / 2}
            y={cardY + 26}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13.5}
            fontWeight={700}
            fill={t.ink}
            style={{ letterSpacing: "0.2px" }}
          >
            {t.title}
          </text>
          <text
            x={xs[i] + cardW / 2}
            y={cardY + 46}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={12}
            fontWeight={500}
            fill={t.ink}
            opacity={0.85}
          >
            {t.sub}
          </text>
          <text
            x={xs[i] + cardW / 2}
            y={cardY + 74}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={i === EQUATION_TERMS.length - 1 ? 19 : 16}
            fontWeight={700}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fill={t.ink}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {t.amount}
          </text>
        </g>
      ))}

      {/* operators */}
      {operators.map((op, i) => (
        <text
          key={i}
          x={xs[i] + cardW + opW / 2}
          y={midY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={26}
          fontWeight={600}
          fill={TOK.muted}
        >
          {op}
        </text>
      ))}

      {/* footnote: the invariant the equation rests on */}
      <text
        x={480}
        y={172}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill={TOK.muted}
      >
        invoice_lines are snapshots — totals never recomputed from live prices
      </text>
    </svg>
  );
}
