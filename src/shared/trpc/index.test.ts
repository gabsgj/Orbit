import { describe, expect, it } from "vitest";
import { prisma } from "@/shared/db";
import { publicProcedure, requireRole, router, type Context } from "./index";

/**
 * RBAC matrix regression test. Authorization must remain server-side even if a
 * client exposes a route or nav item by mistake.
 */
const rbacTestRouter = router({
  adminOnly: publicProcedure.use(requireRole("ADMIN")).query(() => ({ ok: true })),
});

function callerFor(role?: "ADMIN" | "STAFF" | "CUSTOMER") {
  const session = role
    ? {
        user: { id: "00000000-0000-0000-0000-000000000001", role, email: "user@orbit.test" },
        expires: "2099-01-01T00:00:00.000Z",
      }
    : null;
  return rbacTestRouter.createCaller({ session, prisma } as Context);
}

describe("requireRole — server-side RBAC matrix", () => {
  it("rejects anonymous callers", async () => {
    await expect(callerFor().adminOnly()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("allows ADMIN and rejects STAFF/CUSTOMER", async () => {
    await expect(callerFor("ADMIN").adminOnly()).resolves.toEqual({ ok: true });
    await expect(callerFor("STAFF").adminOnly()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor("CUSTOMER").adminOnly()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
