/**
 * Keyset (cursor) pagination — the ONLY list primitive (SRS NFR-PERF-01 / NFR-SCAL-01).
 *
 * Why keyset, never OFFSET: `OFFSET n` scans and discards n rows, so page depth makes
 * the query slower — at 40k invoices the last page is a deep scan. A keyset predicate
 * (`WHERE id > $cursor ORDER BY id LIMIT $take+1`) seeks straight into the index, so
 * every page costs the same constant time regardless of depth.
 *
 * We fetch `take + 1` rows: the extra row is an existence check for "has next page"
 * (and supplies the next cursor), without a separate COUNT query.
 *
 * Framework-free: plain types only, no Prisma import — the return shape is structurally
 * compatible with `findMany({ take, cursor, skip })` on any model whose PK is `id`.
 *
 * @see keysetArgs for the full contract (cursor key, clamping, ordering caveat).
 */

import { z } from "zod";

export const DEFAULT_TAKE = 25;
export const MAX_TAKE = 100;

/**
 * Zod input schema for paginated list endpoints — spread into each module's
 * list-input schema in `modules/<name>/schemas.ts`:
 *   listInput = z.object({ ...cursorInput.shape, status: ... })
 */
export const cursorInput = z.object({
  cursor: z.string().min(1).optional(),
  take: z.coerce.number().int().min(1).max(MAX_TAKE).default(DEFAULT_TAKE),
});

export type CursorInput = z.infer<typeof cursorInput>;

/** Structural shape of Prisma's `findMany` keyset args — no Prisma import needed. */
export interface KeysetArgs<K extends string = "id"> {
  take: number;
  skip?: number;
  cursor?: Record<K, string>;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Build Prisma `findMany` args for one keyset page.
 *
 * @param cursor id of the LAST row of the previous page (omit for page 1).
 * @param take   requested page size — default 25, clamped to 1..100.
 * @returns      `{ take: take + 1 }` plus, when a cursor is given,
 *               `{ cursor: { [key]: cursor }, skip: 1 }` (Prisma's `cursor` row itself
 *               is included in the raw result, so `skip: 1` hops over the anchor).
 *
 * The extra `+1` row is the has-next-page probe consumed by {@link toPage}.
 *
 * CAVEAT — the cursor column must be UNIQUE and the query's `orderBy` must start with
 * that same column; a non-unique sort key (e.g. `issueDate` alone) skips/repeats rows
 * at page boundaries. Orbit tables all have uuid PKs, so `orderBy: { id: "asc" }` is
 * the correct pattern (use `orderBy: [{ issueDate: "desc" }, { id: "desc" }]` with a
 * composite cursor only if a domain list ever needs date ordering).
 *
 * @example
 * prisma.invoice.findMany({
 *   where, orderBy: { id: "asc" },
 *   ...keysetArgs(input.cursor, input.take),
 * })
 */
export function keysetArgs<K extends string = "id">(
  cursor?: string,
  take: number = DEFAULT_TAKE,
  cursorKey: K = "id" as K,
): KeysetArgs<K> {
  const n = Math.trunc(take);
  const pageSize = Number.isNaN(n) ? DEFAULT_TAKE : clamp(n, 1, MAX_TAKE);
  return {
    take: pageSize + 1, // one extra row as the "has next page" probe
    ...(cursor ? { cursor: { [cursorKey]: cursor } as Record<K, string>, skip: 1 } : {}),
  };
}

export interface Page<T> {
  items: T[];
  /** id of the last item in this page — pass back as `cursor` for the next page; null = no more pages. */
  nextCursor: string | null;
}

/**
 * Fold a `take + 1` row result into the page envelope `{ items, nextCursor }`.
 *
 * Pass the SAME clamped `take` used for the query — not `rows.length`, which
 * includes the probe row. `rows.length > take` means a next page exists; the
 * cursor handed to the client is the id of the last RETURNED item (row `take`,
 * not the probe).
 */
export function toPage<T extends { id: string }>(rows: T[], take: number): Page<T> {
  const items = rows.slice(0, take);
  const hasMore = rows.length > take;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}
