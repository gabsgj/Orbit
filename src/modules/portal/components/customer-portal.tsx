"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { DataTable } from "@/shared/ui/data-table";
import { formatINR, formatDate } from "@/shared/lib/money";
import {
  SubscriptionIcon,
  InvoiceIcon,
  CreditCardIcon,
  CheckIcon,
  ClockIcon,
  AlertTriangleIcon,
  PrinterIcon,
} from "@/shared/ui/icons";

export interface PortalSubscription {
  id: string;
  number: string;
  productName: string;
  planName: string;
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  status: "ACTIVE" | "PAUSED" | "CLOSED";
  startDate: string;
  nextBillingDate: string;
  paymentTermsDays: number;
  monthlyLineValue: number;
  quantity: number;
  unitPrice: number;
}

export interface PortalInvoice {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  amountPaid: number;
  status: "CONFIRMED" | "PAID" | "CANCELLED";
  periodStart: string;
  periodEnd: string;
}

export interface CustomerPortalProps {
  customer?: {
    name: string;
    email: string;
    companyName: string;
    taxId?: string;
    billingAddress?: string;
  };
  subscriptions?: PortalSubscription[];
  invoices?: PortalInvoice[];
  isLoading?: boolean;
}

// Sample fallback for rich demonstration when live DB has initial fixtures
const DEMO_SUBSCRIPTIONS: PortalSubscription[] = [
  {
    id: "sub-1",
    number: "SUB-2026-00001",
    productName: "Brightloop CRM Cloud",
    planName: "Enterprise Tier (Monthly)",
    period: "MONTHLY",
    status: "ACTIVE",
    startDate: "2026-01-15",
    nextBillingDate: "2026-11-15",
    paymentTermsDays: 15,
    monthlyLineValue: 5560,
    quantity: 5,
    unitPrice: 1112,
  },
  {
    id: "sub-2",
    number: "SUB-2026-00004",
    productName: "Orbit Analytics Add-on",
    planName: "Pro Analytics (Monthly)",
    period: "MONTHLY",
    status: "ACTIVE",
    startDate: "2026-03-01",
    nextBillingDate: "2026-11-01",
    paymentTermsDays: 15,
    monthlyLineValue: 2400,
    quantity: 1,
    unitPrice: 2400,
  },
];

const DEMO_INVOICES: PortalInvoice[] = [
  {
    id: "inv-1",
    number: "INV-2026-00001",
    issueDate: "2026-10-01",
    dueDate: "2026-10-16",
    subtotal: 7960,
    taxTotal: 1432.8,
    grandTotal: 9392.8,
    amountPaid: 9392.8,
    status: "PAID",
    periodStart: "2026-10-01",
    periodEnd: "2026-11-01",
  },
  {
    id: "inv-2",
    number: "INV-2026-00002",
    issueDate: "2026-09-01",
    dueDate: "2026-09-16",
    subtotal: 7960,
    taxTotal: 1432.8,
    grandTotal: 9392.8,
    amountPaid: 9392.8,
    status: "PAID",
    periodStart: "2026-09-01",
    periodEnd: "2026-10-01",
  },
];

