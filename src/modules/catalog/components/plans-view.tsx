"use client";

import * as React from "react";
import { api } from "@/shared/trpc/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  EmptyState,
  Skeleton,
} from "@/shared/ui";
import { PlusIcon, TrashIcon } from "@/shared/ui/icons";

export function PlansView() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false);

  // Plan Form State
  const [productId, setProductId] = React.useState("");
  const [price, setPrice] = React.useState("999");
  const [period, setPeriod] = React.useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("MONTHLY");
  const [minQuantity, setMinQuantity] = React.useState("1");
  const [availableFrom, setAvailableFrom] = React.useState("2026-01-01");
  const [availableTo, setAvailableTo] = React.useState("2027-01-01");
  
  // Lifecycle flags (FR-CAT-04)
  const [autoClose, setAutoClose] = React.useState(false);
  const [closableEarly, setClosableEarly] = React.useState(true);
  const [pausable, setPausable] = React.useState(true);
  const [renewable, setRenewable] = React.useState(true);
  
  const [formError, setFormError] = React.useState<string | null>(null);

  const utils = api.useUtils();

  const { data, isLoading, error } = api.catalog.plans.list.useQuery({
    take: 50,
  });

  const productsQuery = api.catalog.products.list.useQuery({ take: 100, isActive: true });

  const createPlanMutation = api.catalog.plans.create.useMutation({
    onSuccess: () => {
      utils.catalog.plans.list.invalidate();
      setCreateModalOpen(false);
      resetForm();
    },
    onError: (err) => setFormError(err.message),
  });

  const archiveMutation = api.catalog.plans.archive.useMutation({
    onSuccess: () => utils.catalog.plans.list.invalidate(),
  });

  function resetForm() {
    setPrice("999");
    setPeriod("MONTHLY");
    setMinQuantity("1");
    setAutoClose(false);
    setClosableEarly(true);
    setPausable(true);
    setRenewable(true);
    setFormError(null);
  }

  function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) {
      setFormError("Please select a base product");
      return;
    }
    if (new Date(availableTo) <= new Date(availableFrom)) {
      setFormError("Available-to date must be after available-from date");
      return;
    }

    createPlanMutation.mutate({
      productId,
      price: parseFloat(price) || 0,
      period,
      minQuantity: parseInt(minQuantity, 10) || 1,
      availableFrom,
      availableTo,
      autoClose,
      closableEarly,
      pausable,
      renewable,
      isActive: true,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Subscription Plans
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Configure recurring billing periods and lifecycle behavior flags (FR-CAT-03, FR-CAT-04)
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            if (productsQuery.data?.items[0]?.id && !productId) {
              setProductId(productsQuery.data.items[0].id);
            }
            setCreateModalOpen(true);
          }}
          className="gap-1.5 text-xs h-9 font-medium"
        >
          <PlusIcon size={14} />
          <span>New Plan</span>
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full mt-4" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Error loading plans"
          description={error.message}
          action={<Button size="sm" onClick={() => utils.catalog.plans.list.invalidate()}>Retry</Button>}
        />
      ) : !data?.items.length ? (
        <EmptyState
          title="No subscription plans found"
          description="Create your first recurring billing plan to attach to customer subscriptions."
          action={
            <Button size="sm" onClick={() => setCreateModalOpen(true)} className="gap-1.5">
              <PlusIcon size={14} />
              <span>New Plan</span>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((plan) => (
            <Card key={plan.id} className="flex flex-col justify-between overflow-hidden border-[hsl(var(--border))]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold leading-tight">
                      {plan.product.name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="default" className="text-[10px] uppercase font-bold">
                        {plan.period}
                      </Badge>
                      <Badge variant={plan.isActive ? "active" : "neutral"} className="text-[10px]">
                        {plan.isActive ? "Active" : "Archived"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold tabular-nums text-[hsl(var(--foreground))]">
                      ₹{Number(plan.price).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      per {plan.period.toLowerCase()}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* Min Quantity & Dates */}
                <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-1 border-t border-[hsl(var(--border))] pt-2">
                  <div className="flex justify-between">
                    <span>Min Quantity:</span>
                    <span className="font-medium text-[hsl(var(--foreground))] tabular-nums">
                      {plan.minQuantity} units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Availability:</span>
                    <span className="font-medium text-[hsl(var(--foreground))] tabular-nums">
                      {new Date(plan.availableFrom).toLocaleDateString()} – {new Date(plan.availableTo).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Lifecycle Flags Matrix */}
                <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-2 space-y-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Lifecycle Flags (FR-CAT-04)
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <span className={plan.autoClose ? "text-[hsl(var(--status-active-ink))] font-medium" : "text-[hsl(var(--muted-foreground))]"}>
                      {plan.autoClose ? "✓ Auto-close" : "○ No auto-close"}
                    </span>
                    <span className={plan.closableEarly ? "text-[hsl(var(--status-active-ink))] font-medium" : "text-[hsl(var(--muted-foreground))]"}>
                      {plan.closableEarly ? "✓ Closable early" : "○ No early close"}
                    </span>
                    <span className={plan.pausable ? "text-[hsl(var(--status-active-ink))] font-medium" : "text-[hsl(var(--muted-foreground))]"}>
                      {plan.pausable ? "✓ Pausable" : "○ Non-pausable"}
                    </span>
                    <span className={plan.renewable ? "text-[hsl(var(--status-active-ink))] font-medium" : "text-[hsl(var(--muted-foreground))]"}>
                      {plan.renewable ? "✓ Renewable" : "○ Non-renewable"}
                    </span>
                  </div>
                </div>

                {/* Action footer */}
                {plan.isActive && (
                  <div className="flex justify-end pt-2 border-t border-[hsl(var(--border))]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archiveMutation.mutate({ id: plan.id })}
                      disabled={archiveMutation.isPending}
                      className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] h-7 px-2"
                    >
                      <TrashIcon size={12} className="mr-1" />
                      Archive
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Plan Dialog */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreatePlan}>
            <DialogHeader>
              <DialogTitle>Create Subscription Plan</DialogTitle>
              <DialogDescription>
                Define billing interval, pricing tiers, and legal lifecycle transition rules.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Select Base Product</label>
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                >
                  <option value="" disabled>Select product...</option>
                  {productsQuery.data?.items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Base ₹{Number(p.salesPrice)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Plan Price (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="text-xs tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Billing Period</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY")}
                    className="w-full rounded-[var(--radius-sm)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Min Qty</label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    className="text-xs tabular-nums"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Available From</label>
                  <Input
                    type="date"
                    required
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Available To</label>
                  <Input
                    type="date"
                    required
                    value={availableTo}
                    onChange={(e) => setAvailableTo(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Behavior Flags */}
              <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3 space-y-2">
                <span className="text-xs font-semibold text-[hsl(var(--foreground))] block">
                  State Machine Behavior Flags (FR-CAT-04)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoClose}
                      onChange={(e) => setAutoClose(e.target.checked)}
                      className="rounded border-[hsl(var(--input))]"
                    />
                    <span>Auto-close at expiry</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={closableEarly}
                      onChange={(e) => setClosableEarly(e.target.checked)}
                      className="rounded border-[hsl(var(--input))]"
                    />
                    <span>Closable early</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pausable}
                      onChange={(e) => setPausable(e.target.checked)}
                      className="rounded border-[hsl(var(--input))]"
                    />
                    <span>Pausable</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={renewable}
                      onChange={(e) => setRenewable(e.target.checked)}
                      className="rounded border-[hsl(var(--input))]"
                    />
                    <span>Renewable</span>
                  </label>
                </div>
              </div>

              {formError && (
                <div className="rounded-[var(--radius-xs)] bg-[hsl(var(--status-overdue-bg))] p-2 text-xs text-[hsl(var(--status-overdue-ink))]">
                  {formError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={createPlanMutation.isPending}>
                Create Plan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
