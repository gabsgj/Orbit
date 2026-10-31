import type { PrismaClient, OutboxKind } from "@prisma/client";

/**
 * admin data access — Prisma queries for THIS module only. Other modules never
 * import this file; they use the public API exported from ./index.ts.
 *
 * All lists use keyset (cursor) pagination per NFR-PERF-01: ORDER BY the
 * timestamp DESC + id DESC tiebreak, `cursor` on the last row's id, fetch
 * `take + 1` rows to detect whether a next page exists.
 */

export interface Page<T> {
  items: T[];
  /** Pass back as `cursor` to get the next page; null when this is the last page. */
  nextCursor: string | null;
}

type Db = Pick<PrismaClient, "auditLog" | "emailOutbox" | "sequence">;

/** Splits a `take + 1` result window into items + nextCursor. */
function toPage<T extends { id: string }>(rows: T[], take: number): Page<T> {
  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1]!.id : null };
}

/** FR-ADM-03 — global audit log, newest first, with actor email. */
export async function findAuditLog(
  db: Db,
  opts: { cursor?: string; take: number; entity?: string },
) {
  const rows = await db.auditLog.findMany({
    where: opts.entity ? { entity: opts.entity } : undefined,
    orderBy: [{ at: "desc" }, { id: "desc" }],
    cursor: opts.cursor ? { id: opts.cursor } : undefined,
    skip: opts.cursor ? 1 : 0,
    take: opts.take + 1,
    include: { user: { select: { email: true } } },
  });
  return toPage(rows, opts.take);
}

/** FR-MAIL-02 — staged email outbox, newest first. */
export async function findEmailOutbox(
  db: Db,
  opts: { cursor?: string; take: number; kind?: OutboxKind },
) {
  const rows = await db.emailOutbox.findMany({
    where: opts.kind ? { kind: opts.kind } : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    cursor: opts.cursor ? { id: opts.cursor } : undefined,
    skip: opts.cursor ? 1 : 0,
    take: opts.take + 1,
  });
  return toPage(rows, opts.take);
}

/** FR-MAIL-02 — one staged email for the detail view. */
export async function findEmailOutboxById(db: Db, id: string) {
  return db.emailOutbox.findUnique({ where: { id } });
}

/** Sequences list — tiny lookup table (one row per doc-type/year), no pagination. */
export async function findSequences(db: Db) {
  return db.sequence.findMany({
    orderBy: [{ docType: "asc" }, { year: "desc" }],
  });
}
