# Orbit 🛰️ — Subscription Management System

[![CI](https://github.com/gabsgj/Orbit/actions/workflows/ci.yml/badge.svg)](https://github.com/gabsgj/Orbit/actions/workflows/ci.yml)

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
| `npm test` | vitest (service-level unit tests). **Note:** DB-backed suites (billing, numbering) need the `orbit_test` database — see [Test database](#test-database-for-db-backed-vitest-suites) below. |
| `npm run typecheck` / `lint` | tsc / eslint (module-boundary rule enforced) |
| `npm run db:migrate` / `db:seed` / `db:studio` | Prisma migrate / seed / Studio |
| `npm run db:seed:volume` | 10k-subscription load generator (perf proof dataset). See [Load / perf proof](#load--perf-proof). |

## Test database (for DB-backed vitest suites)

Service-level suites (billing engine, numbering) run against a **dedicated
`orbit_test` database**, never the dev database. One-time setup:

```bash
# create the test database (owner orbit_app)
psql -h localhost -U postgres -c "CREATE DATABASE orbit_test OWNER orbit_app"

# apply the schema (no prompts, uses migrations only)
DATABASE_URL="postgresql://orbit_app:orbit@localhost:5432/orbit_test" npx prisma migrate deploy
```

Suites read `TEST_DATABASE_URL`; when unset they default to
`postgresql://orbit_app:orbit@localhost:5432/orbit_test`. Then `npm test` runs
everything serially (`fileParallelism: false` in `vitest.config.ts`, since the
suites share one test DB).

## Load / perf proof

Prove the "< 2 s with thousands of subscriptions" claim (NFR-PERF-01):

```bash
# 1. Load the volume dataset on top of the demo seed (default 10 000 subscriptions;
#    override with VOLUME_SUBSCRIPTIONS, chunk size with VOLUME_BATCH)
VOLUME_SUBSCRIPTIONS=10000 npm run db:seed:volume

# 2. Run every EXPLAIN ANALYZE script and capture timestamped results
./scripts/perf/run.sh
```

Query plans, timings and the dataset write-up land in
[`docs/PERF.md`](docs/PERF.md); raw output is timestamped under
`scripts/perf/results/`.

## Demo

The full 9-act run-of-show, fallbacks and pre-demo checklist live in
[`docs/DEMO.md`](docs/DEMO.md). Before judges arrive, run the flight check:

```bash
./scripts/demo-check.sh    # ✅/❌ per check; exits non-zero if anything is off
```

## Architecture (HIGHLY MODULAR — see `docs/PLAN.md` §1)

```
src/modules/<domain>/   11 feature modules, fixed anatomy:
                        index.ts (barrel — the ONLY legal import path) ·
                        router.ts (thin tRPC) · service.ts (pure logic) ·
                        schemas.ts (zod, shared) · queries.ts (Prisma) ·
                        components/ · service.test.ts
src/shared/             kernel: trpc init+requireRole · prisma client · lib · ui
src/shared/ui/          UI primitives (Button, Card, Badge, Table, Dialog,
                        EmptyState, statusTone…) — import from "@/shared/ui"
src/app/                thin routes that compose modules
src/app/(app)/          authenticated staff/admin shell (route group guarded
                        server-side by its layout: nav + session guard)
prisma/                 schema (mirrors docs/ER.md) · migrations · seed
```

Cross-module imports go through module barrels only — enforced by eslint
(`no-restricted-imports`). Services are framework-free and unit-tested.

## Team

Gabriel James (Platform & Billing) · Abhiram H (Identity & Catalog) ·
Catherine Maria Benny (Money-Flow) · Pavithra S Rajesh (Experience & Insights)
