# Member Brief — Abhiram H · Identity & Catalog Lead

Paste the block below as your first message to your agent. Keep this file open as reference.

```text
I am Abhiram H, Identity & Catalog Lead on Team Orbit (Odoo × Make-a-Ton 9.0, Kochi).
We are building Orbit, a subscription management system for the fictional company
Brightloop Software. Stack (locked): Next.js 15 + TypeScript + tRPC v11 + Prisma 6 +
PostgreSQL 18 (local, offline-first) + Tailwind/shadcn + next-auth + bcryptjs + vitest.

Before writing ANY code, read these files in this order:
1. AGENTS.md (binding ruleset)
2. .aimem/context.md
3. docs/SRS.md (M1, M2, M3, M11, M12 are mine)
4. docs/ER.md (users, customers, password_reset_tokens, products, attributes,
   attribute_values, product_variants, plans, taxes, quotation_templates(+lines), email_outbox)
5. docs/PLAN.md (§2 my slice, §3 build order, §11 UI gates)

I OWN: auth (signup/login/logout, password policy, next-auth credentials), forgot/reset
flow (sha256-hashed single-use tokens, 1h expiry, staged in email_outbox offline),
RBAC (requireRole tRPC middleware + route guards + nav filtering), staff management
(admin-only create/deactivate), products + attributes/variants CRUD (variant price_extra,
e.g. Odoo brand +560), plans CRUD (period daily/weekly/monthly/yearly, min quantity,
availability dates, flags auto_close/closable_early/pausable/renewable), taxes CRUD,
quotation templates CRUD (+lines, validity_days), admin mail outbox viewer.

My FRs: FR-AUTH-01…07, FR-CAT-01…05, FR-QT-01, FR-ADM-01, FR-MAIL-01…02.

KEY REQUIREMENTS (exact, testable):
- Password policy: >8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 special char — one zod
  schema in src/server/validation/, reused by the tRPC procedure AND the client form.
- Email unique case-insensitive (citext) — 409 with a clear message on conflict.
- RBAC enforced SERVER-SIDE in middleware; customer queries always scoped by session
  user id (never trust client-provided ids).
- Reset tokens: store only sha256 hash, single-use, expiring; offline mode stages the
  email in email_outbox and the admin outbox viewer must show the reset link (demo!).
- Only ADMIN can create staff — there is no public staff signup.

RULES I follow (from AGENTS.md):
- HIGHLY MODULAR (PLAN §1 contract): my code lives in modules/auth + modules/catalog +
  modules/templates with the fixed anatomy (index/router/service/schemas/queries/
  components/tests); others import ONLY my index.ts barrels; services are pure
  (no next/trpc imports). requireRole ships via shared/trpc but its rules are mine.
- Every list page: filters + keyset pagination + designed empty/loading/error states.
- UI Gate 1 (PLAN §11): I run the design-taste-frontend skill for each of my screens
  before building; Pavithra reviews. Tokens only, no one-off pixel values.
- I update .aimem/tasks.md and .aimem/progress.md in the same change as my work.

GIT (my standing authorization to you): work on branch feat/auth-abhiram (or
feat/catalog-abhiram per task). I explicitly authorize you to `git commit` and `git push`
on MY branch whenever I ask — and I will ask at least every 30 minutes, per team cadence.
Small atomic commits, conventional messages. NEVER commit to main, never force-push,
never touch secrets. Ask me before anything outside my branch.

Sequence: Phase 1 = auth + RBAC first (others depend on requireRole) → staff mgmt →
catalog (products/variants → plans → taxes) → templates. Phase 2 = outbox viewer.
Do NOT touch prisma/schema.prisma without telling Gabriel — schema changes go through
him as migrations. Walk me through every non-obvious decision — I must be able to
explain every line to the judges.
```

## My task checklist (phased — details in `docs/PLAN.md` §3)

### Phase 1 — Foundations (auth first — the team depends on `requireRole`)
- [ ] next-auth credentials setup + session typing (role in session)
- [ ] Signup (customer) with validation + friendly errors
- [ ] Login/logout + route guards + nav filtering per role
- [ ] `requireRole('ADMIN'|'STAFF'|'CUSTOMER')` tRPC middleware + scoped-customer helper
- [ ] Staff management page (admin-only create/deactivate)
- [ ] Products + attributes/values + variants CRUD (price_extra)
- [ ] Plans CRUD (all flags + date checks)
- [ ] Taxes CRUD
- [ ] Quotation templates CRUD + lines + validity_days

### Phase 2 — Money core support
- [ ] Forgot/reset flow complete (token service + email_outbox staging)
- [ ] Admin mail outbox viewer (list + detail, shows reset/invoice links) — demo-critical

### Phase 3–4 — Differentiators, hardening
- [ ] Unit tests: password policy, token single-use/expiry, RBAC matrix (who can call what)
- [ ] UI Gate 1 evidence per screen; fix Gate 2/3 findings for my screens
- [ ] Demo acts 1 (signup + reset via outbox) and 2 (catalog, +560 variant) rehearsed

## Coordination points
- **Gabriel** — I need the Phase 0 schema frozen before my CRUD; my seed needs (admin user, demo product/plan) go in his seed script.
- **Catherine** — she builds "subscription from template" against my template API; agree the `templates.getWithLines` shape early.
- **Pavithra** — auth pages and admin CRUD screens follow her design tokens + AppShell; Gate 1 review with her.
- **Everyone** — `requireRole` is the team's RBAC primitive; keep its API stable after Phase 1.
