# DESIGN.md — Orbit Design System & Art Direction

> **Product:** Orbit (for Brightloop Software)  
> **Event:** Odoo × Make-a-Ton 9.0, Kochi Hackathon  
> **Lead / Owner:** Pavithra S Rajesh (Experience & Insights Lead)  
> **Status:** UI Gate 0 (Phase 0) Complete · Canonical Design Reference  
> **Toolchain Skills:** `design-taste-frontend` (v2 tasteskill) & `impeccable`

---

## 1. Art Direction & Visual Thesis

Orbit is the digital financial backbone of **Brightloop Software**, a company managing hundreds to thousands of recurring subscriptions, high-velocity billing cycles, and complex invoice aging.

From our study and run of `design-taste-frontend` (`--app --kind finance`):
> **The Style: Achromatic Ledger with Targeted Data Chroma**  
> *"The chrome holds no colour at all; money and counts are set in ink, the one chart hue marks the screen's main data element, and the only other hue is a small signal where a figure changed."*

### Core Tenets

1. **Colour goes on data, not chrome:** 
   The application frame, sidebars, and cards use an achromatic spectrum (pure white surfaces, slate-tinted borders, crisp ink text). Colour is strictly reserved for data visualization (primary MRR trend) and status indicators (e.g. Paid vs Overdue). The total coloured pixel area stays under 3% on any screen.
2. **KPIs are typographic statements, not decorative tiles:**
   No icons inside pastel rounded squares. No meaningless mini-sparklines on summary cards. A KPI is a bold, high-contrast numeric statement with a crisp label, time horizon context, and an honest delta.
3. **Surfaces are flat and grounded:**
   No floating box-shadows on static cards. Layer separation is achieved through precise 1px borders (`hsl(var(--border))`) and subtle tone steps (`hsl(var(--background))` vs `hsl(var(--card))`). Drop shadows are used exclusively for truly floating elements: dropdowns, tooltips, and modal dialogs.
4. **Dense, professional data alignment:**
   All monetary amounts, document sequences (`SUB-2026-00042`, `INV-2026-00123`), and counts use tabular numbers (`tabular-nums`). Numbers are right-aligned; text is left-aligned; status tags are centered.
5. **Two distinct shells:**
   - **`AppShell`**: For internal team members (`ADMIN` and `STAFF`). An ergonomic L-frame layout with a collapsible sidebar and contextual topbar designed for rapid navigation across catalog, quotations, subscriptions, billing runs, and finance reporting.
   - **`PortalShell`**: For external customers (`CUSTOMER`). A clean, focused top-bar shell tailored for checking active subscriptions, viewing outstanding balances, and downloading/printing invoices.

---

## 2. Design Tokens (HSL & CSS Custom Properties)

All tokens are defined in `src/app/globals.css` using HSL channel variables to ensure 100% compatibility with Tailwind CSS v4 and shadcn/ui components.

### 2.1 CSS Variables (`:root`)

