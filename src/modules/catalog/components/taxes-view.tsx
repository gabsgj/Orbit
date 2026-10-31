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
import { createTaxSchema } from "../schemas";

export function TaxesView() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [ratePercent, setRatePercent] = React.useState("18.0");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"active" | "archived" | "all">("active");

  const utils = api.useUtils();

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.catalog.taxes.list.useInfiniteQuery(
      {
        take: 12,
        search: search || undefined,
        isActive: status === "all" ? undefined : status === "active",
      },
      { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
    );
  const taxes = data?.pages.flatMap((page) => page.items) ?? [];

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
    const parsed = createTaxSchema.safeParse({
      name: name.trim(),
      ratePercent: Number(ratePercent),
      isActive: true,
    });
    if (!parsed.success) {
      setFormError(parsed.error.errors[0]?.message ?? "Enter a valid tax rule.");
      return;
    }
    createTaxMutation.mutate(parsed.data);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Taxes & Duties
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Configure rates (e.g. GST 18%) auto-calculated during billing generation (FR-CAT-05)
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="gap-1.5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 h-10 text-sm font-medium shadow-[var(--shadow-soft)] hover:bg-[hsl(var(--primary))]/90"
        >
          <PlusIcon size={14} />
          <span>New Tax</span>
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Filter tax rules"
          aria-label="Filter tax rules"
          className="text-xs sm:max-w-xs"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          aria-label="Filter tax status"
          className="rounded-[var(--radius-sm)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All statuses</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3 rounded-[var(--radius-lg)] shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--border))] border-0">
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
      ) : !taxes.length ? (
        <EmptyState
          title="No taxes defined"
          description="Create your first tax rate to apply onto invoice and subscription lines."
          action={
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 h-9 text-sm font-medium hover:bg-[hsl(var(--primary))]/90"
            >
              <PlusIcon size={14} />
              <span>New Tax</span>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {taxes.map((tax) => (
            <Card key={tax.id} className="rounded-[var(--radius-lg)] shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--border))] border-0">
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
                      className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] h-7 px-3 rounded-full"
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

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            isLoading={isFetchingNextPage}
          >
            Load more tax rules
          </Button>
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
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={createTaxMutation.isPending} className="rounded-full">
                Save Tax
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
