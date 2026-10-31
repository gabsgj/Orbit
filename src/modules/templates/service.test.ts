/**
 * modules/templates — Quotation Templates unit tests (vitest).
 * Runs against orbit_test DB (TEST_DATABASE_URL).
 *
 * Covers FR-QT-01:
 *  1. Template CRUD (name, plan, validity_days)
 *  2. Template lines upsert (variant, quantity, unit_price snapshot)
 *  3. Inactive/archive state
 */
import { describe, it, expect, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  addTemplate,
  getTemplate,
  deactivateTemplate,
  setTemplateLines,
} from "./service";

const testDb = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.TEST_DATABASE_URL ??
        "postgresql://orbit_app:orbit@localhost:5432/orbit_test",
    },
  },
});

async function cleanTemplates() {
  await testDb.quotationTemplateLine.deleteMany({});
  await testDb.quotationTemplate.deleteMany({});
  await testDb.subscriptionLineTax.deleteMany({});
  await testDb.subscriptionLine.deleteMany({});
  await testDb.invoiceLine.deleteMany({});
  await testDb.subscription.deleteMany({});
  await testDb.plan.deleteMany({ where: { product: { name: { contains: "Test Template Prod" } } } });
  await testDb.productVariant.deleteMany({ where: { product: { name: { contains: "Test Template Prod" } } } });
  await testDb.product.deleteMany({ where: { name: { contains: "Test Template Prod" } } });
  await testDb.attributeValue.deleteMany({ where: { attribute: { name: { contains: "Test Template Attr" } } } });
  await testDb.attribute.deleteMany({ where: { name: { contains: "Test Template Attr" } } });
}

describe("Quotation Templates (FR-QT-01)", () => {
  beforeEach(cleanTemplates);

  it("creates template and replaces lines atomically", async () => {
    // 1. Setup product, variant, plan
    const prod = await testDb.product.create({
      data: {
        name: "Test Template Prod",
        type: "service",
        salesPrice: 200,
        costPrice: 50,
      },
    });

    const attr = await testDb.attribute.create({ data: { name: "Test Template Attr" } });
    const attrVal = await testDb.attributeValue.create({
      data: { attributeId: attr.id, value: "Standard" },
    });
    const variant = await testDb.productVariant.create({
      data: {
        productId: prod.id,
        attributeValueId: attrVal.id,
        priceExtra: 50,
      },
    });

    const plan = await testDb.plan.create({
      data: {
        productId: prod.id,
        price: 300,
        period: "MONTHLY",
        minQuantity: 1,
        availableFrom: new Date("2026-01-01"),
        availableTo: new Date("2027-01-01"),
      },
    });

    // 2. Create Quotation Template
    const template = await addTemplate(testDb, {
      name: "SaaS Starter Template",
      planId: plan.id,
      validityDays: 30,
      isActive: true,
    });
    expect(template.id).toBeTruthy();
    expect(template.validityDays).toBe(30);

    // 3. Set lines atomically
    const withLines = await setTemplateLines(testDb, {
      templateId: template.id,
      lines: [
        {
          variantId: variant.id,
          quantity: 5,
          unitPrice: 250,
        },
      ],
    });

    expect(withLines.lines.length).toBe(1);
    expect(withLines.lines[0]!.quantity).toBe(5);
    expect(Number(withLines.lines[0]!.unitPrice)).toBe(250);

    // 4. Archive template
    await deactivateTemplate(testDb, template.id);
    const fetched = await getTemplate(testDb, template.id);
    expect(fetched?.isActive).toBe(false);
  });
});
