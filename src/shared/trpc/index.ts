import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import superjson from "superjson";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { authOptions } from "@/shared/auth";
import { prisma } from "@/shared/db";

/**
 * tRPC kernel (shared kernel — zero domain logic).
 * - createContext: session + prisma available to every procedure.
 * - publicProcedure / protectedProcedure / requireRole: the RBAC primitives
 *   every module router uses (SRS FR-AUTH-05). Server-side, always.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function createContext(_opts?: FetchCreateContextFnOptions) {
  const session = await getServerSession(authOptions);
  return { session, prisma };
}
export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required." });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

/** Server-side role gate — the ONLY authorization primitive module routers use. */
export function requireRole(...roles: Array<"ADMIN" | "STAFF" | "CUSTOMER">) {
  return t.middleware(({ ctx, next }) => {
    const user = ctx.session?.user;
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required." });
    }
    if (!roles.includes(user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Requires role: ${roles.join(" or ")}.`,
      });
    }
    return next({ ctx: { ...ctx, session: ctx.session } });
  });
}

export const createCallerFactory = t.createCallerFactory;
