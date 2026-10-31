# Auth — Orbit Identity & Access

> Module: `src/modules/auth/` · next-auth config: `src/shared/auth/` · RBAC: `src/shared/trpc/`

## How it works (10 bullets)

1. **Signup** (`/signup`) — customers self-register with email + password + company name; the tRPC `auth.signup` mutation creates a `users` row (role=CUSTOMER) and a linked `customers` row in one transaction. Duplicate email → 409 CONFLICT.
2. **Login** (`/login`) — next-auth credentials provider: email is lowercased, bcrypt-compared against `users.password_hash`; on success a JWT session cookie is issued with `{ id, email, role }`.
3. **Password policy** — minimum 9 characters, at least one uppercase, one lowercase, one special character (`[^A-Za-z0-9]`). Enforced by a shared zod schema (`passwordSchema`) used on both client and server.
4. **Forgot password** (`/forgot-password`) — the `auth.forgotPassword` mutation generates a random 32-byte token, stores only its sha256 hash in `password_reset_tokens` (single-use, 1 h expiry), and stages a RESET email in `email_outbox`.
5. **Reset password** (`/reset-password?token=…`) — the `auth.resetPassword` mutation re-hashes the supplied token, validates it (unused + unexpired), consumes it (`used_at` set), and updates the user's `password_hash` — all in one transaction.
6. **RBAC** — three roles: ADMIN, STAFF, CUSTOMER. Server-side enforcement via tRPC `requireRole()` middleware (throws UNAUTHORIZED / FORBIDDEN). Route guards in `(app)/layout.tsx` redirect unauthenticated users to login and CUSTOMER users to `/portal`.
7. **Staff management** — only ADMIN can create or deactivate staff (`auth.createStaff`, `auth.deactivateStaff`). Deactivation rewrites the email to `deactivated::{id}::{timestamp}` (FK-safe, login blocked via audit check).
8. **Customer scoping** — portal queries filter by `session.user.id` at the query layer; customer-provided IDs are never trusted.
9. **Email outbox** — all outgoing mail (reset links, invoice-sent, reminders) is staged in the `email_outbox` table. Offline demo: viewable at `/admin/outbox`. If `SMTP_URL` is set, a dispatcher sends for real (`scripts/send-mail.ts`).
10. **Session shape** — JWT strategy; `session.user = { id, email, role }`. No `isActive` field — deactivated staff are blocked at the authorize step.

## Demo logins

| Role  | Email              | Password       |
|-------|--------------------|----------------|
| ADMIN | `admin@orbit.local` | `Admin@Orbit1` |
| STAFF | `staff@orbit.local` | `Staff@Orbit1` |

## Smoke test

```bash
# Start the dev server first (npm run dev), then:
npx tsx scripts/auth-smoke.ts

# Or against a different URL:
BASE_URL=http://localhost:3000 npx tsx scripts/auth-smoke.ts
```

The script walks signup → wrong-password rejection → staff login → RBAC-protected
page → RBAC-protected tRPC → forgot-password → DB outbox verification, printing
✅/❌ per step and exiting non-zero on any failure. Requires `DATABASE_URL` in
the environment (reads `.env` automatically via Prisma client).
