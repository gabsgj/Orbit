import { router } from "@/shared/trpc";
// Module routers are imported ONLY via their barrels (PLAN §1 contract).
import { authRouter } from "@/modules/auth";
import { catalogRouter } from "@/modules/catalog";
import { templatesRouter } from "@/modules/templates";
import { subscriptionsRouter } from "@/modules/subscriptions";
import { billingRouter } from "@/modules/billing";
import { invoicesRouter } from "@/modules/invoices";
import { paymentsRouter } from "@/modules/payments";
import { discountsRouter } from "@/modules/discounts";
import { dashboardRouter } from "@/modules/dashboard";
import { portalRouter } from "@/modules/portal";
import { adminRouter } from "@/modules/admin";

/**
 * The single app router — one entry per module. Module routers stay thin;
 * logic lives in each module's service.ts.
 */
export const appRouter = router({
  auth: authRouter,
  catalog: catalogRouter,
  templates: templatesRouter,
  subscriptions: subscriptionsRouter,
  billing: billingRouter,
  invoices: invoicesRouter,
  payments: paymentsRouter,
  discounts: discountsRouter,
  dashboard: dashboardRouter,
  portal: portalRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
