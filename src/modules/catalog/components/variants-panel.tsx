"use client";

import * as React from "react";
import { api } from "@/shared/trpc/react";
import { Button, Input, Skeleton } from "@/shared/ui";
import { CheckIcon, PlusIcon } from "@/shared/ui/icons";

interface VariantsPanelProps {
  productId: string;
}

/**
 * Inline variant manager for a single product (FR-CAT-02).
 * Lists variants with editable priceExtra, plus an "add variant" row that
 * picks an attribute value from the shared attributes.list query.
 *
 * Delete-less by design: variants may be referenced by historical subscription
 * lines, quotation template lines, and invoice lines. Removing a variant would
 * break referential integrity on those snapshots (no cascade). The DB is the
 * last line of defense — variants can be corrected via priceExtra edits but
 * never deleted from the UI.
 */
export function VariantsPanel({ productId }: VariantsPanelProps) {
  const utils = api.useUtils();

  // ── Queries ──────────────────────────────────────────────────────────────
  const variantsQuery = api.catalog.variants.listByProduct.useQuery({ productId });
  const attributesQuery = api.catalog.attributes.list.useQuery();

  // ── Mutations ────────────────────────────────────────────────────────────
  const setPriceExtraMutation = api.catalog.variants.setPriceExtra.useMutation({
    onSuccess: () => {
      utils.catalog.variants.listByProduct.invalidate({ productId });
      utils.catalog.products.list.invalidate();
    },
  });

  const createForProductMutation = api.catalog.variants.createForProduct.useMutation({
    onSuccess: () => {
      utils.catalog.variants.listByProduct.invalidate({ productId });
      utils.catalog.products.list.invalidate();
      setNewValueId("");
      setNewPriceExtra("0");
      setAddError(null);
    },
    onError: (err) => setAddError(err.message),
  });

  // ── Inline-edit state (per-variant draft prices) ─────────────────────────
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);

  // ── Add-variant row state ────────────────────────────────────────────────
  const [newValueId, setNewValueId] = React.useState("");
  const [newPriceExtra, setNewPriceExtra] = React.useState("0");
  const [addError, setAddError] = React.useState<string | null>(null);

  function startEdit(variantId: string, current: string) {
    setDrafts((d) => ({ ...d, [variantId]: current }));
    setSavingId(null);
  }

  function cancelEdit(variantId: string) {
    setDrafts((d) => {
      const next = { ...d };
      delete next[variantId];
      return next;
    });
    setSavingId(null);
  }

  async function savePrice(variantId: string) {
    const raw = drafts[variantId];
    if (raw === undefined) return;
    const parsed = parseFloat(raw);
    if (isNaN(parsed) || parsed < 0) return;
    setSavingId(variantId);
    try {
      await setPriceExtraMutation.mutateAsync({ variantId, priceExtra: parsed });
      cancelEdit(variantId);
    } finally {
      setSavingId(null);
    }
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newValueId) {
      setAddError("Select an attribute value");
      return;
    }
    const parsed = parseFloat(newPriceExtra);
    if (isNaN(parsed) || parsed < 0) {
      setAddError("Price extra must be ≥ 0");
      return;
    }
    setAddError(null);
    createForProductMutation.mutate({
      productId,
      attributeValueId: newValueId,
      priceExtra: parsed,
    });
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const existingValueIds = new Set(
    (variantsQuery.data ?? []).map((v) => v.attributeValueId),
  );

  const availableValues = (attributesQuery.data ?? []).flatMap((attr) =>
    attr.values
      .filter((v) => !existingValueIds.has(v.id))
      .map((v) => ({ id: v.id, label: `${attr.name}: ${v.value}` })),
  );

  // ── Render ───────────────────────────────────────────────────────────────
  if (variantsQuery.isLoading || attributesQuery.isLoading) {
    return (
      <div className="space-y-2 p-2">
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-7 w-3/4" />
      </div>
    );
  }

  const variants = variantsQuery.data ?? [];

  return (
    <div className="space-y-2">
      {/* Existing variants */}
      {variants.length === 0 ? (
        <p className="text-[11px] text-[hsl(var(--muted-foreground))] italic px-1">
          No variants yet — add one below.
        </p>
      ) : (
        <div className="space-y-1">
          {variants.map((v) => {
            const draft = drafts[v.id];
            const isEditing = draft !== undefined;
            const current = Number(v.priceExtra).toFixed(2);
            const isSaving = savingId === v.id && setPriceExtraMutation.isPending;

            return (
              <div
                key={v.id}
                className="flex items-center justify-between gap-2 rounded-[var(--radius-xs)] bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-2 py-1.5"
              >
                <span className="text-[11px] text-[hsl(var(--foreground))] min-w-0 truncate">
                  <span className="font-medium">{v.attributeValue.attribute.name}:</span>{" "}
                  {v.attributeValue.value}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isEditing ? (
                    <>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [v.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") savePrice(v.id);
                          if (e.key === "Escape") cancelEdit(v.id);
                        }}
                        className="h-6 w-20 text-[11px] tabular-nums px-1.5 py-0"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => savePrice(v.id)}
                        disabled={isSaving}
                        className="text-[hsl(var(--status-active-ink))] hover:opacity-80 disabled:opacity-40"
                        aria-label="Save price"
                      >
                        <CheckIcon size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelEdit(v.id)}
                        className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-[11px] leading-none"
                        aria-label="Cancel"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(v.id, current)}
                      className="text-[11px] tabular-nums font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--chart-1))] transition-colors"
                      title="Click to edit price extra"
                    >
                      {Number(v.priceExtra) > 0 ? `+₹${current}` : "₹0.00"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add-variant row */}
      {availableValues.length > 0 && (
        <form
          onSubmit={handleAdd}
          className="flex items-center gap-1.5 rounded-[var(--radius-xs)] border border-dashed border-[hsl(var(--border))] px-2 py-1.5"
        >
          <select
            value={newValueId}
            onChange={(e) => setNewValueId(e.target.value)}
            className="h-6 flex-1 min-w-0 rounded border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
          >
            <option value="">Select value…</option>
            {availableValues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={newPriceExtra}
            onChange={(e) => setNewPriceExtra(e.target.value)}
            placeholder="+₹0"
            className="h-6 w-16 text-[11px] tabular-nums px-1.5 py-0"
          />
          <Button
            type="submit"
            size="sm"
            disabled={createForProductMutation.isPending}
            className="h-6 px-1.5 text-[11px] gap-0.5"
          >
            <PlusIcon size={10} />
            Add
          </Button>
        </form>
      )}

      {addError && (
        <p className="text-[11px] text-[hsl(var(--status-overdue-ink))] px-1">
          {addError}
        </p>
      )}
    </div>
  );
}
