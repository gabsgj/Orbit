import { TRPCError } from "@trpc/server";
import { router, publicProcedure, requireRole } from "@/shared/trpc";
import { prisma } from "@/shared/db";
import {
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createStaffSchema,
  deactivateStaffSchema,
} from "./schemas";
import {
  signup,
  forgotPassword,
  resetPassword,
  createStaff,
  deactivateStaff,
  findStaffUsers,
} from "./service";
import { z } from "zod";

/**
 * auth router — thin layer: parse (zod) → guard (requireRole) → call service → shape.
 * Business logic lives in ./service.ts.  Registered in shared/trpc/root.ts.
 *
 * Procedures:
 *  signup            — public          FR-AUTH-01/02
 *  forgotPassword    — public          FR-AUTH-04
 *  resetPassword     — public          FR-AUTH-04
 *  createStaff       — ADMIN only      FR-AUTH-06, FR-ADM-01
 *  deactivateStaff   — ADMIN only      FR-ADM-01
 *  listStaff         — ADMIN only      FR-ADM-01
 */
export const authRouter = router({
  _health: publicProcedure.query(() => ({ module: "auth", ok: true })),

  // ── FR-AUTH-01/02: Customer self-signup ─────────────────────────────────────
  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ input }) => {
      try {
        return await signup(prisma, input);
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        if (e.code === "EMAIL_CONFLICT") {
          throw new TRPCError({
            code: "CONFLICT",
            message: e.message ?? "Email already in use.",
          });
        }
        throw err;
      }
    }),

  // ── FR-AUTH-04: Forgot password — stages reset link in email_outbox ─────────
  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      // Derive base URL from the request headers (Next.js provides host in ctx).
      // Fall back to env for server-side calls (worker/cron scenarios).
      const baseUrl =
        process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      void ctx; // ctx used by tRPC; destructured here for future header access
      return forgotPassword(prisma, { email: input.email, baseUrl });
    }),

  // ── FR-AUTH-04: Reset password — single-use sha256 token ────────────────────
  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      try {
        return await resetPassword(prisma, {
          token: input.token,
          newPassword: input.password,
        });
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        if (e.code === "INVALID_TOKEN") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: e.message ?? "Invalid or expired reset token.",
          });
        }
        throw err;
      }
    }),

  // ── FR-AUTH-06 / FR-ADM-01: Admin creates staff ──────────────────────────────
  createStaff: publicProcedure
    .use(requireRole("ADMIN"))
    .input(createStaffSchema)
    .mutation(async ({ input }) => {
      try {
        return await createStaff(prisma, input);
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        if (e.code === "EMAIL_CONFLICT") {
          throw new TRPCError({
            code: "CONFLICT",
            message: e.message ?? "Email already in use.",
          });
        }
        throw err;
      }
    }),

  // ── FR-ADM-01: Admin deactivates staff ───────────────────────────────────────
  deactivateStaff: publicProcedure
    .use(requireRole("ADMIN"))
    .input(deactivateStaffSchema)
    .mutation(async ({ input, ctx }) => {
      const requestingUserId = ctx.session!.user.id;
      try {
        return await deactivateStaff(prisma, {
          targetUserId: input.userId,
          requestingUserId,
        });
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        if (e.code === "NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: e.message! });
        }
        if (e.code === "FORBIDDEN" || e.code === "SELF_DEACTIVATE") {
          throw new TRPCError({ code: "FORBIDDEN", message: e.message! });
        }
        throw err;
      }
    }),

  // ── FR-ADM-01: List staff users (keyset paginated) ───────────────────────────
  listStaff: publicProcedure
    .use(requireRole("ADMIN"))
    .input(
      z.object({
        cursor: z.string().optional(),
        take: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(({ input }) => findStaffUsers(prisma, input)),
});
