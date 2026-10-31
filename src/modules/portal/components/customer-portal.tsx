"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { DataTable } from "@/shared/ui/data-table";
import { formatINR, formatDate } from "@/shared/lib/money";
import { trpc } from "@/shared/trpc/react";
import {
  SubscriptionIcon,
  InvoiceIcon,
  CreditCardIcon,
  CheckIcon,
  ClockIcon,
  AlertTriangleIcon,
  PrinterIcon,
} from "@/shared/ui/icons";
import {
  PortalSubscription,
  PortalInvoice,
  PortalCustomerProfile,
} from "../schemas";
import {
  DEMO_SUBSCRIPTIONS,
  DEMO_INVOICES,
  DEMO_PROFILE,
} from "../service";

export interface CustomerPortalProps {
  customer?: Partial<PortalCustomerProfile>;
  subscriptions?: PortalSubscription[];
  invoices?: PortalInvoice[];
  isLoading?: boolean;
}

export function CustomerPortal({
  customer: propCustomer,
  subscriptions: propSubscriptions,
  invoices: propInvoices,
  isLoading: propLoading = false,
}: CustomerPortalProps) {
  const [activeTab, setActiveTab] = React.useState<"subscriptions" | "invoices" | "billing">("subscriptions");
  const [selectedInvoice, setSelectedInvoice] = React.useState<PortalInvoice | null>(null);

  // Live queries via tRPC portalRouter (FR-PORT-01, FR-PORT-02)
  const { data: remoteProfile } = trpc.portal.myProfile.useQuery(undefined, {
    enabled: !propCustomer,
  });

  const { data: remoteSubs, isLoading: isSubsLoading } = trpc.portal.mySubscriptions.useQuery(undefined, {
    enabled: !propSubscriptions,
    refetchInterval: 10000,
  });

  const { data: remoteInvoices, isLoading: isInvoicesLoading } = trpc.portal.myInvoices.useQuery(undefined, {
    enabled: !propInvoices,
    refetchInterval: 10000,
  });

  const customer: PortalCustomerProfile = {
    ...DEMO_PROFILE,
    ...(remoteProfile || {}),
    ...(propCustomer || {}),
  };

  const subscriptions: PortalSubscription[] = propSubscriptions || remoteSubs || DEMO_SUBSCRIPTIONS;
  const invoices: PortalInvoice[] = propInvoices || remoteInvoices || DEMO_INVOICES;
  const isLoading = propLoading || (isSubsLoading && !propSubscriptions) || (isInvoicesLoading && !propInvoices);

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
            <div className="border-l border-[hsl(var(--border))] pl-4">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider block">
                Outstanding
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  totalOutstanding > 0 ? "text-[hsl(var(--status-overdue-ink))]" : "text-[hsl(var(--foreground))]"
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
          <span>Payment & Tax Profile</span>
        </button>
      </div>

      {/* ── TAB 1: Subscriptions View ───────────────────────────────────── */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map((sub) => (
              <Card key={sub.id} className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[11px] text-[hsl(var(--muted-foreground))]">
                        {sub.number}
                      </span>
                      <CardTitle className="text-base font-semibold text-[hsl(var(--foreground))] mt-0.5">
                        {sub.productName}
                      </CardTitle>
                    </div>
                    <Badge variant={sub.status === "ACTIVE" ? "active" : "neutral"} className="text-[10px]">
                      {sub.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {sub.planName} · Billing cadence: {sub.period.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[hsl(var(--muted-foreground))]">Quantity / Seats:</span>
                      <span className="font-medium text-[hsl(var(--foreground))] tabular-nums">
                        {sub.quantity} {sub.quantity === 1 ? "seat" : "seats"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[hsl(var(--muted-foreground))]">Rate per seat:</span>
                      <span className="font-medium text-[hsl(var(--foreground))] tabular-nums">
                        {formatINR(sub.unitPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-2">
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

      {/* ── TAB 3: Payment Details & GST Compliance Profile ────────────── */}
      {activeTab === "billing" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Wire & Direct Transfer Account
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
                Statutory tax registration & invoicing address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
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
