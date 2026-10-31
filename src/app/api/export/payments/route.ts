import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/auth";
import { prisma } from "@/shared/db";
import type { Prisma } from "@prisma/client";

/**
 * FR-DASH-06 (P2) — CSV export of payments for the finance lead.
 * GET /api/export/payments?fromDate=2026-01-01&toDate=2026-12-31&customerId=…
 *
 * Mirrors the payments list filters (date range, customer). Capped at 10k
 * rows. Streams a RFC4180-compliant CSV as an attachment.
 */

const MAX_ROWS = 10_000;

/** RFC4180 field escaping: quote when the value contains , " \r \n; double inner quotes. */
function csvField(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(fields: Array<string | number | null | undefined>): string {
  return fields.map(csvField).join(",");
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const customerId = searchParams.get("customerId");
  const invoiceId = searchParams.get("invoiceId");

  const where: Prisma.PaymentWhereInput = {};

  if (customerId) {
    where.invoice = { customerId };
  }
  if (invoiceId) {
    where.invoiceId = invoiceId;
  }
  if (fromDate || toDate) {
    where.paidAt = {};
    if (fromDate) {
      const d = new Date(fromDate);
      if (!Number.isNaN(d.getTime())) where.paidAt.gte = d;
    }
    if (toDate) {
      const d = new Date(toDate);
      if (!Number.isNaN(d.getTime())) where.paidAt.lte = d;
    }
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      invoice: { select: { number: true } },
      recordedBy: { select: { email: true } },
    },
    orderBy: { paidAt: "desc" },
    take: MAX_ROWS,
  });

  const header = csvRow([
    "invoice_number",
    "method",
    "amount",
    "paid_at",
    "note",
    "recorded_by",
  ]);

  const lines = payments.map((p) =>
    csvRow([
      p.invoice.number,
      p.method,
      p.amount.toString(),
      p.paidAt.toISOString(),
      p.note ?? "",
      p.recordedBy.email ?? "",
    ])
  );

  const csv = ["\uFEFF" + header, ...lines].join("\r\n");
  const filename = `payments-${toISODate(new Date())}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
