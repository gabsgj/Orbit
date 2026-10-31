import { router, publicProcedure } from "@/shared/trpc";

/**
 * discounts router — thin layer: parse (zod) → guard (requireRole) → call service → shape.
 * Business logic lives in ./service.ts. Registered in shared/trpc/root.ts.
 * TODO(owner): implement procedures per docs/SRS.md.
 */
export const discountsRouter = router({
  _health: publicProcedure.query(() => ({ module: "discounts", ok: true })),
});