```css
:root {
  /* Surfaces & Chrome */
  --background: 210 20% 98%;          /* #f8fafc - App ground */
  --foreground: 222 47% 11%;          /* #0f172a - Deep ink */
  
  --card: 0 0% 100%;                  /* #ffffff - Card surface */
  --card-foreground: 222 47% 11%;
  
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;
  
  /* Actions & Primary */
  --primary: 222 47% 11%;              /* #0f172a - Near black action */
  --primary-foreground: 210 40% 98%;   /* #f8fafc */
  
  --secondary: 210 20% 94%;            /* #f1f5f9 - Muted interactive */
  --secondary-foreground: 222 47% 11%;
  
  --muted: 210 20% 96%;                /* #f1f5f9 - Subtle background */
  --muted-foreground: 215 16% 47%;     /* #64748b - Secondary text */
  
  --accent: 210 20% 92%;               /* #e2e8f0 - Hover background */
  --accent-foreground: 222 47% 11%;
  
  /* Borders, Lines & Rings */
  --border: 214 20% 90%;               /* #e2e8f0 - 1px boundary rules */
  --input: 214 20% 90%;                /* #e2e8f0 - Form controls */
  --ring: 222 47% 11%;                 /* #0f172a - Focus ring */
  
  /* Radii */
  --radius: 0.5rem;                    /* 8px base card radius */
  --radius-sm: 0.375rem;               /* 6px control radius */
  --radius-xs: 0.25rem;                /* 4px badge / pill radius */

  /* Financial Domain & Status Signals */
  --kpi-primary: 217 91% 45%;          /* #1d5fbf - Primary data hue (MRR) */
  --chart-1: 217 91% 45%;              /* #1d5fbf - Main series */
  --chart-2: 215 16% 47%;              /* #64748b - Comparison / past period */
  --chart-3: 199 89% 48%;              /* #0ea5e9 - Tertiary series */
  --chart-4: 38 92% 50%;               /* #f59e0b - Auxiliary series */

  /* Status Colors */
  --status-active-bg: 142 76% 95%;     /* #ecfdf5 - Emerald tint */
  --status-active-ink: 160 84% 19%;    /* #064e3b - Emerald dark */
  --status-overdue-bg: 0 86% 97%;      /* #fef2f2 - Rose tint */
  --status-overdue-ink: 0 74% 42%;     /* #991b1b - Crimson dark */
  --status-warning-bg: 48 96% 89%;     /* #fef3c7 - Amber tint */
  --status-warning-ink: 38 92% 25%;    /* #78350f - Amber dark */
  --status-neutral-bg: 210 20% 94%;    /* #f1f5f9 - Slate tint */
  --status-neutral-ink: 215 25% 27%;   /* #334155 - Slate dark */
}
```

---

## 3. Typography Scale & Hierarchy

- **Primary Font:** `Inter`, `Geist`, or clean system sans-serif (`system-ui, -apple-system, sans-serif`).
- **Monospace / Numerical Font:** `Geist Mono`, `ui-monospace`, `SFMono-Regular`, or tabular figures (`tabular-nums`). Used for Currency values, Sequence numbers (`SUB-2026-00042`), dates, and metrics.

| Level | Size | Weight | Line Height | Tracking | Usage |
|---|---|---|---|---|---|
| **KPI Display** | 30px (`text-3xl`) | 700 (Bold) | 1.1 | `-0.02em` | Main dashboard KPI card numbers (`₹4,82,500`) |
| **Page Title (H1)** | 22px (`text-xl`) | 600 (Semibold) | 1.25 | `-0.015em` | Page header (max 2 lines at any viewport) |
| **Section Title (H2)** | 16px (`text-base`) | 600 (Semibold) | 1.3 | `-0.01em` | Card titles, table section heads |
| **Subsection (H3)** | 14px (`text-sm`) | 600 (Semibold) | 1.4 | `0` | Dialog headers, sidebar subheadings |
| **Body text** | 14px (`text-sm`) | 400 (Regular) | 1.5 | `0` | Standard table cell data, descriptions, forms |
| **Small / Meta** | 12px (`text-xs`) | 500 (Medium) | 1.4 | `0` | Table headers, KPI comparison captions, timestamps |
| **Micro / Badge** | 11px | 600 (Semibold) | 1.2 | `0.02em` | Status badges, sequence pills |

> **Two-Line Rule:** Every page title and card headline MUST resolve in two lines or fewer across all viewport widths (360px to 1920px).

---

## 4. Spacing, Layout Grid & Density

- **Density:** Information-dense, built for business operations.
- **Card Padding:** `p-5` (20px) on desktop, `p-4` (16px) on mobile.
- **Page Margin:** `px-6 py-6` (24px) inside internal shell content areas.
- **Grid Gaps:** `gap-4` (16px) or `gap-6` (24px).
- **Table Pitch:** Row height 44px for standard lists, with 1px border dividers (`border-b border-border`).

### Responsive Breakpoints
- **Mobile (`< 768px`):** Sidebar collapses into accessible sliding drawer / overlay sheet; KPI grids stack into 2 columns; table rows scroll horizontally or switch to two-line cards.
- **Tablet (`768px - 1024px`):** Compact sidebar with label tooltips; 2x2 KPI grid; full table with sticky headers.
- **Desktop (`≥ 1024px`):** Full 240px sidebar; 4-column KPI cards; sticky table headers with integrated filter bar.

