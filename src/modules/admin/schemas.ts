import { z } from "zod";
import { OutboxKind } from "@prisma/client";

/**
 * admin zod schemas — single source of truth, imported by BOTH the tRPC router
 * and the client forms (zodResolver).
 */

/** Keyset pagination inputs shared by every admin list (NFR-PERF-01: no OFFSET). */
const pagination = {
  /** Opaque keyset cursor — the `id` of the last row of the previous page. */
  cursor: z.string().uuid().optional(),
  take: z.number().int().min(1).max(100).default(25),
};

/** admin.auditLog — FR-ADM-03. */
export const auditLogInput = z.object({
  ...pagination,
  /** Filter to one entity kind, e.g. "subscription". */
  entity: z.string().trim().min(1).max(100).optional(),
});
export type AuditLogInput = z.infer<typeof auditLogInput>;

/** admin.outbox — FR-MAIL-02. */
export const outboxInput = z.object({
  ...pagination,
  kind: z.nativeEnum(OutboxKind).optional(),
});
export type OutboxInput = z.infer<typeof outboxInput>;

/** admin.outboxById — detail view of one staged email. */
export const outboxByIdInput = z.object({
  id: z.string().uuid(),
});
export type OutboxByIdInput = z.infer<typeof outboxByIdInput>;
