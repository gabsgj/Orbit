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

export function TaxesView() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [ratePercent, setRatePercent] = React.useState("18.0");
  const [formError, setFormError] = React.useState<string | null>(null);

  const utils = api.useUtils();

  const { data, isLoading, error } = api.catalog.taxes.list.useQuery({});

  const createTaxMutation = api.catalog.taxes.create.useMutation({
    onSuccess: () => {
      utils.catalog.taxes.list.invalidate();
      setCreateModalOpen(false);
      setName("");
      setRatePercent("18.0");
      setFormError(null);
    },
    onError: (err) => setFormError(err.message),
  });

  const archiveMutation = api.catalog.taxes.archive.useMutation({
    onSuccess: () => utils.catalog.taxes.list.invalidate(),
  });

  function handleCreateTax(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Tax name is required");
      return;
    }
    const rate = parseFloat(ratePercent);
    if (isNaN(rate) || rate <= 0 || rate > 100) {
      setFormError("Rate percentage must be between 0 and 100");
      return;
    }

    createTaxMutation.mutate({
      name: name.trim(),
      ratePercent: rate,
      isActive: true,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Taxes & Duties
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Configure rates (e.g. GST 18%) auto-calculated during billing generation (FR-CAT-05)
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="gap-1.5 text-xs h-9 font-medium"
        >
          <PlusIcon size={14} />
          <span>New Tax</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-8 w-1/3" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Error loading taxes"
          description={error.message}
          action={<Button size="sm" onClick={() => utils.catalog.taxes.list.invalidate()}>Retry</Button>}
        />
      ) : !data?.length ? (
        <EmptyState
          title="No taxes defined"
          description="Create your first tax rate to apply onto invoice and subscription lines."
          action={
            <Button size="sm" onClick={() => setCreateModalOpen(true)} className="gap-1.5">
              <PlusIcon size={14} />
              <span>New Tax</span>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((tax) => (
            <Card key={tax.id} className="border-[hsl(var(--border))]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">{tax.name}</CardTitle>
                  <Badge variant={tax.isActive ? "active" : "neutral"} className="text-[10px]">
                    {tax.isActive ? "Active" : "Archived"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tabular-nums text-[hsl(var(--foreground))]">
                    {Number(tax.ratePercent)}%
                  </span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">rate</span>
                </div>

                {tax.isActive && (
                  <div className="flex justify-end pt-2 border-t border-[hsl(var(--border))]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archiveMutation.mutate({ id: tax.id })}
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

      {/* New Tax Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleCreateTax}>
            <DialogHeader>
              <DialogTitle>Add Tax Rule (FR-CAT-05)</DialogTitle>
              <DialogDescription>
                Define new tax percentages applied to quotation and subscription lines.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Tax Name</label>
                <Input
                  required
                  placeholder="e.g. GST 18%, VAT 5%"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Rate Percentage (%)</label>
                <Input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  required
                  value={ratePercent}
                  onChange={(e) => setRatePercent(e.target.value)}
                  className="text-xs tabular-nums"
                />
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
              <Button type="submit" size="sm" isLoading={createTaxMutation.isPending}>
                Save Tax
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