---

## 5. Shell Architecture

### 5.1 AppShell (Staff & Admin)
Located at: `src/shared/ui/app-shell.tsx`
- **Sidebar (240px wide):**
  - Brand identity: **Orbit** wordmark with dynamic workspace label (*Brightloop Software*).
  - Role indicator badge (`ADMIN` or `STAFF`).
  - Navigation groups:
    - **Overview**: Dashboard
    - **Operations**: Subscriptions, Quotation Templates, Invoices, Payments, Billing Runs
    - **Catalog**: Products, Plans, Taxes
    - **Admin Controls**: Discount Rules (admin only), Staff Management (admin only), Mail Outbox (admin only), Audit Log (admin only)
  - Footer: User profile snippet with fast sign-out trigger.
- **Topbar (48px height):**
  - Current location breadcrumb.
  - "Run Billing Day" quick trigger button (opens confirmation & live run modal).
  - Quick status indicators.

### 5.2 PortalShell (Customer)
Located at: `src/shared/ui/portal-shell.tsx`
- **Header (56px height):**
  - Orbit logo + "Customer Portal — Brightloop".
  - Clean horizontal navigation:
    - My Subscriptions
    - Invoices & Billing
  - User avatar and Logout button.
- **Container:**
  - Centered max-w-5xl column with 24px horizontal padding.
  - High clarity, friction-free invoice downloading and printing.

---

## 6. Shared Component Recipes (`src/shared/ui/`)

| Component | File | Description & Behavior |
|---|---|---|
| **Button** | `src/shared/ui/button.tsx` | Variants: `default` (near-black ink), `secondary` (clean gray), `outline` (1px border), `ghost`, `destructive`. Sizes: `default` (36px), `sm` (30px), `lg` (40px), `icon` (36px). Visible focus rings (`focus-visible:ring-2`). |
| **Badge / StatusPill** | `src/shared/ui/badge.tsx` | Variants: `active` / `paid` (positive emerald), `overdue` / `cancelled` (crimson), `warning` / `paused` (amber), `neutral` / `draft` / `quotation` (slate). Accessible color contrast AA/AAA. |
| **Card** | `src/shared/ui/card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`. Flat surface, 1px border, 0px shadow. |
| **Input / Search** | `src/shared/ui/input.tsx` | 36px height, 1px border, clear focus ring, optional search icon slot. |
| **TanStack Table Frame** | `src/shared/ui/table.tsx` | Sticky `<thead>`, 44px rows, right-aligned monetary values, pagination footer with total item count and keyset navigation controls. |
| **Skeleton Loader** | `src/shared/ui/skeleton.tsx` | Geometry-accurate pulsing placeholders for cards, tables, and KPI metrics. No generic blank spinners. |
| **EmptyState** | `src/shared/ui/empty-state.tsx` | Consistent illustration placeholder, clear headline, explanatory body, and primary call-to-action button. |

---

## 7. Anti-Slop "We Will NOT Do" List

As required by `docs/PLAN.md` §11 and `AGENTS.md` §5, this is our binding anti-generic house ruleset:

