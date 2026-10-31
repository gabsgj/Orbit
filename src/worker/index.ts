import cron from "node-cron";
import { runBilling } from "@/modules/billing";
import { prisma } from "@/shared/db";

/**
 * Local billing trigger (node-cron) — the offline/demo scheduler. One of BOTH
 * triggers; calls the same BillingService as the button and the Vercel Cron.
 *
 * Schedule via BILLING_CRON (default "5 0 * * *"). Demo rehearsal mode:
 *   BILLING_CRON="0-59/2 * * * *" npm run worker
 * …and watch a run fire live on stage (docs/PLAN.md §7 act 4).
 */
const schedule = process.env.BILLING_CRON ?? "5 0 * * *";

async function tick() {
  console.log(`[worker] ${new Date().toISOString()} — billing run starting…`);
  try {
    const result = await runBilling(prisma, {
      asOf: new Date(),
      triggerType: "CRON_LOCAL",
    });
    console.log("[worker] run complete:", result);
  } catch (err) {
    console.error("[worker] run failed:", err);
  }
}

console.log(`[worker] Orbit billing scheduler started — cron "${schedule}"`);
cron.schedule(schedule, tick);

// Run once at startup when BILLING_RUN_ON_START=true (useful for rehearsal).
if (process.env.BILLING_RUN_ON_START === "true") void tick();
