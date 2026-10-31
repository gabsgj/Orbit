import { NextResponse } from "next/server";
import { runBilling } from "@/modules/billing";
import { prisma } from "@/shared/db";

// Long billing runs need the Node.js runtime (not edge) and a raised duration
// cap — Vercel's default function timeout would cut large runs short.
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Hosted billing trigger (Vercel Cron — bonus mirror only; the judged demo uses
 * the local node-cron worker in src/worker/). Calls the SAME BillingService.
 * vercel.json registers: { "path": "/api/cron/billing", "schedule": "5 0 * * *" }.
 */
export async function GET(req: Request) {
  // Misconfiguration must be loud, not a silent 401 loop.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBilling(prisma, {
      asOf: new Date(),
      triggerType: "CRON_VERCEL",
    });
    if (result.status === "FAILED") {
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[cron/billing] unhandled error:", err);
    return NextResponse.json(
      { error: "Billing run failed" },
      { status: 500 },
    );
  }
}
