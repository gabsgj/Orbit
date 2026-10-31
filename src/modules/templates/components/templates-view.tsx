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

export function TemplatesView() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [linesModalOpen, setLinesModalOpen] = React.useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);

  // Template Form
  const [name, setName] = React.useState("");
  const [planId, setPlanId] = React.useState("");
  const [validityDays, setValidityDays] = React.useState("30");
  const [formError, setFormError] = React.useState<string | null>(null);

  // Line Form
  const [selectedVariantId, setSelectedVariantId] = React.useState("");
  const [lineQty, setLineQty] = React.useState("1");
  const [lineUnitPrice, setLineUnitPrice] = React.useState("0");
  const [lineError, setLineError] = React.useState<string | null>(null);

  const utils = api.useUtils();

  const { data, isLoading, error } = api.templates.list.useQuery({ take: 50 });
  const plansQuery = api.catalog.plans.list.useQuery({ take: 50, isActive: true });
  const productsQuery = api.catalog.products.list.useQuery({ take: 50, isActive: true });

  // Gather all available variants across all products
  const allVariants = React.useMemo(() => {
    if (!productsQuery.data?.items) return [];
    return productsQuery.data.items.flatMap((p) =>
      p.variants.map((v) => ({
        id: v.id,
        label: `${p.name} — ${v.attributeValue.attribute.name}: ${v.attributeValue.value} (Extra: ₹${Number(v.priceExtra)})`,
        defaultPrice: Number(p.salesPrice) + Number(v.priceExtra),
      })),
    );
  }, [productsQuery.data]);

  const createTemplateMutation = api.templates.create.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      setCreateModalOpen(false);
      setName("");
      setValidityDays("30");
      setFormError(null);
    },
    onError: (err) => setFormError(err.message),
  });

  const upsertLinesMutation = api.templates.upsertLines.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      setLinesModalOpen(false);
      setSelectedVariantId("");
      setLineQty("1");
      setLineUnitPrice("0");
      setLineError(null);
    },
    onError: (err) => setLineError(err.message),
  });

  const archiveMutation = api.templates.archive.useMutation({
    onSuccess: () => utils.templates.list.invalidate(),
  });

  function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Template name is required");
      return;
    }
    if (!planId) {
      setFormError("Please select a base subscription plan");
      return;
    }

    createTemplateMutation.mutate({
      name: name.trim(),
      planId,
      validityDays: parseInt(validityDays, 10) || 30,
      isActive: true,
    });
  }

  function handleAddLine(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplateId) return;
    if (!selectedVariantId) {
      setLineError("Please choose a product variant");
      return;
    }

    // Find current template lines to append to
    const currentTemplate = data?.items.find((t) => t.id === selectedTemplateId);
    const existingLines = currentTemplate?.lines.map((l) => ({
      variantId: l.variantId,
      quantity: l.quantity,
      unitPrice: Number(l.unitPrice),
    })) || [];

    const newLines = [
      ...existingLines,
      {
        variantId: selectedVariantId,
        quantity: parseInt(lineQty, 10) || 1,
        unitPrice: parseFloat(lineUnitPrice) || 0,
      },
    ];

    upsertLinesMutation.mutate({
      templateId: selectedTemplateId,
      lines: newLines,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Quotation Templates (FR-QT-01)
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Pre-configure subscription quotes with pre-filled variant lines and expiration rules
          </p>
        </div>
        <Button
          onClick={() => {
            if (plansQuery.data?.items[0]?.id && !planId) {
              setPlanId(plansQuery.data.items[0].id);
            }
            setCreateModalOpen(true);
          }}
          className="gap-1.5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 h-10 text-sm font-medium shadow-[var(--shadow-soft)] hover:bg-[hsl(var(--primary))]/90"
        >
          <PlusIcon size={14} />
          <span>New Template</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3 rounded-[var(--radius-lg)] shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--border))] border-0">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full mt-4" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Error loading templates"
          description={error.message}
          action={<Button size="sm" onClick={() => utils.templates.list.invalidate()}>Retry</Button>}
        />
      ) : !data?.items.length ? (
        <EmptyState
          title="No quotation templates found"
          description="Create standard quotation templates to enable one-click subscription setup for sales reps."
          action={
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 h-9 text-sm font-medium hover:bg-[hsl(var(--primary))]/90"
            >
              <PlusIcon size={14} />
              <span>New Template</span>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((tpl) => (
            <Card key={tpl.id} className="flex flex-col justify-between rounded-[var(--radius-lg)] shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--border))] border-0">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold leading-tight">
                      {tpl.name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="default" className="text-[10px] uppercase">
                        {tpl.plan.period}
                      </Badge>
                      <Badge variant={tpl.isActive ? "active" : "neutral"} className="text-[10px]">
                        {tpl.isActive ? "Active" : "Archived"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold tabular-nums text-[hsl(var(--foreground))]">
                      {tpl.validityDays} days
                    </span>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">quote validity</p>
                  </div>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] pt-1">
                  Plan: <span className="font-medium text-[hsl(var(--foreground))]">{tpl.plan.product.name}</span> (₹{Number(tpl.plan.price)}/{tpl.plan.period.toLowerCase()})
                </p>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* Lines Box */}
                <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
                      Lines ({tpl.lines.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(tpl.id);
                        if (allVariants[0]) {
                          setSelectedVariantId(allVariants[0].id);
                          setLineUnitPrice(allVariants[0].defaultPrice.toString());
                        }
                        setLinesModalOpen(true);
                      }}
                      className="text-[11px] text-[hsl(var(--chart-1))] hover:underline flex items-center gap-1 font-medium"
                    >
                      <PlusIcon size={11} /> Add Line
                    </button>
                  </div>

                  {tpl.lines.length === 0 ? (
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))] italic">
                      No pre-filled lines added
                    </p>
                  ) : (
                    <div className="space-y-1 pt-1">
                      {tpl.lines.map((line) => (
                        <div
                          key={line.id}
                          className="flex items-center justify-between text-xs rounded bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-2 py-1"
                        >
                          <div className="truncate mr-2">
                            <span className="font-medium">{line.variant.product.name}</span>{" "}
                            <span className="text-[hsl(var(--muted-foreground))] text-[11px]">
                              ({line.variant.attributeValue.value})
                            </span>
                          </div>
                          <div className="text-right whitespace-nowrap text-[11px] tabular-nums">
                            {line.quantity} × ₹{Number(line.unitPrice).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {tpl.isActive && (
                  <div className="flex justify-end pt-2 border-t border-[hsl(var(--border))]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archiveMutation.mutate({ id: tpl.id })}
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

      {/* New Template Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateTemplate}>
            <DialogHeader>
              <DialogTitle>Create Quotation Template</DialogTitle>
              <DialogDescription>
                Preset plans and product lines for rapid quote conversion.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Template Name</label>
                <Input
                  required
                  placeholder="e.g. Standard Cloud ERP Onboarding"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Base Plan</label>
                <select
                  required
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                >
                  <option value="" disabled>Select a plan...</option>
                  {plansQuery.data?.items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product.name} ({p.period} — ₹{Number(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Quotation Validity (Days)</label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  required
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                  className="text-xs tabular-nums"
                />
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  Generated quotes will expire this many days after issue date.
                </p>
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
              <Button type="submit" size="sm" isLoading={createTemplateMutation.isPending} className="rounded-full">
                Create Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Line Modal */}
      <Dialog open={linesModalOpen} onOpenChange={setLinesModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAddLine}>
            <DialogHeader>
              <DialogTitle>Add Pre-filled Line Item</DialogTitle>
              <DialogDescription>
                Attach a snapshot product variant and unit price to this template.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Select Variant</label>
                <select
                  required
                  value={selectedVariantId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedVariantId(id);
                    const v = allVariants.find((x) => x.id === id);
                    if (v) setLineUnitPrice(v.defaultPrice.toString());
                  }}
                  className="w-full rounded-[var(--radius-sm)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                >
                  <option value="" disabled>Select variant...</option>
                  {allVariants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Default Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={lineQty}
                    onChange={(e) => setLineQty(e.target.value)}
                    className="text-xs tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Snapshot Unit Price (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={lineUnitPrice}
                    onChange={(e) => setLineUnitPrice(e.target.value)}
                    className="text-xs tabular-nums"
                  />
                </div>
              </div>

              {lineError && (
                <div className="rounded-[var(--radius-xs)] bg-[hsl(var(--status-overdue-bg))] p-2 text-xs text-[hsl(var(--status-overdue-ink))]">
                  {lineError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setLinesModalOpen(false)} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={upsertLinesMutation.isPending} className="rounded-full">
                Add Line
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
