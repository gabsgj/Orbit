/**
 * modules/auth — Service unit tests (vitest).
 * Runs against orbit_test DB (TEST_DATABASE_URL) per the project test infra.
 *
 * Covers:
 *  1. passwordSchema — all policy branches
 *  2. signup — success path, email conflict (409)
 *  3. forgotPassword — no-op for unknown email, token created for known
 *  4. resetPassword — success, expired, already used (single-use)
 *  5. deactivateStaff — success, self-deactivate guard, admin guard
 */
import { describe, it, expect, beforeEach } from "vitest";
import { passwordSchema } from "./schemas";
import { signup, forgotPassword, resetPassword, createStaff, deactivateStaff } from "./service";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

// ── Test DB client ─────────────────────────────────────────────────────────────
const testDb = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.TEST_DATABASE_URL ??
        "postgresql://orbit_app:orbit@localhost:5432/orbit_test",
    },
  },
});

// ── Helpers ────────────────────────────────────────────────────────────────────
function sha256(v: string) {
  return crypto.createHash("sha256").update(v).digest("hex");
}

function uniqueEmail(prefix = "test") {
  return `${prefix}+${Date.now()}+${Math.random().toString(36).slice(2)}@orbit.test`;
}

// Clean up test users after each test so they don't bleed between runs.
// We target only @orbit.test emails and deactivated variants.
async function cleanTestUsers() {
  await testDb.passwordResetToken.deleteMany({
    where: { user: { email: { contains: "@orbit.test" } } },
  });
  await testDb.customer.deleteMany({
    where: { user: { email: { contains: "@orbit.test" } } },
  });
  await testDb.emailOutbox.deleteMany({ where: { toEmail: { contains: "@orbit.test" } } });
  await testDb.user.deleteMany({
    where: {
      OR: [
        { email: { contains: "@orbit.test" } },
        { email: { contains: "deactivated::" } },
      ],
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────

describe("passwordSchema — FR-AUTH-02", () => {
  it("rejects passwords of 8 chars or fewer", () => {
    expect(passwordSchema.safeParse("Short1!").success).toBe(false);
    expect(passwordSchema.safeParse("Eight8!a").success).toBe(false); // exactly 8 chars -> must be >8
  });

  it("accepts passwords with >8 chars, uppercase, lowercase, special", () => {
    expect(passwordSchema.safeParse("ValidPass1!").success).toBe(true);
    expect(passwordSchema.safeParse("Correct#Horse7Battery").success).toBe(true);
  });

  it("rejects passwords with no uppercase", () => {
    expect(passwordSchema.safeParse("alllowercase1!").success).toBe(false);
  });

  it("rejects passwords with no lowercase", () => {
    expect(passwordSchema.safeParse("ALLUPPERCASE1!").success).toBe(false);
  });

  it("rejects passwords with no special character", () => {
    expect(passwordSchema.safeParse("NoSpecial1abc").success).toBe(false);
  });

  it("rejects passwords with no digit but accepts if special compensates", () => {
    // digit is NOT required by the policy — only upper+lower+special
    expect(passwordSchema.safeParse("ValidNoDigit!!").success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("signup — FR-AUTH-01", () => {
  beforeEach(cleanTestUsers);

  it("creates a user + customer row on first signup", async () => {
    const email = uniqueEmail("signup");
    const result = await signup(testDb, {
      email,
      password: "TestPass!99",
      companyName: "Acme Corp",
    });
    expect(result.ok).toBe(true);
    expect(typeof result.userId).toBe("string");

    const user = await testDb.user.findUnique({ where: { id: result.userId } });
    expect(user?.email).toBe(email);
    expect(user?.role).toBe("CUSTOMER");

    const customer = await testDb.customer.findFirst({ where: { userId: result.userId } });
    expect(customer?.companyName).toBe("Acme Corp");
  });

  it("throws EMAIL_CONFLICT on duplicate email (case-insensitive path via lower transform)", async () => {
    const email = uniqueEmail("conflict");
    await signup(testDb, { email, password: "TestPass!99", companyName: "A" });

    await expect(
      signup(testDb, { email, password: "AnotherPass#1", companyName: "B" }),
    ).rejects.toMatchObject({ code: "EMAIL_CONFLICT" });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("forgotPassword — FR-AUTH-04", () => {
  beforeEach(cleanTestUsers);

  it("returns {ok:true} for unknown emails (no user enumeration)", async () => {
    const result = await forgotPassword(testDb, {
      email: uniqueEmail("ghost"),
      baseUrl: "http://localhost:3000",
    });
    expect(result.ok).toBe(true);
  });

  it("creates a token row and stages an outbox email for a known user", async () => {
    const email = uniqueEmail("forgot");
    const { userId } = await signup(testDb, {
      email,
      password: "TestPass!99",
      companyName: "Co",
    });

    await forgotPassword(testDb, { email, baseUrl: "http://localhost:3000" });

    const token = await testDb.passwordResetToken.findFirst({ where: { userId } });
    expect(token).toBeTruthy();
    expect(token?.usedAt).toBeNull();
    expect(token?.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const outbox = await testDb.emailOutbox.findFirst({ where: { toEmail: email } });
    expect(outbox?.kind).toBe("RESET");
    expect(outbox?.bodyHtml).toContain("/reset-password?token=");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("resetPassword — FR-AUTH-04 (single-use, expiry)", () => {
  beforeEach(cleanTestUsers);

  it("resets password successfully with a valid token", async () => {
    const email = uniqueEmail("reset");
    await signup(testDb, { email, password: "OldPass#1", companyName: "Co" });
    await forgotPassword(testDb, { email, baseUrl: "http://localhost:3000" });

    // Extract the raw token from the outbox body
    const outbox = await testDb.emailOutbox.findFirst({ where: { toEmail: email } });
    const match = outbox!.bodyHtml.match(/token=([a-f0-9]+)/);
    expect(match).toBeTruthy();
    const rawToken = match![1]!;

    const result = await resetPassword(testDb, {
      token: rawToken,
      newPassword: "NewPass#2",
    });
    expect(result.ok).toBe(true);

    // Confirm token is marked used
    const tokenHash = sha256(rawToken);
    const tokenRow = await testDb.passwordResetToken.findFirst({ where: { tokenHash } });
    expect(tokenRow?.usedAt).not.toBeNull();
  });

  it("throws INVALID_TOKEN on a used token (single-use guarantee)", async () => {
    const email = uniqueEmail("singleuse");
    await signup(testDb, { email, password: "OldPass#1", companyName: "Co" });
    await forgotPassword(testDb, { email, baseUrl: "http://localhost:3000" });

    const outbox = await testDb.emailOutbox.findFirst({ where: { toEmail: email } });
    const rawToken = outbox!.bodyHtml.match(/token=([a-f0-9]+)/)![1]!;

    // First use succeeds
    await resetPassword(testDb, { token: rawToken, newPassword: "NewPass#2" });

    // Second use must fail
    await expect(
      resetPassword(testDb, { token: rawToken, newPassword: "AnotherPass#3" }),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
  });

  it("throws INVALID_TOKEN for a bogus token", async () => {
    await expect(
      resetPassword(testDb, { token: "deadbeef".repeat(8), newPassword: "NewPass#2" }),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
  });

  it("throws INVALID_TOKEN for an expired token", async () => {
    const email = uniqueEmail("expired");
    const { userId } = await signup(testDb, {
      email,
      password: "OldPass#1",
      companyName: "Co",
    });
    const rawToken = crypto.randomBytes(32).toString("hex");
    await testDb.passwordResetToken.create({
      data: {
        userId,
        tokenHash: sha256(rawToken),
        expiresAt: new Date(Date.now() - 1_000),
      },
    });

    await expect(
      resetPassword(testDb, { token: rawToken, newPassword: "NewPass#2" }),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
  });

  it("allows only one concurrent use of the same reset token", async () => {
    const email = uniqueEmail("concurrent");
    await signup(testDb, { email, password: "OldPass#1", companyName: "Co" });
    await forgotPassword(testDb, { email, baseUrl: "http://localhost:3000" });
    const outbox = await testDb.emailOutbox.findFirst({ where: { toEmail: email } });
    const rawToken = outbox!.bodyHtml.match(/token=([a-f0-9]+)/)![1]!;

    const results = await Promise.allSettled([
      resetPassword(testDb, { token: rawToken, newPassword: "NewPass#2" }),
      resetPassword(testDb, { token: rawToken, newPassword: "OtherPass#3" }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("createStaff + deactivateStaff — FR-ADM-01", () => {
  beforeEach(cleanTestUsers);

  it("creates a STAFF user with no customer row", async () => {
    const email = uniqueEmail("staff");
    const result = await createStaff(testDb, { email, password: "StaffPass#1" });
    expect(result.ok).toBe(true);

    const user = await testDb.user.findUnique({ where: { id: result.userId } });
    expect(user?.role).toBe("STAFF");

    const customer = await testDb.customer.findFirst({ where: { userId: result.userId } });
    expect(customer).toBeNull();
  });

  it("deactivates a staff user by mangling their email", async () => {
    let adminUser = await testDb.user.findFirst({ where: { role: "ADMIN" } });
    if (!adminUser) {
      adminUser = await testDb.user.create({
        data: {
          email: uniqueEmail("admin"),
          passwordHash: "hash",
          role: "ADMIN",
        },
      });
    }
    const email = uniqueEmail("todeactivate");
    const { userId } = await createStaff(testDb, { email, password: "StaffPass#1" });

    const result = await deactivateStaff(testDb, {
      targetUserId: userId,
      requestingUserId: adminUser.id,
    });
    expect(result.ok).toBe(true);

    const user = await testDb.user.findUnique({ where: { id: userId } });
    expect(user?.email).toContain("deactivated::");
  });

  it("throws SELF_DEACTIVATE when admin deactivates themselves", async () => {
    let adminUser = await testDb.user.findFirst({ where: { role: "ADMIN" } });
    if (!adminUser) {
      adminUser = await testDb.user.create({
        data: {
          email: uniqueEmail("admin"),
          passwordHash: "hash",
          role: "ADMIN",
        },
      });
    }

    await expect(
      deactivateStaff(testDb, {
        targetUserId: adminUser.id,
        requestingUserId: adminUser.id,
      }),
    ).rejects.toMatchObject({ code: "SELF_DEACTIVATE" });
  });

  it("does not allow an admin to deactivate a customer account", async () => {
    let adminUser = await testDb.user.findFirst({ where: { role: "ADMIN" } });
    if (!adminUser) {
      adminUser = await testDb.user.create({
        data: { email: uniqueEmail("admin"), passwordHash: "hash", role: "ADMIN" },
      });
    }
    const customer = await signup(testDb, {
      email: uniqueEmail("customer"), password: "Customer#1", companyName: "Co",
    });

    await expect(
      deactivateStaff(testDb, { targetUserId: customer.userId, requestingUserId: adminUser.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