1. **NO generic purple/neon gradient hero banners.** Surfaces are crisp white or soft slate.
2. **NO icons-in-tinted-circles on KPI cards.** KPIs are pure typographic hierarchy with context captions.
3. **NO decorative sparklines on summary tiles** that hide exact axis values or mislead trends.
4. **NO floating shadows on static cards.** Elevation is communicated through 1px border lines and tone steps.
5. **NO rainbow charts or uncoordinated palettes.** Charts use `--chart-1` (#1d5fbf) for the primary series and neutral grays for comparison series.
6. **NO zebra-striped tables.** Tables use thin 1px horizontal rule dividers and crisp column alignments.
7. **NO dead buttons or placeholders.** Every button either triggers an action or is removed.
8. **NO client-side data math for KPIs.** All metrics (MRR, overdue, revenue) are computed via single SQL aggregates with `FILTER`.
9. **NO inconsistent currency/date formats.** Every single monetary figure is formatted through `formatINR()` (`Intl.NumberFormat('en-IN', { currency: 'INR' })`). Dates through `formatDate()`.
10. **NO spinner-on-blank loading states.** Every loading view uses structural skeleton blocks mirroring the actual loaded components.
11. **NO orphaned routes.** Every route belongs to either `AppShell` or `PortalShell` with full breadcrumb navigation.

---

## 8. UI Excellence Program — Gate Checklists

### Gate 0 Checklist (Phase 0 — Pavithra) ✅
- [x] Run `design-taste-frontend` skill and study app screen rules.
- [x] Commit `docs/DESIGN.md` with complete token map, type scale, component recipes, and anti-slop rules.
- [x] Configure Tailwind theme & CSS variables in `src/app/globals.css`.
- [x] Implement `AppShell` (internal staff/admin) and `PortalShell` (external customer).
- [x] Implement core UI primitives (`button`, `badge`, `card`, `input`, `table`, `skeleton`, `empty-state`).

### Gate 1 Checklist (Build Phase — Screen Owners)
*Every teammate running their feature slice must verify against this checklist before PR:*
- [ ] One clear primary action; hierarchy reads immediately top-to-bottom.
- [ ] Structural skeleton loading states implemented (no blank spinners).
- [ ] Designed empty states with action triggers for zero-data scenarios.
- [ ] Proper error states with actionable retry buttons.
- [ ] All monetary values formatted via `formatINR()`; all dates formatted via `formatDate()`.
- [ ] WCAG AA color contrast on all text and badges.
- [ ] Keyboard accessible with visible focus rings (`focus-visible:ring-2`).
- [ ] Fully responsive from 360px mobile to 1920px desktop.
- [ ] Zero dead buttons or broken click handlers.

### Gate 2 Checklist (End of Phase 2 — Pavithra)
- [ ] Run `impeccable` audit over all core product flows.
- [ ] Log all UX, alignment, typography, and contrast findings to `.aimem/tasks.md` under "UI polish".

### Gate 3 Checklist (Phase 4 Post-Freeze — Team Audit)
- [ ] Final `impeccable` sweep across all screens.
- [ ] Dedicated invoice print stylesheet test (looks flawless printed to PDF or paper).
- [ ] Zero console errors, zero FOUC, zero lorem ipsum.
- [ ] Demo path rehearsal across the 9 acts.


---

## Appendix A — Landing page & auth folios (2026-10-31, replacement world)

The public landing page (`src/app/page.tsx`) and the four auth screens are a
**Persuade-mode sibling world** of the Operate-mode app, under the same
Achromatic Ledger thesis. Direction: **"The ledger that bills itself"** — the
page is an open working ledger of a subscription business: invoices, statuses
and totals rendered as the ledger's own entries, never as screenshots inside
cards. See `.impeccable/surfaces/src-app-page-tsx.md` for the full direction
contract (thesis, own-world, story, first viewport, form `seed:ec780f680c0db427`).

System rules added:
- **Ledger spread hero:** 44/62 split — offer + actions left, a live invoice
  artifact (LedgerInvoice) right; status strip on top, constraint footnote below.
- **Rule-line structure:** sections separated by 1px hairlines and tone steps;
  no decorative cards anywhere (feature scenes use a 1px-joined grid, not cards).
- **Proof band:** dark ink `#0f172a` section with tabular-nums figures — the
  only dark surface on the page.
- **Auth folio (`shared/ui/auth-layout.tsx`):** 44/56 split — quiet brand panel
  (ledger motif + three product facts) left, bordered form sheet right; shared
  field/label/button classes (`authFieldClass` etc.) keep all four auth pages
  identical in grammar.
- **Type discipline:** headlines `[text-wrap:balance]`, body `[text-wrap:pretty]`,
  tabular-nums on every figure, mono strictly for code/constraints, no
  kicker/eyebrow labels, no gradient text, no emoji bullets.
