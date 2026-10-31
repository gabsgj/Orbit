/**
 * modules/catalog — Service & Business Rules unit tests (vitest).
 * Runs against orbit_test DB (TEST_DATABASE_URL).
 *
 * Covers:
 *  1. Product CRUD + active flag
 *  2. Attribute + AttributeValue CRUD
 *  3. Variant CRUD + priceExtra (e.g. Odoo brand +560)
 *  4. Plan CRUD + lifecycle flags + dates (availableTo > availableFrom)
 *  5. Tax CRUD + rate bounds
 */
import { describe, it, expect, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  addProduct,
  getProducts,
  archiveProduct,
  addAttribute,
  addAttributeValue,
  addVariant,
  getVariantsForProduct,
  addPlan,
  archivePlan,
  addTax,
  getTaxes,
} from "./service";
import { createPlanSchema } from "./schemas";

const testDb = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.TEST_DATABASE_URL ??
        "postgresql://orbit_app:orbit@localhost:5432/orbit_test",
    },
  },
});

async function cleanCatalog() {
  await testDb.quotationTemplateLine.deleteMany({});
  await testDb.quotationTemplate.deleteMany({});
  await testDb.subscriptionLineTax.deleteMany({});
  await testDb.subscriptionLine.deleteMany({});
  await testDb.invoiceLine.deleteMany({});
  await testDb.subscription.deleteMany({});
  await testDb.plan.deleteMany({ where: { product: { name: { contains: "Test Product" } } } });
  await testDb.productVariant.deleteMany({ where: { product: { name: { contains: "Test Product" } } } });
  await testDb.product.deleteMany({ where: { name: { contains: "Test Product" } } });
  await testDb.attributeValue.deleteMany({ where: { attribute: { name: { contains: "Test Brand" } } } });
  await testDb.attribute.deleteMany({ where: { name: { contains: "Test Brand" } } });
  await testDb.tax.deleteMany({ where: { name: { contains: "Test GST" } } });
}

describe("Catalog - Products & Variants (FR-CAT-01, FR-CAT-02)", () => {
  beforeEach(cleanCatalog);

  it("creates and retrieves a product with variants and price_extra", async () => {
    // 1. Create Product
    const product = await addProduct(testDb, {
      name: "Test Product Suite",
      type: "service",
      salesPrice: 1200,
      costPrice: 400,
      notes: "Cloud ERP suite",
      isActive: true,
    });
    expect(product.id).toBeTruthy();
    expect(Number(product.salesPrice)).toBe(1200);

    // 2. Create Attribute & Value
    const attr = await addAttribute(testDb, { name: "Test Brand" });
    const val = await addAttributeValue(testDb, { attributeId: attr.id, value: "Odoo" });

    // 3. Create Variant with priceExtra = 560
    const variant = await addVariant(testDb, {
      productId: product.id,
      attributeValueId: val.id,
      priceExtra: 560,
    });
    expect(Number(variant.priceExtra)).toBe(560);

    // 4. Query variants for product
    const variants = await getVariantsForProduct(testDb, product.id);
    expect(variants.length).toBe(1);
    expect(variants[0]!.attributeValue.value).toBe("Odoo");
    expect(Number(variants[0]!.priceExtra)).toBe(560);
  });

  it("archives (soft-deletes) product", async () => {
    const product = await addProduct(testDb, {
      name: "Test Product Archivable",
      type: "good",
      salesPrice: 50,
      costPrice: 20,
      isActive: true,
    });

    await archiveProduct(testDb, product.id);

    const activeList = await getProducts(testDb, { take: 10, isActive: true });
    expect(activeList.items.some((p) => p.id === product.id)).toBe(false);
  });
});

describe("Catalog - Plans & Lifecycle Flags (FR-CAT-03, FR-CAT-04)", () => {
  beforeEach(cleanCatalog);

  it("validates availableTo > availableFrom in schema", () => {
    const invalid = createPlanSchema.safeParse({
      productId: "a0000000-0000-0000-0000-000000000001",
      price: 999,
      period: "MONTHLY",
      minQuantity: 1,
      availableFrom: "2026-10-31",
      availableTo: "2026-10-30", // before availableFrom!
      autoClose: false,
      closableEarly: true,
      pausable: true,
      renewable: true,
      isActive: true,
    });
    expect(invalid.success).toBe(false);

    const valid = createPlanSchema.safeParse({
      productId: "a0000000-0000-0000-0000-000000000001",
      price: 999,
      period: "MONTHLY",
      minQuantity: 1,
      availableFrom: "2026-10-31",
      availableTo: "2027-10-31",
      autoClose: true,
      closableEarly: true,
      pausable: true,
      renewable: true,
      isActive: true,
    });
    expect(valid.success).toBe(true);
  });

  it("persists a plan with all lifecycle flags", async () => {
    const product = await addProduct(testDb, {
      name: "Test Product for Plan",
      type: "service",
      salesPrice: 100,
      costPrice: 50,
      isActive: true,
    });

    const plan = await addPlan(testDb, {
      productId: product.id,
      price: 500,
      period: "MONTHLY",
      minQuantity: 2,
      availableFrom: "2026-01-01",
      availableTo: "2027-01-01",
      autoClose: true,
      closableEarly: true,
      pausable: true,
      renewable: false,
      isActive: true,
    });

    expect(plan.autoClose).toBe(true);
    expect(plan.closableEarly).toBe(true);
    expect(plan.pausable).toBe(true);
    expect(plan.renewable).toBe(false);
    expect(plan.minQuantity).toBe(2);

    await archivePlan(testDb, plan.id);
    const updated = await testDb.plan.findUnique({ where: { id: plan.id } });
    expect(updated?.isActive).toBe(false);
  });
});

describe("Catalog - Taxes (FR-CAT-05)", () => {
  beforeEach(cleanCatalog);

  it("creates and lists taxes", async () => {
    const tax = await addTax(testDb, {
      name: "Test GST 18%",
      ratePercent: 18.0,
      isActive: true,
    });
    expect(Number(tax.ratePercent)).toBe(18.0);

    const list = await getTaxes(testDb, { isActive: true, take: 20 });
    expect(list.items.some((item) => item.name === "Test GST 18%")).toBe(true);
  });
});
