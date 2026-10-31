# Orbit 🛰️ — Subscription Management System

> Put your revenue in orbit. One platform for plans, subscriptions, recurring
> billing, invoices, payments and revenue reporting.
> **Odoo × Make-a-Ton 9.0, Kochi Hackathon.**

| | |
|---|---|
| **Docs** | [`docs/SRS.md`](docs/SRS.md) requirements · [`docs/PLAN.md`](docs/PLAN.md) execution plan · [`docs/ER.md`](docs/ER.md) data model · [`docs/team/`](docs/team/) member briefs |
| **Stack** | Next.js 15 · TypeScript · tRPC v11 · Prisma 6 · PostgreSQL 18 (local) · Tailwind v4 · TanStack Query · Recharts · next-auth · vitest |
| **Demo principle** | Runs **fully offline** against local PostgreSQL. Hosted mirror (Vercel + Neon) is a bonus link only. |

---

## Quick start (fresh machine)

```bash
# 1. Prerequisites: Node 20+, PostgreSQL 18 running locally
# 2. Install deps
npm install

# 3. Configure environment
cp .env.example .env          # defaults work for local dev

# 4. Create the database (one-time)
psql -h localhost -U postgres -c "CREATE ROLE orbit_app LOGIN PASSWORD 'orbit' CREATEDB"
psql -h localhost -U postgres -c "CREATE DATABASE orbit OWNER orbit_app"

# 5. Migrate + seed
npx prisma migrate dev        # schema + business CHECK constraints
npm run db:seed               # demo data (users, catalog, one ACTIVE subscription)

# 6. Run
npm run dev                   # → http://localhost:3000
npm run worker                # (second terminal) billing scheduler (node-cron)
```

### Demo logins (dev seed only)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@orbit.local` | `Admin@Orbit1` |
| Staff | `staff@orbit.local` | `Staff@Orbit1` |
| Customer | `customer@acme.test` | `Cust@Orbit1` |

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run worker` | Local billing scheduler (node-cron). Rehearsal: `BILLING_CRON="0-59/2 * * * *" npm run worker` |
| `npm run build` / `start` | Production build / serve |
| `npm test` | vitest (service-level unit tests) |
| `npm run typecheck` / `lint` | tsc / eslint (module-boundary rule enforced) |
| `npm run db:migrate` / `db:seed` / `db:studio` | Prisma migrate / seed / Studio |

## Architecture (HIGHLY MODULAR — see `docs/PLAN.md` §1)

```
src/modules/<domain>/   11 feature modules, fixed anatomy:
                        index.ts (barrel — the ONLY legal import path) ·
                        router.ts (thin tRPC) · service.ts (pure logic) ·
                        schemas.ts (zod, shared) · queries.ts (Prisma) ·
                        components/ · service.test.ts
src/shared/             kernel: trpc init+requireRole · prisma client · lib · ui
src/app/                thin routes that compose modules
prisma/                 schema (mirrors docs/ER.md) · migrations · seed
```

Cross-module imports go through module barrels only — enforced by eslint
(`no-restricted-imports`). Services are framework-free and unit-tested.

## Team

Gabriel James (Platform & Billing) · Abhiram H (Identity & Catalog) ·
Catherine Maria Benny (Money-Flow) · Pavithra S Rajesh (Experience & Insights)
