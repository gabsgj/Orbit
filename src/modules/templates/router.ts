import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure, requireRole } from "@/shared/trpc";
import { prisma } from "@/shared/db";
import {
  listTemplatesSchema,
  createTemplateSchema,
  updateTemplateSchema,
  upsertTemplateLinesSchema,
} from "./schemas";
import {
  getTemplates,
  getTemplate,
  addTemplate,
  editTemplate,
  deactivateTemplate,
  setTemplateLines,
} from "./service";

/**
 * templates router — FR-QT-01.
 * Reads: ADMIN + STAFF. Writes: ADMIN only (staff may view templates to create
 * subscriptions from them, but cannot modify the catalog of templates).
 */
export const templatesRouter = router({
  _health: publicProcedure.query(() => ({ module: "templates", ok: true })),

  list: publicProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(listTemplatesSchema)
    .query(({ input }) => getTemplates(prisma, input)),

  get: publicProcedure
    .use(requireRole("ADMIN", "STAFF"))
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const template = await getTemplate(prisma, input.id);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found." });
      return template;
    }),

  create: publicProcedure
    .use(requireRole("ADMIN"))
    .input(createTemplateSchema)
    .mutation(({ input }) => addTemplate(prisma, input)),

  update: publicProcedure
    .use(requireRole("ADMIN"))
    .input(updateTemplateSchema)
    .mutation(({ input }) => editTemplate(prisma, input)),

  archive: publicProcedure
    .use(requireRole("ADMIN"))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) => deactivateTemplate(prisma, input.id)),

  /**
   * Replace all lines of a template (atomic: delete-then-insert in tx).
   * Designed so the UI can save the template header + lines together.
   */
  upsertLines: publicProcedure
    .use(requireRole("ADMIN"))
    .input(upsertTemplateLinesSchema)
    .mutation(({ input }) => setTemplateLines(prisma, input)),
});
