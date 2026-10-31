"use client";

import React, { useState } from "react";
import { trpc } from "@/shared/trpc/react";
import { toISODate } from "@/shared/lib/dates";

interface SubscriptionCreateFormProps {
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
}

export function SubscriptionCreateForm({ onSuccess, onCancel }: SubscriptionCreateFormProps) {
  const [mode, setMode] = useState<"standard" | "template">("standard");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Common fields
  const [customerId, setCustomerId] = useState("");
  const [startDate, setStartDate] = useState(toISODate(new Date()));
  const [paymentTermsDays, setPaymentTermsDays] = useState(15);

  // Mode: Template
  const [templateId, setTemplateId] = useState("");

  // Mode: Standard
  const [planId, setPlanId] = useState("");
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return toISODate(d);
  });
  const [lines, setLines] = useState<Array<{ variantId: string; quantity: number; unitPrice: number }>>([
    { variantId: "", quantity: 1, unitPrice: 0 },
  ]);

  const utils = trpc.useUtils();

  const createMutation = trpc.subscriptions.create.useMutation({
    onSuccess: (data) => {
      utils.subscriptions.list.invalidate();
      if (data) onSuccess?.(data.id);
    },
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });

  const createFromTemplateMutation = trpc.subscriptions.createFromTemplate.useMutation({
    onSuccess: (data) => {
      utils.subscriptions.list.invalidate();
      if (data) onSuccess?.(data.id);
    },
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerId) {
      setErrorMessage("Please enter a valid Customer ID.");
      return;
    }

    if (mode === "template") {
      if (!templateId) {
        setErrorMessage("Please enter a valid Template ID.");
        return;
      }
      createFromTemplateMutation.mutate({
        customerId,
        templateId,
        startDate: new Date(startDate),
        paymentTermsDays,
      });
    } else {
      if (!planId) {
        setErrorMessage("Please enter a valid Plan ID.");
        return;
      }
      if (lines.length === 0 || lines.some((l) => !l.variantId)) {
        setErrorMessage("Please specify at least one line with a valid Variant ID.");
        return;
      }

      createMutation.mutate({
        customerId,
        planId,
        startDate: new Date(startDate),
        expiryDate: new Date(expiryDate),
        paymentTermsDays,
        lines,
      });
    }
  };

  const handleAddLine = () => {
    setLines([...lines, { variantId: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const isPending = createMutation.isPending || createFromTemplateMutation.isPending;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">New Subscription</h2>
          <p className="text-xs text-slate-500">
            Create a custom subscription or instantiate an existing quotation template.
          </p>
        </div>
        <div className="flex rounded-md border border-slate-200 p-0.5 bg-slate-50">
          <button
            type="button"
            onClick={() => setMode("standard")}
            className={`rounded px-3 py-1 text-xs font-medium ${
              mode === "standard"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Custom Subscription
          </button>
          <button
            type="button"
            onClick={() => setMode("template")}
            className={`rounded px-3 py-1 text-xs font-medium ${
              mode === "template"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            From Template (FR-QT-02)
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <strong>Validation Error:</strong> {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
        {/* Customer ID */}
        <div>
          <label className="block font-medium text-slate-700">Customer UUID</label>
          <input
            type="text"
            required
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="e.g. 12345678-1234-1234-1234-123456789abc"
            className="mt-1 w-full rounded-md border border-slate-300 p-2 font-mono text-xs focus:border-slate-500 focus:outline-none"
          />
        </div>

        {mode === "template" ? (
          <div>
            <label className="block font-medium text-slate-700">Quotation Template UUID</label>
            <input
              type="text"
              required
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              placeholder="e.g. template UUID from templates table"
              className="mt-1 w-full rounded-md border border-slate-300 p-2 font-mono text-xs focus:border-slate-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Lines and plan are auto-populated from the quotation template.
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="block font-medium text-slate-700">Plan UUID</label>
              <input
                type="text"
                required
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                placeholder="e.g. plan UUID from plans table"
                className="mt-1 w-full rounded-md border border-slate-300 p-2 font-mono text-xs focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-medium text-slate-700">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs focus:border-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700">Payment Terms (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={paymentTermsDays}
                  onChange={(e) => setPaymentTermsDays(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs focus:border-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-slate-900">Line Items</label>
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  + Add Line
                </button>
              </div>

              <div className="space-y-2">
                {lines.map((line, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Product Variant UUID"
                      value={line.variantId}
                      onChange={(e) => {
                        const next = [...lines];
                        next[idx].variantId = e.target.value;
                        setLines(next);
                      }}
                      className="flex-1 rounded-md border border-slate-300 p-2 font-mono text-xs"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => {
                        const next = [...lines];
                        next[idx].quantity = parseInt(e.target.value, 10) || 1;
                        setLines(next);
                      }}
                      className="w-16 rounded-md border border-slate-300 p-2 text-xs"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Unit Price"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) => {
                        const next = [...lines];
                        next[idx].unitPrice = parseFloat(e.target.value) || 0;
                        setLines(next);
                      }}
                      className="w-24 rounded-md border border-slate-300 p-2 text-xs"
                      required
                    />
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Start Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-medium text-slate-700">Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs focus:border-slate-500 focus:outline-none"
            />
          </div>
          {mode === "template" && (
            <div>
              <label className="block font-medium text-slate-700">Payment Terms (Days)</label>
              <input
                type="number"
                min="0"
                value={paymentTermsDays}
                onChange={(e) => setPaymentTermsDays(parseInt(e.target.value, 10) || 0)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs focus:border-slate-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isPending ? "Creating..." : mode === "template" ? "Instantiate Template" : "Create Subscription"}
          </button>
        </div>
      </form>
    </div>
  );
}

