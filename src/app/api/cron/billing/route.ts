import { NextResponse } from "next/server";
import { runBilling } from "@/modules/billing";
import { prisma } from "@/shared/db";

/**
 * Hosted billing trigger (Vercel Cron — bonus mirror only; the judged demo uses
 * the local node-cron worker in src/worker/). Calls the SAME BillingService.
 * vercel.json registers: { "path": "/api/cron/billing", "schedule": "5 0 * * *" }.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runBilling(prisma, {
    asOf: new Date(),
    triggerType: "CRON_VERCEL",
  });
  return NextResponse.json(result);
}
