import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/auth";
import { prisma } from "@/shared/db";
import type { InvoiceStatus, Prisma } from "@prisma/client";

/**
 * FR-DASH-06 (P2) — CSV export of invoices for the finance lead.
 * GET /api/export/invoices?status=CONFIRMED&fromDate=2026-01-01&toDate=2026-12-31
 *
 * Mirrors the invoice list page filters (status, date range). Capped at 10k
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
  const status = searchParams.get("status");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const customerId = searchParams.get("customerId");
  const overdueOnly = searchParams.get("overdueOnly") === "true";

  const VALID_STATUSES: readonly InvoiceStatus[] = [
    "DRAFT",
    "CONFIRMED",
    "PAID",
    "CANCELLED",
  ];

  const where: Prisma.InvoiceWhereInput = {};

  if (status && (VALID_STATUSES as string[]).includes(status)) {
    where.status = status as InvoiceStatus;
  }
  if (customerId) {
    where.customerId = customerId;
  }
  if (fromDate || toDate) {
    where.issueDate = {};
    if (fromDate) {
      const d = new Date(fromDate);
      if (!Number.isNaN(d.getTime())) where.issueDate.gte = d;
    }
    if (toDate) {
      const d = new Date(toDate);
      if (!Number.isNaN(d.getTime())) where.issueDate.lte = d;
    }
  }
  if (overdueOnly) {
    where.status = "CONFIRMED";
    where.dueDate = { lt: new Date() };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: { customer: { select: { companyName: true } } },
    orderBy: { issueDate: "desc" },
    take: MAX_ROWS,
  });

  const header = csvRow([
    "number",
    "customer",
    "issue_date",
    "due_date",
    "status",
    "subtotal",
    "tax_total",
    "discount_total",
    "grand_total",
    "amount_paid",
    "outstanding",
  ]);

  const lines = invoices.map((inv) => {
    const grandTotal = Number(inv.grandTotal);
    const amountPaid = Number(inv.amountPaid);
    const outstanding = Math.max(0, grandTotal - amountPaid);
    return csvRow([
      inv.number,
      inv.customer.companyName,
      toISODate(inv.issueDate),
      toISODate(inv.dueDate),
      inv.status,
      inv.subtotal.toString(),
      inv.taxTotal.toString(),
      inv.discountTotal.toString(),
      inv.grandTotal.toString(),
      inv.amountPaid.toString(),
      outstanding.toFixed(2),
    ]);
  });

  const csv = ["\uFEFF" + header, ...lines].join("\r\n");
  const filename = `invoices-${toISODate(new Date())}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
