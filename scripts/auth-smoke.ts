/**
 * scripts/auth-smoke.ts — Auth E2E smoke test.
 *
 * Walks the full identity flow against the live dev server and prints
 * one ✅/❌ line per step. Exits non-zero on any failure.
 *
 * Usage:
 *   npx tsx scripts/auth-smoke.ts                  # default BASE_URL=http://localhost:3000
 *   BASE_URL=http://localhost:3000 npx tsx scripts/auth-smoke.ts
 *
 * Requires:
 *   - Dev server running (npm run dev)
 *   - Database seeded with demo users (npm run db:seed)
 *   - DATABASE_URL env var (or .env) for the forgot-password outbox check
 */
import { PrismaClient } from "@prisma/client";

// ── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const STAFF_EMAIL = "staff@orbit.local";
const STAFF_PASSWORD = "Staff@Orbit1";
const WRONG_PASSWORD = "WrongPass1!";
const THROWAWAY_EMAIL = `smoke-${Date.now()}@throwaway.local`;

let failures = 0;

function pass(label: string) {
  console.log(`✅ ${label}`);
}
function fail(label: string, detail?: string) {
  console.log(`❌ ${label}${detail ? ` — ${detail}` : ""}`);
  failures++;
}

// ── Cookie jar (minimal, per-request) ───────────────────────────────────────

class CookieJar {
  private jar = new Map<string, string>();

  /** Extract Set-Cookie headers from a Response and store them. */
  absorb(res: Response) {
    const raw = res.headers.getSetCookie?.() ?? [];
    for (const header of raw) {
      const [pair] = header.split(";");
      const eq = pair.indexOf("=");
      if (eq === -1) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (value === "" || value === '""') {
        this.jar.delete(name);
      } else {
        this.jar.set(name, value);
      }
    }
  }

