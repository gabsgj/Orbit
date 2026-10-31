"use client";

import React, { useState } from "react";
import { trpc } from "@/shared/trpc/react";
import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";
import { SubscriptionTimeline } from "./SubscriptionTimeline";
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
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="h-32 rounded-lg bg-slate-100" />
          <div className="h-32 rounded-lg bg-slate-100" />
          <div className="h-32 rounded-lg bg-slate-100" />
        </div>
      </div>
    );
  }

  if (isError || !sub) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-800">
          Error loading subscription: {error?.message ?? "Not found"}
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-4 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm border border-slate-200"
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
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 text-xs font-medium"
            >
              ← Back
            </button>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{sub.number}</h1>
              <SubscriptionStatusBadge status={sub.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
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
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Send Quotation →
              </button>
              <button
                type="button"
                onClick={() => setPendingStatus("CLOSED")}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
                className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
              >
                Confirm Order ✓
              </button>
              <button
                type="button"
                onClick={() => setPendingStatus("CLOSED")}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
                className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
              >
                Activate Subscription ▶
              </button>
              {sub.plan.renewable && (
                <button
                  type="button"
                  onClick={handleRenew}
                  disabled={renewMutation.isPending}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Renew Period ⟳
                </button>
              )}
              <button
                type="button"
                onClick={() => setPendingStatus("CLOSED")}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
                  className="rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-amber-700"
                >
                  Pause ⏸
                </button>
              )}
              {sub.plan.renewable && (
                <button
                  type="button"
                  onClick={handleRenew}
                  disabled={renewMutation.isPending}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Renew Period ⟳
                </button>
              )}
              {sub.plan.closableEarly && (
                <button
                  type="button"
                  onClick={() => setPendingStatus("CLOSED")}
                  className="rounded-lg border border-red-300 bg-white px-3.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
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
                className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
              >
                Resume ▶
              </button>
              {sub.plan.closableEarly && (
                <button
                  type="button"
                  onClick={() => setPendingStatus("CLOSED")}
                  className="rounded-lg border border-red-300 bg-white px-3.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <strong>Action Failed:</strong> {actionError}
        </div>
      )}

      {/* Transition Confirmation Box */}
      {pendingStatus && (
        <div className="rounded-lg border border-slate-300 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Confirm Status Change: {sub.status} → {pendingStatus}
            </h4>
            <button
              type="button"
              onClick={() => {
                setPendingStatus(null);
                setTransitionNote("");
              }}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              Cancel ✕
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Audit Note (optional)
            </label>
            <input
              type="text"
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
              placeholder="Reason for status change..."
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setPendingStatus(null);
                setTransitionNote("");
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmTransition}
              disabled={transitionMutation.isPending}
              className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {transitionMutation.isPending ? "Applying..." : "Confirm Transition"}
            </button>
          </div>
        </div>
      )}

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Customer Info */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Customer
          </h3>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {sub.customer.companyName}
          </p>
          <p className="text-xs text-slate-500">{sub.customer.user.email}</p>
          {sub.customer.billingAddress && (
            <p className="mt-2 text-xs text-slate-600 line-clamp-2">
              {sub.customer.billingAddress}
            </p>
          )}
          {sub.customer.taxId && (
            <p className="mt-1 text-xs text-slate-500">Tax ID: {sub.customer.taxId}</p>
          )}
        </div>

        {/* Plan Info */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Plan Details
          </h3>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {sub.plan.product.name}
          </p>
          <p className="text-xs text-slate-500 capitalize">
            {sub.plan.period.toLowerCase()} · {formatINR(sub.plan.price)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
            {sub.plan.pausable && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">Pausable</span>
            )}
            {sub.plan.renewable && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">Renewable</span>
            )}
            {sub.plan.closableEarly && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">Closable Early</span>
            )}
            {sub.plan.autoClose && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">Auto Close</span>
            )}
          </div>
        </div>

        {/* Schedule & Billing */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Schedule & Terms
          </h3>
          <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            <dt className="text-slate-500">Start Date:</dt>
            <dd className="font-medium text-slate-900">{formatDate(sub.startDate)}</dd>
            <dt className="text-slate-500">Expiry Date:</dt>
            <dd className="font-medium text-slate-900">{formatDate(sub.expiryDate)}</dd>
            <dt className="text-slate-500">Next Billing:</dt>
            <dd className="font-medium text-slate-900">{formatDate(sub.nextBillingDate)}</dd>
            <dt className="text-slate-500">Payment Terms:</dt>
            <dd className="font-medium text-slate-900">Net {sub.paymentTermsDays} days</dd>
          </dl>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-6">
            <button
              type="button"
              onClick={() => setActiveTab("lines")}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "lines"
                  ? "border-slate-900 text-slate-900 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Contract Lines ({sub.lines.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("timeline")}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "timeline"
                  ? "border-slate-900 text-slate-900 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Activity Timeline
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("invoices")}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "invoices"
                  ? "border-slate-900 text-slate-900 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Invoices ({sub.invoices.length})
            </button>
          </nav>
        </div>

        {/* Tab 1: Lines */}
        {activeTab === "lines" && (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Product Variant</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Quantity</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Unit Price</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sub.lines.map((line) => {
                  const qty = line.quantity;
                  const price = Number(line.unitPrice);
                  const total = qty * price;
                  return (
                    <tr key={line.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {line.variant.product.name}{" "}
                        <span className="text-slate-500">
                          ({line.variant.attributeValue.value})
                        </span>
                      </td>
                      <td className="px-4 py-3">{qty}</td>
                      <td className="px-4 py-3">{formatINR(price)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
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
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <SubscriptionTimeline subscriptionId={subscriptionId} />
          </div>
        )}

        {/* Tab 3: Invoices */}
        {activeTab === "invoices" && (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {sub.invoices.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No invoices generated for this subscription yet.
              </p>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Invoice #</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Issue Date</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Due Date</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sub.invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{inv.number}</td>
                      <td className="px-4 py-3">{formatDate(inv.issueDate)}</td>
                      <td className="px-4 py-3">{formatDate(inv.dueDate)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
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