export function CustomerPortal({
  customer = {
    name: "Alex Rivera",
    email: "customer@brightloop.local",
    companyName: "Acme Stores Pvt Ltd",
    taxId: "GSTIN29ABCDE1234F1Z5",
    billingAddress: "42 MG Road, Brigade Towers, Bengaluru, KA 560001",
  },
  subscriptions = DEMO_SUBSCRIPTIONS,
  invoices = DEMO_INVOICES,
  isLoading = false,
}: CustomerPortalProps) {
  const [activeTab, setActiveTab] = React.useState<"subscriptions" | "invoices" | "billing">("subscriptions");
  const [selectedInvoice, setSelectedInvoice] = React.useState<PortalInvoice | null>(null);

  const totalMonthlySpend = subscriptions
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => sum + s.monthlyLineValue, 0);

  const totalOutstanding = invoices
    .filter((i) => i.status === "CONFIRMED")
    .reduce((sum, i) => sum + (i.grandTotal - i.amountPaid), 0);

  const overdueInvoices = invoices.filter(
    (i) => i.status === "CONFIRMED" && new Date(i.dueDate) < new Date() && i.grandTotal > i.amountPaid
  );

  const invoiceColumns: ColumnDef<PortalInvoice>[] = [
    {
      accessorKey: "number",
      header: "Invoice #",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-[hsl(var(--foreground))]">
          {row.original.number}
        </span>
      ),
    },
    {
      accessorKey: "issueDate",
      header: "Issue Date",
      cell: ({ row }) => (
        <span className="text-xs text-[hsl(var(--muted-foreground))] tabular-nums">
          {formatDate(row.original.issueDate)}
        </span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => (
        <span className="text-xs text-[hsl(var(--foreground))] tabular-nums">
          {formatDate(row.original.dueDate)}
        </span>
      ),
    },
    {
      accessorKey: "grandTotal",
      header: () => <div className="text-right">Grand Total</div>,
      cell: ({ row }) => (
        <div className="text-right font-semibold tabular-nums text-xs text-[hsl(var(--foreground))]">
          {formatINR(row.original.grandTotal)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const inv = row.original;
        const isOverdue =
          inv.status === "CONFIRMED" &&
          new Date(inv.dueDate) < new Date() &&
          inv.grandTotal > inv.amountPaid;

        if (inv.status === "PAID") {
          return (
            <Badge variant="paid" className="text-[10px] py-0 px-2 font-medium">
              Paid
            </Badge>
          );
        }
        if (isOverdue) {
          return (
            <Badge variant="overdue" className="text-[10px] py-0 px-2 font-medium">
              Overdue
            </Badge>
          );
        }
        return (
          <Badge variant="active" className="text-[10px] py-0 px-2 font-medium">
            Pending
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedInvoice(row.original)}
            className="h-6 text-[11px] px-2"
          >
            <PrinterIcon size={12} className="mr-1" />
            View & Print
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Customer Account Banner ─────────────────────────────────────── */}
      <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-[hsl(var(--foreground))]">
                {customer.companyName}
              </h1>
              <Badge variant="active" className="text-[10px] py-0 px-1.5">
                Active Account
              </Badge>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
              Contact: {customer.name} · {customer.email} · GSTIN: {customer.taxId || "Not Registered"}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs border-t sm:border-t-0 sm:border-l border-[hsl(var(--border))] pt-3 sm:pt-0 sm:pl-4">
            <div>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider block">
                Monthly Spend
              </span>
              <span className="text-sm font-bold tabular-nums text-[hsl(var(--foreground))]">
                {formatINR(totalMonthlySpend)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider block">
                Outstanding Balance
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  totalOutstanding > 0
                    ? "text-[hsl(var(--status-overdue-ink))]"
                    : "text-[hsl(var(--status-active-ink))]"
                }`}
              >
                {formatINR(totalOutstanding)}
              </span>
            </div>
          </div>
        </div>

        {/* Overdue alert if applicable */}
        {overdueInvoices.length > 0 && (
          <div className="mt-4 rounded-[var(--radius-xs)] border border-[hsl(var(--status-overdue-ink))]/30 bg-[hsl(var(--status-overdue-ink))]/10 p-3 flex items-center justify-between text-xs text-[hsl(var(--foreground))]">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon size={14} className="text-[hsl(var(--status-overdue-ink))]" />
              <span>
                You have {overdueInvoices.length} overdue invoice requiring attention.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab("invoices")}
              className="h-6 text-[11px] px-2.5"
            >
              Review Invoices
            </Button>
          </div>
        )}
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-[hsl(var(--border))] pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("subscriptions")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "subscriptions"
              ? "border-[hsl(var(--foreground))] text-[hsl(var(--foreground))] font-semibold"
              : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          }`}
        >
          <SubscriptionIcon size={14} />
          <span>Active Subscriptions ({subscriptions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "invoices"
              ? "border-[hsl(var(--foreground))] text-[hsl(var(--foreground))] font-semibold"
              : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          }`}
        >
          <InvoiceIcon size={14} />
          <span>Invoice History ({invoices.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("billing")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "billing"
              ? "border-[hsl(var(--foreground))] text-[hsl(var(--foreground))] font-semibold"
              : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          }`}
        >
          <CreditCardIcon size={14} />
          <span>Payment & Billing Details</span>
        </button>
      </div>

      {/* ── TAB 1: Subscriptions Overview ──────────────────────────────── */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map((sub) => (
              <Card key={sub.id} className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        {sub.productName}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {sub.planName} · {sub.number}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={sub.status === "ACTIVE" ? "active" : "neutral"}
                      className="text-[10px] py-0 px-2"
                    >
                      {sub.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))]">
                      <span>Licenses / Seats:</span>
                      <span className="font-medium text-[hsl(var(--foreground))] tabular-nums">
                        {sub.quantity} {sub.quantity === 1 ? "seat" : "seats"} @ {formatINR(sub.unitPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))]">
                      <span>Monthly Recurring Value:</span>
                      <span className="font-semibold text-[hsl(var(--foreground))] tabular-nums">
                        {formatINR(sub.monthlyLineValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))]">
                      <span>Next Scheduled Billing:</span>
                      <span className="font-medium text-[hsl(var(--foreground))] tabular-nums">
                        {formatDate(sub.nextBillingDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))]">
                      <span>Payment Terms:</span>
                      <span className="text-[hsl(var(--foreground))]">
                        Net {sub.paymentTermsDays} days
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                      <ClockIcon size={12} />
                      Active since {formatDate(sub.startDate)}
                    </span>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                        Manage Plan
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: Invoice History ─────────────────────────────────────── */}
      {activeTab === "invoices" && (
        <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[hsl(var(--foreground))]">
              Invoices & Statements
            </CardTitle>
            <CardDescription className="text-xs">
              Complete statement history with gapless invoice sequencing (FR-INV-01)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={invoiceColumns}
              data={invoices}
              isLoading={isLoading}
              searchPlaceholder="Search invoices by number..."
              emptyTitle="No invoices found"
              emptyDescription="Your account does not have any billing statements issued yet."
              pageSize={10}
            />
          </CardContent>
        </Card>
      )}

      {/* ── TAB 3: Payment & Billing Profile ────────────────────────────── */}
      {activeTab === "billing" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Payment Channel & Wire Details
              </CardTitle>
              <CardDescription className="text-xs">
                Brightloop Software settlement account for NEFT, RTGS & UPI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Beneficiary Name:</span>
                  <span className="font-semibold text-[hsl(var(--foreground))]">Brightloop Software India Pvt Ltd</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Bank Name:</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">HDFC Bank, Bengaluru</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Account Number:</span>
                  <span className="font-mono font-medium text-[hsl(var(--foreground))]">50200088921844</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">IFSC Code:</span>
                  <span className="font-mono font-medium text-[hsl(var(--foreground))]">HDFC0001234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">UPI VPA:</span>
                  <span className="font-mono font-medium text-[hsl(var(--foreground))]">brightloop@hdfcbank</span>
                </div>
              </div>

              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                All bank transfers are reconciled automatically using your unique customer ID reference.
              </p>
            </CardContent>
          </Card>

          <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Registered Billing Information
              </CardTitle>
              <CardDescription className="text-xs">
                Official entity details printed on GST-compliant tax invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Legal Entity:</span>
                  <span className="font-semibold text-[hsl(var(--foreground))]">{customer.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">GSTIN:</span>
                  <span className="font-mono font-medium text-[hsl(var(--foreground))]">{customer.taxId || "Not Registered"}</span>
                </div>
                <div>
                  <span className="text-[hsl(var(--muted-foreground))] block mb-1">Billing Address:</span>
                  <span className="font-medium text-[hsl(var(--foreground))] leading-relaxed">
                    {customer.billingAddress}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--status-active-ink))]">
                <CheckIcon size={14} />
                <span>GST Tax Compliance Verified for FY 2026-27</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Invoice Print Preview Dialog ──────────────────────────────── */}
      <Dialog
        open={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice ? `Tax Invoice ${selectedInvoice.number}` : "Invoice"}
        wide
      >
        {selectedInvoice && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
              <div>
                <p className="font-semibold text-sm text-[hsl(var(--foreground))]">Brightloop Software India Pvt Ltd</p>
                <p className="text-[hsl(var(--muted-foreground))]">Billing & Recurring Services</p>
              </div>
              <div className="text-right">
                <Badge variant={selectedInvoice.status === "PAID" ? "paid" : "overdue"}>
                  {selectedInvoice.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase block">Billed To</span>
                <p className="font-medium text-[hsl(var(--foreground))]">{customer.companyName}</p>
                <p className="text-[hsl(var(--muted-foreground))]">{customer.billingAddress}</p>
                <p className="font-mono text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">GSTIN: {customer.taxId || "Unregistered"}</p>
              </div>
              <div className="space-y-1 text-right">
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Issue Date: </span>
                  <span className="font-medium">{formatDate(selectedInvoice.issueDate)}</span>
                </div>
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Due Date: </span>
                  <span className="font-medium">{formatDate(selectedInvoice.dueDate)}</span>
                </div>
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Service Period: </span>
                  <span className="font-medium">{formatDate(selectedInvoice.periodStart)} – {formatDate(selectedInvoice.periodEnd)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[hsl(var(--muted))]/50 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                  <tr>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                    <th className="p-2.5 text-right">GST (18%)</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  <tr>
                    <td className="p-2.5">
                      <p className="font-medium text-[hsl(var(--foreground))]">Brightloop Subscription Recurring Charge</p>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Service period charges</p>
                    </td>
                    <td className="p-2.5 text-right tabular-nums">{formatINR(selectedInvoice.subtotal)}</td>
                    <td className="p-2.5 text-right tabular-nums">{formatINR(selectedInvoice.taxTotal)}</td>
                    <td className="p-2.5 text-right font-semibold tabular-nums">{formatINR(selectedInvoice.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5"
              >
                <PrinterIcon size={14} />
                Print Statement
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
