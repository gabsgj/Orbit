import { router, publicProcedure } from "@/shared/trpc";

/**
 * portal router — thin layer: parse (zod) → guard (requireRole) → call service → shape.
 * Business logic lives in ./service.ts. Registered in shared/trpc/root.ts.
 * TODO(owner): implement procedures per docs/SRS.md.
 */
export const portalRouter = router({
  _health: publicProcedure.query(() => ({ module: "portal", ok: true })),
});
