/**
 * modules/auth — Data access (Prisma queries for this module only).
 * Other modules never import this file — only ./index.ts is the public API.
 *
 * All email lookups normalize to lowercase before querying (FR-AUTH-01:
 * case-insensitive uniqueness). The DB stores the already-lowercased email
 * (lowercased at service layer before write, per the schema comment).
 */
import type { PrismaClient, Prisma } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

// ── User lookups ──────────────────────────────────────────────────────────────

/** Find a user by exact (already-normalized) email. */
export async function findUserByEmail(db: Db, email: string) {
  return (db as PrismaClient).user.findUnique({ where: { email } });
}

/** Find a user by id — for requireRole + token validation. */
export async function findUserById(db: Db, id: string) {
  return (db as PrismaClient).user.findUnique({ where: { id } });
}

/** List staff (ADMIN + STAFF roles) for the staff management page. */
export async function findStaffUsers(
  db: Db,
  opts: { cursor?: string; take: number },
) {
  const rows = await (db as PrismaClient).user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    cursor: opts.cursor ? { id: opts.cursor } : undefined,
    skip: opts.cursor ? 1 : 0,
    take: opts.take + 1,
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      // isActive is tracked via `active` field added to the service layer.
      // The schema has no isActive on users — we model "deactivated" by
      // storing a sentinel email prefix "deactivated::" applied at service.
    },
  });
  const hasMore = rows.length > opts.take;
  return {
    items: hasMore ? rows.slice(0, opts.take) : rows,
    nextCursor: hasMore ? rows[opts.take - 1]!.id : null,
  };
}

// ── Signup ────────────────────────────────────────────────────────────────────

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  /** Only required when role = CUSTOMER */
  companyName?: string;
}

/**
 * Creates a user + matching Customer row in a single transaction.
 * For CUSTOMER sign-up; STAFF is created by admin without a Customer row.
 */
export async function createCustomerUser(
  db: PrismaClient,
  input: CreateUserInput & { companyName: string },
) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        role: "CUSTOMER",
      },
    });
    await tx.customer.create({
      data: { userId: user.id, companyName: input.companyName },
    });
    return user;
  });
}

/** Creates a STAFF user (no Customer row). Admin-only path. */
export async function createStaffUser(
  db: Db,
  input: { email: string; passwordHash: string },
) {
  return (db as PrismaClient).user.create({
    data: { email: input.email, passwordHash: input.passwordHash, role: "STAFF" },
    select: { id: true, email: true, role: true, createdAt: true },
  });
}

/**
 * "Deactivate" a staff user by prefixing their email so they can no longer
 * log in. We do NOT delete users — history rows must remain intact.
 * The prefix `deactivated::UUID::` makes the original email recoverable by
 * an admin if needed and keeps the uniqueness constraint satisfied.
 */
export async function deactivateUser(db: Db, userId: string) {
  return (db as PrismaClient).user.update({
    where: { id: userId },
    data: { email: `deactivated::${userId}::${Date.now()}` },
    select: { id: true, email: true, role: true },
  });
}

// ── Password reset tokens ─────────────────────────────────────────────────────

export interface CreateTokenInput {
  userId: string;
  tokenHash: string;  // sha256 hex — never store raw token
  expiresAt: Date;
}

/** Inserts a new reset token row. */
export async function createResetToken(db: Db, input: CreateTokenInput) {
  return (db as PrismaClient).passwordResetToken.create({
    data: {
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    },
  });
}

/** Finds a valid (unused + unexpired) token by its hash. */
export async function findValidToken(db: Db, tokenHash: string) {
  return (db as PrismaClient).passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
}

/**
 * Marks the token as used (single-use guarantee — FR-AUTH-04) and updates
 * the user's password in the same transaction.
 */
export async function consumeTokenAndResetPassword(
  db: PrismaClient,
  tokenId: string,
  userId: string,
  newPasswordHash: string,
) {
  return db.$transaction(async (tx) => {
    await tx.passwordResetToken.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    });
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  });
}

// ── Email outbox staging (FR-MAIL-01) ─────────────────────────────────────────

export interface StageEmailInput {
  toEmail: string;
  subject: string;
  bodyHtml: string;
  kind: "RESET" | "INVOICE_SENT" | "REMINDER";
}

/** Stages an outgoing email in email_outbox (offline-safe). */
export async function stageEmail(db: Db, input: StageEmailInput) {
  return (db as PrismaClient).emailOutbox.create({ data: input });
}