  /** Return the Cookie header value for outgoing requests. */
  header(): string {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  get hasSession(): boolean {
    // Only an actual session token counts — csrf/callback cookies contain
    // "next-auth" in their names but are not sessions.
    return [...this.jar.keys()].some((k) => k.includes("session-token"));
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Fetch with cookie jar and no auto-redirect (we want to inspect status codes). */
async function req(
  url: string,
  opts: { method?: string; body?: string; jar?: CookieJar; headers?: Record<string, string> } = {},
): Promise<Response> {
  const headers: Record<string, string> = { ...opts.headers };
  if (opts.jar) headers["cookie"] = opts.jar.header();
  if (opts.body && !headers["content-type"]) {
    headers["content-type"] = "application/x-www-form-urlencoded";
  }
  const res = await fetch(`${BASE_URL}${url}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body,
    redirect: "manual",
  });
  opts.jar?.absorb(res);
  return res;
}

/** Extract the CSRF token from the next-auth CSRF endpoint. */
async function getCsrfToken(jar: CookieJar): Promise<string> {
  const res = await req("/api/auth/csrf", { jar });
  const json = (await res.json()) as { csrfToken: string };
  return json.csrfToken;
}

/** Build a URL-encoded credentials body for next-auth's callback endpoint. */
function credentialsBody(csrfToken: string, email: string, password: string): string {
  return new URLSearchParams({
    csrfToken,
    email,
    password,
    json: "true",
  }).toString();
}

// ── tRPC caller ─────────────────────────────────────────────────────────────

/** Call a tRPC query (GET) or mutation (POST) over HTTP (non-batch). */
async function trpcCall(
  path: string,
  opts: { input?: unknown; jar?: CookieJar; method?: "GET" | "POST" } = {},
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.jar) headers["cookie"] = opts.jar.header();

  const method = opts.method ?? "GET";
  let url = `${BASE_URL}/api/trpc/${path}`;
  let body: string | undefined;

  if (method === "POST") {
    body = JSON.stringify({ json: opts.input });
  } else {
    url += `?input=${encodeURIComponent(JSON.stringify({ json: opts.input ?? null }))}`;
  }

  const res = await fetch(url, { method, headers, body, redirect: "manual" });
  opts.jar?.absorb(res);
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json };
}

// ── Steps ───────────────────────────────────────────────────────────────────

async function step01_signupPageLoads() {
  const label = "GET /signup → 200";
  try {
    const res = await req("/signup");
    if (res.status === 200) {
      pass(label);
    } else {
      fail(label, `got ${res.status}`);
    }
  } catch (e) {
    fail(label, String(e));
  }
}

async function step02_wrongPasswordRejected() {
  const label = "POST /api/auth/callback/credentials (wrong password) → error";
  try {
    const jar = new CookieJar();
    const csrf = await getCsrfToken(jar);
    const res = await req("/api/auth/callback/credentials", {
      method: "POST",
      body: credentialsBody(csrf, STAFF_EMAIL, WRONG_PASSWORD),
      jar,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    // next-auth v4 with json:true returns 200 with {url} containing "error",
    // or 401. Either way, the session cookie must NOT be set.
    const body = await res.text();
    if (jar.hasSession) {
      fail(label, "session cookie was set despite wrong password");
    } else if (res.status === 401 || body.includes("error") || res.status === 302) {
      pass(label);
    } else {
      // Accept any non-session response as "rejected"
      pass(label);
    }
  } catch (e) {
    fail(label, String(e));
  }
}

async function step03_staffLoginAndSession(): Promise<CookieJar | null> {
  const label = `POST /api/auth/callback/credentials (${STAFF_EMAIL}) → session`;
  try {
    const jar = new CookieJar();
    const csrf = await getCsrfToken(jar);
    const res = await req("/api/auth/callback/credentials", {
      method: "POST",
      body: credentialsBody(csrf, STAFF_EMAIL, STAFF_PASSWORD),
      jar,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });

    if (!jar.hasSession) {
      fail(label, `no session cookie after login (status ${res.status})`);
      return null;
    }

    // Verify session via /api/auth/session
    const sessionRes = await req("/api/auth/session", { jar });
    const session = (await sessionRes.json()) as {
      user?: { email?: string; role?: string };
    };
    if (session?.user?.role === "STAFF" && session?.user?.email === STAFF_EMAIL) {
      pass(label);
      return jar;
    } else {
      fail(label, `session role=${session?.user?.role} email=${session?.user?.email}`);
      return null;
    }
  } catch (e) {
    fail(label, String(e));
    return null;
  }
}

async function step04_billingPageAccessible(jar: CookieJar | null) {
  const label = "GET /billing (staff cookie) → 200";
  if (!jar) {
    fail(label, "skipped — no staff session");
    return;
  }
  try {
    const res = await req("/billing", { jar });
    if (res.status === 200) {
      pass(label);
    } else {
      fail(label, `got ${res.status}`);
    }
  } catch (e) {
    fail(label, String(e));
  }
}

async function step05_adminOutboxWithStaff(jar: CookieJar | null) {
  const label = "GET /api/trpc/admin.outbox (staff cookie) → 200";
  if (!jar) {
    fail(label, "skipped — no staff session");
    return;
  }
  try {
    const { status } = await trpcCall("admin.outbox", {
      input: { take: 1 },
      jar,
    });
    if (status === 200) {
      pass(label);
    } else {
      fail(label, `got ${status}`);
    }
  } catch (e) {
    fail(label, String(e));
  }
}

async function step06_adminOutboxNoCookie() {
  const label = "GET /api/trpc/admin.outbox (no cookie) → 401/UNAUTHORIZED";
  try {
    const { status, body } = await trpcCall("admin.outbox", {
      input: { take: 1 },
    });
    const code = (body as Record<string, unknown>)?.error
      ? ((body as { error: { json?: { code?: number } } }).error?.json?.code ??
        (body as { error: { data?: { code?: string } } }).error?.data?.code)
      : null;
    if (status === 401 || code === "UNAUTHORIZED" || code === -32001 || status === 403) {
      pass(label);
    } else {
      fail(label, `status=${status} code=${JSON.stringify(code)}`);
    }
  } catch (e) {
    fail(label, String(e));
  }
}

async function step07_forgotPasswordFlow() {
  const label = `auth.forgotPassword(${THROWAWAY_EMAIL}) → 200 + RESET row in email_outbox`;
  const db = new PrismaClient();
  try {
    // First create a throwaway user so forgotPassword finds a matching account.
    // We use tRPC signup for this — it's a public mutation.
    const signupRes = await trpcCall("auth.signup", {
      method: "POST",
      input: {
        email: THROWAWAY_EMAIL,
        password: "SmokeTest1!",
        companyName: "Smoke Test Co",
      },
    });
    if (signupRes.status !== 200) {
      fail(label, `signup for throwaway user failed: ${signupRes.status}`);
      return;
    }

    // Trigger forgot-password.
    const fpRes = await trpcCall("auth.forgotPassword", {
      method: "POST",
      input: { email: THROWAWAY_EMAIL },
    });
    if (fpRes.status !== 200) {
      fail(label, `forgotPassword returned ${fpRes.status}`);
      return;
    }

    // Check the DB for a RESET row addressed to that email.
    const row = await db.emailOutbox.findFirst({
      where: { toEmail: THROWAWAY_EMAIL, kind: "RESET" },
      orderBy: { createdAt: "desc" },
    });
    if (row) {
      pass(label);
    } else {
      fail(label, "no RESET row found in email_outbox");
    }

    // Clean up: delete the outbox row(s) and the throwaway user.
    await db.emailOutbox.deleteMany({ where: { toEmail: THROWAWAY_EMAIL } });
    const user = await db.user.findUnique({ where: { email: THROWAWAY_EMAIL } });
    if (user) {
      // FK order: tokens, audit_log (RESTRICT), customer, then user.
      await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await db.auditLog.deleteMany({ where: { userId: user.id } });
      await db.customer.deleteMany({ where: { userId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
  } catch (e) {
    fail(label, String(e));
  } finally {
    await db.$disconnect();
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nOrbit Auth Smoke Test — ${BASE_URL}\n`);

  await step01_signupPageLoads();
  await step02_wrongPasswordRejected();
  const staffJar = await step03_staffLoginAndSession();
  await step04_billingPageAccessible(staffJar);
  await step05_adminOutboxWithStaff(staffJar);
  await step06_adminOutboxNoCookie();
  await step07_forgotPasswordFlow();

  console.log("");
  if (failures > 0) {
    console.error(`${failures} check(s) FAILED.`);
    process.exit(1);
  } else {
    console.log("All auth checks passed. 🔐");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
