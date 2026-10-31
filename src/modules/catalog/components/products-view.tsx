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

export function ProductsView() {
  const [search, setSearch] = React.useState("");
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [variantModalOpen, setVariantModalOpen] = React.useState(false);
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null);

  // Form states for new product
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<"service" | "good">("service");
  const [salesPrice, setSalesPrice] = React.useState("0");
  const [costPrice, setCostPrice] = React.useState("0");
  const [notes, setNotes] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  // Form states for new variant (FR-CAT-02: Brand / priceExtra e.g. Odoo +560)
  const [attrName, setAttrName] = React.useState("Brand");
  const [attrValue, setAttrValue] = React.useState("");
  const [priceExtra, setPriceExtra] = React.useState("0");
  const [variantError, setVariantError] = React.useState<string | null>(null);

  const utils = api.useUtils();

  const { data, isLoading, error } = api.catalog.products.list.useQuery({
    search: search || undefined,
    take: 50,
  });

  const attributesQuery = api.catalog.attributes.list.useQuery();

  const createProductMutation = api.catalog.products.create.useMutation({
    onSuccess: () => {
      utils.catalog.products.list.invalidate();
      setCreateModalOpen(false);
      resetForm();
    },
    onError: (err) => setFormError(err.message),
  });

  const createAttributeMutation = api.catalog.attributes.create.useMutation();
  const createAttributeValueMutation = api.catalog.attributes.addValue.useMutation();
  const createVariantMutation = api.catalog.variants.create.useMutation({
    onSuccess: () => {
      utils.catalog.products.list.invalidate();
      setVariantModalOpen(false);
      setAttrValue("");
      setPriceExtra("0");
    },
    onError: (err) => setVariantError(err.message),
  });

  const archiveMutation = api.catalog.products.archive.useMutation({
    onSuccess: () => utils.catalog.products.list.invalidate(),
  });

  function resetForm() {
    setName("");
    setType("service");
    setSalesPrice("0");
    setCostPrice("0");
    setNotes("");
    setFormError(null);
  }

  function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }
    createProductMutation.mutate({
      name: name.trim(),
      type,
      salesPrice: parseFloat(salesPrice) || 0,
      costPrice: parseFloat(costPrice) || 0,
      notes: notes.trim() || undefined,
      isActive: true,
    });
  }

  async function handleCreateVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProductId) return;
    if (!attrValue.trim()) {
      setVariantError("Attribute value (e.g. Odoo) is required");
      return;
    }

    try {
      // Find or create attribute (e.g. Brand)
      const existingAttrs = attributesQuery.data || [];
      let targetAttrId: string;
      const foundAttr = existingAttrs.find(
        (a) => a.name.toLowerCase() === attrName.toLowerCase(),
      );

      if (foundAttr) {
        targetAttrId = foundAttr.id;
      } else {
        const createdAttr = await createAttributeMutation.mutateAsync({ name: attrName });
        targetAttrId = createdAttr.id;
        await utils.catalog.attributes.list.invalidate();
      }

      // Find or create attribute value
      let targetValId: string;
      const foundVal = foundAttr?.values?.find(
        (v) => v.value.toLowerCase() === attrValue.toLowerCase(),
      );

      if (foundVal) {
        targetValId = foundVal.id;
      } else {
        const createdVal = await createAttributeValueMutation.mutateAsync({
          attributeId: targetAttrId,
          value: attrValue.trim(),
        });
        targetValId = createdVal.id;
      }

      // Create product variant with price extra
      await createVariantMutation.mutateAsync({
        productId: selectedProductId,
        attributeValueId: targetValId,
        priceExtra: parseFloat(priceExtra) || 0,
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setVariantError(e.message || "Failed to create variant");
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Products & Variants
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Manage your service and good catalog offerings with custom variant modifiers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 text-xs h-9"
          />
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5 text-xs h-9 font-medium"
          >
            <PlusIcon size={14} />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Content */}
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
          title="Error loading products"
          description={error.message}
          action={<Button size="sm" onClick={() => utils.catalog.products.list.invalidate()}>Retry</Button>}
        />
      ) : !data?.items.length ? (
        <EmptyState
          title="No products found"
          description={search ? "No products matching your search criteria." : "Start by adding your first product to the catalog."}
          action={
            <Button size="sm" onClick={() => setCreateModalOpen(true)} className="gap-1.5">
              <PlusIcon size={14} />
              <span>Add Product</span>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((prod) => (
            <Card key={prod.id} className="flex flex-col justify-between overflow-hidden border-[hsl(var(--border))]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold leading-tight">
                      {prod.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={prod.type === "service" ? "default" : "neutral"} className="text-[10px] uppercase">
                        {prod.type}
                      </Badge>
                      <Badge variant={prod.isActive ? "active" : "neutral"} className="text-[10px]">
                        {prod.isActive ? "Active" : "Archived"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold tabular-nums text-[hsl(var(--foreground))]">
                      ₹{Number(prod.salesPrice).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[hsl(var(--muted-foreground))] tabular-nums">
                      Cost: ₹{Number(prod.costPrice).toFixed(2)}
                    </div>
                  </div>
                </div>
                {prod.notes && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 mt-2">
                    {prod.notes}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* Variants List */}
                <div className="rounded-[var(--radius-xs)] border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
                      Variants ({prod.variants.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductId(prod.id);
                        setVariantModalOpen(true);
                      }}
                      className="text-[11px] text-[hsl(var(--chart-1))] hover:underline flex items-center gap-1 font-medium"
                    >
                      <PlusIcon size={11} /> Add Variant
                    </button>
                  </div>

                  {prod.variants.length === 0 ? (
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))] italic">
                      No variants configured
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {prod.variants.map((v) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center gap-1 rounded bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-2 py-0.5 text-[11px] text-[hsl(var(--foreground))]"
                        >
                          <span className="font-medium">{v.attributeValue.attribute.name}:</span>
                          <span>{v.attributeValue.value}</span>
                          {Number(v.priceExtra) > 0 && (
                            <span className="text-[hsl(var(--status-active-ink))] font-medium tabular-nums">
                              (+₹{Number(v.priceExtra)})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-[hsl(var(--border))]">
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                    {prod.plans.length} active plans
                  </span>
                  {prod.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archiveMutation.mutate({ id: prod.id })}
                      disabled={archiveMutation.isPending}
                      className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] h-7 px-2"
                    >
                      <TrashIcon size={12} className="mr-1" />
                      Archive
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <form onSubmit={handleCreateProduct}>
            <DialogHeader>
              <DialogTitle>Add New Catalog Product</DialogTitle>
              <DialogDescription>
                Define base service or good specifications and pricing.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Product Name</label>
                <Input
                  required
                  placeholder="e.g. Cloud Accounting Pro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "service" | "good")}
                    className="w-full rounded-[var(--radius-sm)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  >
                    <option value="service">Service</option>
                    <option value="good">Good</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Base Sales Price (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(e.target.value)}
                    className="text-xs tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Cost Price (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="text-xs tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Internal Notes</label>
                  <Input
                    placeholder="Optional notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-xs"
                  />
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
              <Button type="submit" size="sm" isLoading={createProductMutation.isPending}>
                Save Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Variant Modal */}
      <Dialog open={variantModalOpen} onOpenChange={setVariantModalOpen}>
        <DialogContent>
          <form onSubmit={handleCreateVariant}>
            <DialogHeader>
              <DialogTitle>Add Product Variant (FR-CAT-02)</DialogTitle>
              <DialogDescription>
                Attach attribute-based modifiers (e.g. Brand: Odoo with extra ₹560).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Attribute Name</label>
                  <Input
                    placeholder="e.g. Brand, Edition, Tier"
                    value={attrName}
                    onChange={(e) => setAttrName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Attribute Value</label>
                  <Input
                    required
                    placeholder="e.g. Odoo, Enterprise"
                    value={attrValue}
                    onChange={(e) => setAttrValue(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Price Extra (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="e.g. 560"
                  value={priceExtra}
                  onChange={(e) => setPriceExtra(e.target.value)}
                  className="text-xs tabular-nums"
                />
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  Added on top of base sales price during quotation and billing generation.
                </p>
              </div>

              {variantError && (
                <div className="rounded-[var(--radius-xs)] bg-[hsl(var(--status-overdue-bg))] p-2 text-xs text-[hsl(var(--status-overdue-ink))]">
                  {variantError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setVariantModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={
                  createAttributeMutation.isPending ||
                  createAttributeValueMutation.isPending ||
                  createVariantMutation.isPending
                }
              >
                Add Variant
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
