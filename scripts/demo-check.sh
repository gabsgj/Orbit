#!/usr/bin/env bash
# Orbit — pre-demo flight check. Quick checks ONLY (no build, no migrate).
# Prints ✅/❌ per check; exits non-zero if any check fails.
set -u
cd "$(dirname "$0")/.."

FAIL=0
ok()   { printf '✅ %s\n' "$1"; }
bad()  { printf '❌ %s\n' "$1"; FAIL=1; }

# Load DATABASE_URL: explicit env var wins, else .env, else documented local default.
DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ] && [ -f .env ]; then
  ENV_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d'"' -f2)"
  [ -n "$ENV_URL" ] && DB_URL="$ENV_URL"
fi
[ -z "$DB_URL" ] && DB_URL="postgresql://orbit_app:orbit@localhost:5432/orbit"
# psql rejects Prisma-only URI params (e.g. ?schema=public) — strip the query string.
DB_URL="${DB_URL%%\?*}"

# 0. psql available
if ! command -v psql >/dev/null 2>&1; then
  bad "psql not found — install PostgreSQL client tools first"
  printf '\n%d check(s) FAILED — fix ❌ items before the demo.\n' "$FAIL"
  exit 1
fi

# 1. .env exists
if [ -f .env ]; then ok ".env exists"; else bad ".env missing — cp .env.example .env"; fi

# 2. node_modules exists
if [ -d node_modules ]; then ok "node_modules installed"; else bad "node_modules missing — run npm install"; fi

# 3. Postgres accepting connections
if psql "$DB_URL" -Atc "SELECT 1" >/dev/null 2>&1; then
  ok "postgres accepting connections"
else
  bad "postgres not reachable — is local PostgreSQL running? (DATABASE_URL in .env)"
  printf '\n%d check(s) FAILED — fix ❌ items before the demo.\n' "$FAIL"
  exit 1   # remaining checks are DB-dependent; no point continuing
fi

# 4. orbit database reachable with schema (implied by a successful count query)
count() { psql "$DB_URL" -Atc "SELECT count(*) FROM $1" 2>/dev/null; }

USERS="$(count users)"
if [ -n "$USERS" ]; then
  ok "orbit database exists (schema present)"
else
  bad "orbit database/schema missing — run npx prisma migrate dev"
fi

# 5-7. Seed sanity: users≥3, plans≥3, subscriptions≥7
check_min() { # table min
  local n; n="$(count "$1")"
  if [ -n "$n" ] && [ "$n" -ge "$2" ] 2>/dev/null; then
    ok "$1 seeded ($n ≥ $2)"
  elif [ -z "$n" ]; then
    bad "$1 table missing — run npx prisma migrate dev && npm run db:seed"
  else
    bad "$1 under-seeded ($n < $2) — run npm run db:seed (and volume seed if expected)"
  fi
}
check_min users 3
check_min plans 3
check_min subscriptions 7

# 8. Port 3000 free
if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  bad "port 3000 already in use — kill the process or free the port before npm run dev"
else
  ok "port 3000 free"
fi

if [ "$FAIL" -ne 0 ]; then
  printf '\nPre-demo check FAILED — fix ❌ items above.\n'
  exit 1
fi
printf '\nAll checks passed — orbit is demo-ready. 🛰️\n'
exit 0
