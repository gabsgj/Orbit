"use client";

import React, { useState } from "react";
import { trpc } from "@/shared/trpc/react";
import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";
import { SubscriptionTimeline } from "./SubscriptionTimeline";
import { Badge, statusTone, EmptyState } from "@/shared/ui";
import { formatINR, formatDate } from "@/shared/lib/money";
import type { SubscriptionStatus } from "@prisma/client";

interface SubscriptionDetailProps {
  subscriptionId: string;
  onBack?: () => void;
}

export function SubscriptionDetail({ subscriptionId, onBack }: SubscriptionDetailProps) {
  const [activeTab, setActiveTab] = useState<"lines" | "timeline" | "invoices">("lines");
  const [actionError, setActionError] = useState<string | null>(null);
  const [transitionNote, setTransitionNote] = useState<string>("");
  const [pendingStatus, setPendingStatus] = useState<SubscriptionStatus | null>(null);

  const utils = trpc.useUtils();

  const { data: sub, isLoading, isError, error } = trpc.subscriptions.get.useQuery({
    id: subscriptionId,
  });



  const transitionMutation = trpc.subscriptions.transition.useMutation({
    onSuccess: () => {
      setPendingStatus(null);
      setTransitionNote("");
      setActionError(null);
      utils.subscriptions.get.invalidate({ id: subscriptionId });
      utils.subscriptions.list.invalidate();
      utils.subscriptions.timeline.invalidate({ id: subscriptionId });
    },
    onError: (err) => {
      setActionError(err.message);
    },
  });

  const renewMutation = trpc.subscriptions.renew.useMutation({
    onSuccess: () => {
      setActionError(null);
      utils.subscriptions.get.invalidate({ id: subscriptionId });
      utils.subscriptions.list.invalidate();
      utils.subscriptions.timeline.invalidate({ id: subscriptionId });
    },
    onError: (err) => {
      setActionError(err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-[hsl(var(--muted))]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="h-32 rounded-[var(--radius-lg)] bg-[hsl(var(--muted))]" />
          <div className="h-32 rounded-[var(--radius-lg)] bg-[hsl(var(--muted))]" />
          <div className="h-32 rounded-[var(--radius-lg)] bg-[hsl(var(--muted))]" />
        </div>
      </div>
    );
  }

  if (isError || !sub) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--status-overdue-ink))]/30 bg-[hsl(var(--status-overdue-bg))] p-6 text-center">
        <p className="text-sm font-medium text-[hsl(var(--status-overdue-ink))]">
          Error loading subscription: {error?.message ?? "Not found"}
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-4 rounded-full bg-[hsl(var(--card))] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--foreground))] shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            ← Back to Subscriptions
          </button>
        )}
      </div>
    );
  }

  const handleConfirmTransition = () => {
    if (!pendingStatus) return;
    setActionError(null);
    transitionMutation.mutate({
      subscriptionId: sub.id,
      toStatus: pendingStatus,
      note: transitionNote.trim() || undefined,
    });
  };

  const handleRenew = () => {
    if (confirm(`Extend subscription expiry by 1 ${sub.plan.period.toLowerCase()} period?`)) {
      setActionError(null);
      renewMutation.mutate({
        subscriptionId: sub.id,
        note: `Manual renewal extension`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full ring-1 ring-[hsl(var(--border))] bg-[hsl(var(--card))] p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] text-xs font-medium transition-colors"
            >
              ← Back
            </button>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">{sub.number}</h1>
              <SubscriptionStatusBadge status={sub.status} />
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              {sub.customer.companyName} · Created {formatDate(sub.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons for Allowed State Transitions */}
        <div className="flex flex-wrap items-center gap-2">
          {sub.status === "DRAFT" && (
            <>
              <button
                type="button"
                onClick={() => setPendingStatus("QUOTATION")}
                className="rounded-full bg-[hsl(var(--primary))] px-4 py-1.5 text-xs font-medium text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-soft)] hover:bg-[hsl(var(--primary))]/90 transition-colors"
              >
                Send Quotation →
              </button>
              <button
                type="button"
                onClick={() => setPendingStatus("CLOSED")}
                className="rounded-full ring-1 ring-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                Abandon
              </button>
            </>
          )}

          {sub.status === "QUOTATION" && (
            <>
              <button
                type="button"
                onClick={() => setPendingStatus("CONFIRMED")}
                className="rounded-full bg-[hsl(var(--status-active-ink))] px-4 py-1.5 text-xs font-medium text-white shadow-[var(--shadow-soft)] hover:opacity-90 transition-colors"
              >
                Confirm Order ✓
              </button>
              <button
                type="button"
                onClick={() => setPendingStatus("CLOSED")}
                className="rounded-full ring-1 ring-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                Reject
              </button>
            </>
          )}

          {sub.status === "CONFIRMED" && (
            <>
              <button
                type="button"
                onClick={() => setPendingStatus("ACTIVE")}
                className="rounded-full bg-[hsl(var(--status-active-ink))] px-4 py-1.5 text-xs font-medium text-white shadow-[var(--shadow-soft)] hover:opacity-90 transition-colors"
              >
                Activate Subscription ▶
              </button>
              {sub.plan.renewable && (
                <button
                  type="button"
                  onClick={handleRenew}
                  disabled={renewMutation.isPending}
                  className="rounded-full ring-1 ring-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  Renew Period ⟳
                </button>
              )}
              <button
                type="button"
                onClick={() => setPendingStatus("CLOSED")}
                className="rounded-full ring-1 ring-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          {sub.status === "ACTIVE" && (
            <>
              {sub.plan.pausable && (
                <button
                  type="button"
                  onClick={() => setPendingStatus("PAUSED")}
                  className="rounded-full bg-[hsl(var(--status-warning-ink))] px-4 py-1.5 text-xs font-medium text-white shadow-[var(--shadow-soft)] hover:opacity-90 transition-colors"
                >
                  Pause ⏸
                </button>
              )}
              {sub.plan.renewable && (
                <button
                  type="button"
                  onClick={handleRenew}
                  disabled={renewMutation.isPending}
                  className="rounded-full ring-1 ring-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  Renew Period ⟳
                </button>
              )}
              {sub.plan.closableEarly && (
                <button
                  type="button"
                  onClick={() => setPendingStatus("CLOSED")}
                  className="rounded-full ring-1 ring-[hsl(var(--status-overdue-ink))]/30 bg-[hsl(var(--card))] px-4 py-1.5 text-xs font-medium text-[hsl(var(--status-overdue-ink))] hover:bg-[hsl(var(--status-overdue-bg))] transition-colors"
                >
                  Close Early ✕
                </button>
              )}
            </>
          )}

          {sub.status === "PAUSED" && (
            <>
              <button
                type="button"
                onClick={() => setPendingStatus("ACTIVE")}
                className="rounded-full bg-[hsl(var(--status-active-ink))] px-4 py-1.5 text-xs font-medium text-white shadow-[var(--shadow-soft)] hover:opacity-90 transition-colors"
              >
                Resume ▶
              </button>
              {sub.plan.closableEarly && (
                <button
                  type="button"
                  onClick={() => setPendingStatus("CLOSED")}
                  className="rounded-full ring-1 ring-[hsl(var(--status-overdue-ink))]/30 bg-[hsl(var(--card))] px-4 py-1.5 text-xs font-medium text-[hsl(var(--status-overdue-ink))] hover:bg-[hsl(var(--status-overdue-bg))] transition-colors"
                >
                  Close Early ✕
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action Error Message */}
      {actionError && (
        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--status-overdue-ink))]/30 bg-[hsl(var(--status-overdue-bg))] p-3 text-xs text-[hsl(var(--status-overdue-ink))]">
          <strong>Action Failed:</strong> {actionError}
        </div>
      )}

      {/* Transition Confirmation Box */}
      {pendingStatus && (
        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--foreground))]">
              Confirm Status Change: {sub.status} → {pendingStatus}
            </h4>
            <button
              type="button"
              onClick={() => {
                setPendingStatus(null);
                setTransitionNote("");
              }}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-xs"
            >
              Cancel ✕
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">
              Audit Note (optional)
            </label>
            <input
              type="text"
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
              placeholder="Reason for status change..."
              className="w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-xs focus:border-[hsl(var(--ring))] focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setPendingStatus(null);
                setTransitionNote("");
              }}
              className="rounded-full ring-1 ring-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmTransition}
              disabled={transitionMutation.isPending}
              className="rounded-full bg-[hsl(var(--primary))] px-4 py-1.5 text-xs font-medium text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-soft)] hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50 transition-colors"
            >
              {transitionMutation.isPending ? "Applying..." : "Confirm Transition"}
            </button>
          </div>
        </div>
      )}

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Customer Info */}
        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Customer
          </h3>
          <p className="mt-2 text-sm font-semibold text-[hsl(var(--foreground))]">
            {sub.customer.companyName}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{sub.customer.user.email}</p>
          {sub.customer.billingAddress && (
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">
              {sub.customer.billingAddress}
            </p>
          )}
          {sub.customer.taxId && (
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Tax ID: {sub.customer.taxId}</p>
          )}
        </div>

        {/* Plan Info */}
        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Plan Details
          </h3>
          <p className="mt-2 text-sm font-semibold text-[hsl(var(--foreground))]">
            {sub.plan.product.name}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize">
            {sub.plan.period.toLowerCase()} · {formatINR(sub.plan.price)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
            {sub.plan.pausable && (
              <span className="rounded-full bg-[hsl(var(--tint-blue))] px-2 py-0.5 text-[hsl(var(--tint-blue-ink))]">Pausable</span>
            )}
            {sub.plan.renewable && (
              <span className="rounded-full bg-[hsl(var(--tint-green))] px-2 py-0.5 text-[hsl(var(--tint-green-ink))]">Renewable</span>
            )}
            {sub.plan.closableEarly && (
              <span className="rounded-full bg-[hsl(var(--tint-amber))] px-2 py-0.5 text-[hsl(var(--tint-amber-ink))]">Closable Early</span>
            )}
            {sub.plan.autoClose && (
              <span className="rounded-full bg-[hsl(var(--tint-lavender))] px-2 py-0.5 text-[hsl(var(--tint-lavender-ink))]">Auto Close</span>
            )}
          </div>
        </div>

        {/* Schedule & Billing */}
        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Schedule & Terms
          </h3>
          <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            <dt className="text-[hsl(var(--muted-foreground))]">Start Date:</dt>
            <dd className="font-medium text-[hsl(var(--foreground))]">{formatDate(sub.startDate)}</dd>
            <dt className="text-[hsl(var(--muted-foreground))]">Expiry Date:</dt>
            <dd className="font-medium text-[hsl(var(--foreground))]">{formatDate(sub.expiryDate)}</dd>
            <dt className="text-[hsl(var(--muted-foreground))]">Next Billing:</dt>
            <dd className="font-medium text-[hsl(var(--foreground))]">{formatDate(sub.nextBillingDate)}</dd>
            <dt className="text-[hsl(var(--muted-foreground))]">Payment Terms:</dt>
            <dd className="font-medium text-[hsl(var(--foreground))]">Net {sub.paymentTermsDays} days</dd>
          </dl>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="border-b border-[hsl(var(--border))]">
          <nav className="-mb-px flex space-x-6">
            <button
              type="button"
              onClick={() => setActiveTab("lines")}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "lines"
                  ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))] font-semibold"
                  : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              Contract Lines ({sub.lines.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("timeline")}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "timeline"
                  ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))] font-semibold"
                  : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              Activity Timeline
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("invoices")}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "invoices"
                  ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))] font-semibold"
                  : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              Invoices ({sub.invoices.length})
            </button>
          </nav>
        </div>

        {/* Tab 1: Lines */}
        {activeTab === "lines" && (
          <div className="mt-4 overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-soft)]">
            <table className="min-w-full divide-y divide-[hsl(var(--border))] text-left text-xs">
              <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Product Variant</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Quantity</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Unit Price</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]/50 text-[hsl(var(--foreground))]">
                {sub.lines.map((line) => {
                  const qty = line.quantity;
                  const price = Number(line.unitPrice);
                  const total = qty * price;
                  return (
                    <tr key={line.id}>
                      <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">
                        {line.variant.product.name}{" "}
                        <span className="text-[hsl(var(--muted-foreground))]">
                          ({line.variant.attributeValue.value})
                        </span>
                      </td>
                      <td className="px-4 py-3">{qty}</td>
                      <td className="px-4 py-3 tabular-nums">{formatINR(price)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[hsl(var(--foreground))] tabular-nums">
                        {formatINR(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Activity Timeline */}
        {activeTab === "timeline" && (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-soft)]">
            <SubscriptionTimeline subscriptionId={subscriptionId} />
          </div>
        )}

        {/* Tab 3: Invoices */}
        {activeTab === "invoices" && (
          <div className="mt-4 overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-soft)]">
            {sub.invoices.length === 0 ? (
              <EmptyState
                title="No invoices yet"
                description="No invoices generated for this subscription yet."
              />
            ) : (
              <table className="min-w-full divide-y divide-[hsl(var(--border))] text-left text-xs">
                <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Invoice #</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Issue Date</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Due Date</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]/50 text-[hsl(var(--foreground))]">
                  {sub.invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{inv.number}</td>
                      <td className="px-4 py-3">{formatDate(inv.issueDate)}</td>
                      <td className="px-4 py-3">{formatDate(inv.dueDate)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone[inv.status] ?? "neutral"} dot>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[hsl(var(--foreground))] tabular-nums">
                        {formatINR(inv.grandTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
