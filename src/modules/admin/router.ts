import { TRPCError } from "@trpc/server";
import { router, publicProcedure, requireRole } from "@/shared/trpc";
import { auditLogInput, outboxInput, outboxByIdInput } from "./schemas";
import {
  findAuditLog,
  findEmailOutbox,
  findEmailOutboxById,
  findSequences,
} from "./queries";

/**
 * admin router — thin layer: parse (zod) → guard (requireRole) → call queries → shape.
 * All lists are keyset-paginated and return { items, nextCursor }.
 * Registered in shared/trpc/root.ts.
 */
export const adminRouter = router({
  _health: publicProcedure.query(() => ({ module: "admin", ok: true })),

  /** FR-ADM-03 — global audit log of sensitive actions (admin only). */
  auditLog: publicProcedure
    .use(requireRole("ADMIN"))
    .input(auditLogInput)
    .query(({ ctx, input }) => findAuditLog(ctx.prisma, input)),

  /** FR-MAIL-02 — outbox viewer; staff may show it during the demo. */
  outbox: publicProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(outboxInput)
    .query(({ ctx, input }) => findEmailOutbox(ctx.prisma, input)),

  /** FR-MAIL-02 — detail view of one staged email (admin only). */
  outboxById: publicProcedure
    .use(requireRole("ADMIN"))
    .input(outboxByIdInput)
    .query(async ({ ctx, input }) => {
      const row = await findEmailOutboxById(ctx.prisma, input.id);
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Email not found in outbox." });
      }
      return row;
    }),

  /** Sequences lookup — live document-number counters (admin only). */
  sequences: publicProcedure
    .use(requireRole("ADMIN"))
    .query(({ ctx }) => findSequences(ctx.prisma)),
});
