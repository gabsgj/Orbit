# Orbit — Hosted-Mirror Deploy Guide (Bonus: Vercel + Neon)

> **⚠️ PRINCIPLE — READ FIRST**
>
> **Local-first: the judged demo runs 100% offline on local PostgreSQL. The hosted mirror is a BONUS link. One codebase, `DATABASE_URL` switches targets.**
>
> Nothing below is required for judging. The local demo (`docker-compose up db` + `npm run dev` + local `node-cron` worker) is the real deliverable and works with zero internet. This guide only stands up a public mirror for anyone who wants a clickable URL after the demo.

---

## 1 · Neon (hosted Postgres)

Create a project at [neon.tech](https://neon.tech) → region nearest you → copy the **pooled** connection string (`-pooler` in the host, `sslmode=require`). Pooled is mandatory — serverless functions open many short connections.

## 2 · Migrate + seed the hosted DB

```bash
DATABASE_URL="postgresql://<user>:<pass>@<host>-pooler.<region>.neon.tech/orbit?sslmode=require" npx prisma migrate deploy && \
DATABASE_URL="postgresql://<user>:<pass>@<host>-pooler.<region>.neon.tech/orbit?sslmode=require" npm run db:seed
```

Same schema, same seed data as the local demo.

## 3 · Vercel import

Vercel Dashboard → **Add New → Project → Import `gabsgj/Orbit`** → framework auto-detected (Next.js). Add these env vars:

| Variable | Value | Must differ from local? |
| --- | --- | --- |
| `DATABASE_URL` | Neon **pooled** string from step 1 | ✅ yes — local points at `localhost:5432` |
| `NEXTAUTH_SECRET` | Fresh `openssl rand -base64 32` | ✅ yes — never reuse the local one |
| `NEXTAUTH_URL` | `https://<project>.vercel.app` | ✅ yes — local is `http://localhost:3000` |
| `CRON_SECRET` | Fresh random string | ✅ yes — guards the hosted cron only |

## 4 · Billing cron — already configured, nothing to add

```bash
cat vercel.json
# { "crons": [ { "path": "/api/cron/billing", "schedule": "5 0 * * *" } ] }
```

`vercel.json` is committed, so the cron registers on import. It hits `GET /api/cron/billing` at 00:05 UTC. The route (`src/app/api/cron/billing/route.ts`) checks `authorization === \`Bearer ${CRON_SECRET}\``, and **Vercel Cron sends exactly that header** when the `CRON_SECRET` env var is set — no extra wiring. The route calls the *same* `BillingService` the local worker uses, with `triggerType: "CRON_VERCEL"` so runs are distinguishable in `billing_runs`.

## 5 · Post-deploy smoke checklist

- [ ] `https://<project>.vercel.app` loads; login works with a seeded account.
- [ ] `curl -H "Authorization: Bearer $CRON_SECRET" https://<project>.vercel.app/api/cron/billing` → `200` JSON (without the header → `401`).
- [ ] Subscriptions list renders — proves Neon read path.
- [ ] Create one subscription in the hosted UI; confirm it appears in Neon (`npx prisma studio` pointed at the Neon URL).
- [ ] Vercel Dashboard → **Cron** shows the `5 0 * * *` entry; after first fire, a `CRON_VERCEL` row exists in `billing_runs`.
- [ ] Local demo still boots offline (`npm run dev` against local Postgres) — **the mirror must never break this.**

## Status (2026-10-31)

| Step | State |
|---|---|
| 1 · Neon project + pooled URL (us-east-1, PG 18.6) | ✅ Provided |
| 2 · `prisma migrate deploy` → Neon | ✅ Applied — both migrations, **17 CHECK constraints** live |
| 2 · `npm run db:seed` → Neon | ✅ Demo dataset live (7 subs, 2 invoices, 4 users, sequences) |
| 3 · Vercel import + env vars | ✅ **LIVE: https://orbit-amber-two.vercel.app** (Gabriel, 2026-10-31) |
| 4 · Cron registration | ✅ vercel.json — `5 0 * * *` (fires daily 00:05 UTC) |
| 5 · Smoke checklist | ✅ Passed (see below) |

**Smoke results (2026-10-31):** landing `200` (0.84s) · `/billing` → `307` to signin (guard works) · `/api/cron/billing` without secret → `401` (guard works) · `/api/auth/csrf` + `/api/auth/providers` healthy (credentials provider live). Demo logins: `admin@orbit.local` / `Admin@Orbit1`.

> **🔐 Security:** the Neon password was shared in chat — **rotate it now**: Neon
> console → project → Roles → `neondb_owner` → Reset password → update it in
> Vercel env vars. It is never committed to git.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `P1001` / timeouts under load | Prisma on serverless opening a connection per invocation (connection storm) | Use the Neon **pooled** URL (`-pooler` host). Never the direct endpoint on Vercel. |
| First request takes seconds | Serverless cold start | Expected on the bonus mirror; judged local demo is unaffected. |
| Login redirects loop / `Invalid URL` | `NEXTAUTH_URL` mismatch | Must be the exact deployed origin (`https://<project>.vercel.app`), no trailing path. |
| Cron endpoint returns `401` | `CRON_SECRET` mismatch or missing | Set `CRON_SECRET` in Vercel env; Vercel Cron then auto-sends `Authorization: Bearer <value>`. Redeploy after adding. |
| Migrate fails with SSL error | Missing `sslmode` | Append `?sslmode=require` to the Neon URL. |
