import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure, requireRole } from "@/shared/trpc";
import { prisma } from "@/shared/db";
import {
  listProductsSchema,
  createProductSchema,
  updateProductSchema,
  createAttributeSchema,
  createAttributeValueSchema,
  createVariantSchema,
  updateVariantSchema,
  listPlansSchema,
  createPlanSchema,
  updatePlanSchema,
  listTaxesSchema,
  createTaxSchema,
  updateTaxSchema,
} from "./schemas";
import {
  getProducts,
  getProduct,
  addProduct,
  editProduct,
  archiveProduct,
  getAttributes,
  getAttribute,
  addAttribute,
  removeAttribute,
  addAttributeValue,
  removeAttributeValue,
  addVariant,
  editVariant,
  removeVariant,
  getVariantsForProduct,
  getPlans,
  getPlan,
  addPlan,
  editPlan,
  archivePlan,
  getTaxes,
  getTax,
  addTax,
  editTax,
  archiveTax,
} from "./service";

/**
 * catalog router — FR-CAT-01…05.
 * RBAC: read procedures = ADMIN + STAFF; writes = ADMIN only.
 * Thin layer: zod parse → requireRole → service call → shape.
 */
export const catalogRouter = router({
  _health: publicProcedure.query(() => ({ module: "catalog", ok: true })),

  // ── Products (FR-CAT-01) ───────────────────────────────────────────────────

  products: {
    list: publicProcedure
      .use(requireRole("ADMIN", "STAFF"))
      .input(listProductsSchema)
      .query(({ input }) => getProducts(prisma, input)),

    get: publicProcedure
      .use(requireRole("ADMIN", "STAFF"))
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const product = await getProduct(prisma, input.id);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
        return product;
      }),

    create: publicProcedure
      .use(requireRole("ADMIN"))
      .input(createProductSchema)
      .mutation(({ input }) => addProduct(prisma, input)),

    update: publicProcedure
      .use(requireRole("ADMIN"))
      .input(updateProductSchema)
      .mutation(({ input }) => editProduct(prisma, input)),

    archive: publicProcedure
      .use(requireRole("ADMIN"))
      .input(z.object({ id: z.string().uuid() }))
      .mutation(({ input }) => archiveProduct(prisma, input.id)),
  },

  // ── Attributes (FR-CAT-02) ─────────────────────────────────────────────────

  attributes: {
    list: publicProcedure
      .use(requireRole("ADMIN", "STAFF"))
      .query(() => getAttributes(prisma)),

    get: publicProcedure
      .use(requireRole("ADMIN", "STAFF"))
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const attr = await getAttribute(prisma, input.id);
        if (!attr) throw new TRPCError({ code: "NOT_FOUND", message: "Attribute not found." });
        return attr;
      }),

    create: publicProcedure
      .use(requireRole("ADMIN"))
      .input(createAttributeSchema)
      .mutation(({ input }) => addAttribute(prisma, input)),

    delete: publicProcedure
      .use(requireRole("ADMIN"))
      .input(z.object({ id: z.string().uuid() }))
      .mutation(({ input }) => removeAttribute(prisma, input.id)),

    // Attribute values nested under attributes
    addValue: publicProcedure
      .use(requireRole("ADMIN"))
      .input(createAttributeValueSchema)
      .mutation(({ input }) => addAttributeValue(prisma, input)),

    deleteValue: publicProcedure
      .use(requireRole("ADMIN"))
      .input(z.object({ id: z.string().uuid() }))
      .mutation(({ input }) => removeAttributeValue(prisma, input.id)),
  },

  // ── Variants (FR-CAT-02) ───────────────────────────────────────────────────

  variants: {
    listByProduct: publicProcedure
      .use(requireRole("ADMIN", "STAFF"))
      .input(z.object({ productId: z.string().uuid() }))
      .query(({ input }) => getVariantsForProduct(prisma, input.productId)),

    create: publicProcedure
      .use(requireRole("ADMIN"))
      .input(createVariantSchema)
      .mutation(({ input }) => addVariant(prisma, input)),

    update: publicProcedure
      .use(requireRole("ADMIN"))
      .input(updateVariantSchema)
      .mutation(({ input }) => editVariant(prisma, input)),

    delete: publicProcedure
      .use(requireRole("ADMIN"))
      .input(z.object({ id: z.string().uuid() }))
      .mutation(({ input }) => removeVariant(prisma, input.id)),
  },

  // ── Plans (FR-CAT-03, FR-CAT-04) ──────────────────────────────────────────

  plans: {
    list: publicProcedure
      .use(requireRole("ADMIN", "STAFF"))
      .input(listPlansSchema)
      .query(({ input }) => getPlans(prisma, input)),

    get: publicProcedure
      .use(requireRole("ADMIN", "STAFF"))
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const plan = await getPlan(prisma, input.id);
        if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });
        return plan;
      }),

    create: publicProcedure
      .use(requireRole("ADMIN"))
      .input(createPlanSchema)
      .mutation(({ input }) => addPlan(prisma, input)),

    update: publicProcedure
      .use(requireRole("ADMIN"))
      .input(updatePlanSchema)
      .mutation(({ input }) => editPlan(prisma, input)),

    archive: publicProcedure
      .use(requireRole("ADMIN"))
      .input(z.object({ id: z.string().uuid() }))
      .mutation(({ input }) => archivePlan(prisma, input.id)),
  },

  // ── Taxes (FR-CAT-05) ─────────────────────────────────────────────────────

  taxes: {
    list: publicProcedure
      .use(requireRole("ADMIN", "STAFF"))
      .input(listTaxesSchema)
      .query(({ input }) => getTaxes(prisma, input)),

    get: publicProcedure
      .use(requireRole("ADMIN", "STAFF"))
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const tax = await getTax(prisma, input.id);
        if (!tax) throw new TRPCError({ code: "NOT_FOUND", message: "Tax not found." });
        return tax;
      }),

    create: publicProcedure
      .use(requireRole("ADMIN"))
      .input(createTaxSchema)
      .mutation(({ input }) => addTax(prisma, input)),

    update: publicProcedure
      .use(requireRole("ADMIN"))
      .input(updateTaxSchema)
      .mutation(({ input }) => editTax(prisma, input)),

    archive: publicProcedure
      .use(requireRole("ADMIN"))
      .input(z.object({ id: z.string().uuid() }))
      .mutation(({ input }) => archiveTax(prisma, input.id)),
  },
});
