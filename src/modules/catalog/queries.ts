/**
 * modules/catalog — Prisma data access (this module only).
 * All list queries use keyset (cursor) pagination per NFR-PERF-01.
 *
 * Pattern: ORDER BY createdAt DESC + id DESC tiebreak, cursor on last id,
 * fetch take+1 to detect next-page existence.
 */
import type { PrismaClient } from "@prisma/client";
import type {
  CreateProductInput,
  UpdateProductInput,
  CreateAttributeInput,
  CreateAttributeValueInput,
  CreateVariantInput,
  UpdateVariantInput,
  CreatePlanInput,
  UpdatePlanInput,
  CreateTaxInput,
  UpdateTaxInput,
  ListProductsInput,
  ListPlansInput,
  ListTaxesInput,
} from "./schemas";

type Db = PrismaClient;

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

function toPage<T extends { id: string }>(rows: T[], take: number): Page<T> {
  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1]!.id : null };
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function listProducts(db: Db, opts: ListProductsInput) {
  const rows = await db.product.findMany({
    where: {
      ...(opts.isActive !== undefined ? { isActive: opts.isActive } : {}),
      ...(opts.search
        ? { name: { contains: opts.search, mode: "insensitive" } }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    cursor: opts.cursor ? { id: opts.cursor } : undefined,
    skip: opts.cursor ? 1 : 0,
    take: opts.take + 1,
    include: {
      variants: {
        include: { attributeValue: { include: { attribute: true } } },
      },
      plans: { where: { isActive: true }, select: { id: true, period: true, price: true } },
    },
  });
  return toPage(rows, opts.take);
}

export async function getProductById(db: Db, id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      variants: {
        include: { attributeValue: { include: { attribute: true } } },
      },
      plans: true,
    },
  });
}

export async function createProduct(db: Db, input: CreateProductInput) {
  return db.product.create({
    data: {
      name: input.name,
      type: input.type,
      salesPrice: input.salesPrice,
      costPrice: input.costPrice,
      notes: input.notes,
      isActive: input.isActive,
    },
  });
}

export async function updateProduct(db: Db, input: UpdateProductInput) {
  const { id, ...data } = input;
  return db.product.update({ where: { id }, data });
}

export async function deleteProduct(db: Db, id: string) {
  // Soft-delete: mark inactive rather than hard-delete (plans/variants may have history)
  return db.product.update({ where: { id }, data: { isActive: false } });
}

// ── Attributes ────────────────────────────────────────────────────────────────

export async function listAttributes(db: Db) {
  return db.attribute.findMany({
    include: { values: true },
    orderBy: { name: "asc" },
  });
}

export async function getAttributeById(db: Db, id: string) {
  return db.attribute.findUnique({ where: { id }, include: { values: true } });
}

export async function createAttribute(db: Db, input: CreateAttributeInput) {
  return db.attribute.create({ data: { name: input.name } });
}

export async function deleteAttribute(db: Db, id: string) {
  return db.attribute.delete({ where: { id } });
}

// ── AttributeValues ───────────────────────────────────────────────────────────

export async function createAttributeValue(db: Db, input: CreateAttributeValueInput) {
  return db.attributeValue.create({
    data: { attributeId: input.attributeId, value: input.value },
    include: { attribute: true },
  });
}

export async function deleteAttributeValue(db: Db, id: string) {
  return db.attributeValue.delete({ where: { id } });
}

// ── ProductVariants ───────────────────────────────────────────────────────────

export async function createVariant(db: Db, input: CreateVariantInput) {
  return db.productVariant.create({
    data: {
      productId: input.productId,
      attributeValueId: input.attributeValueId,
      priceExtra: input.priceExtra,
    },
    include: {
      attributeValue: { include: { attribute: true } },
      product: true,
    },
  });
}

export async function updateVariant(db: Db, input: UpdateVariantInput) {
  return db.productVariant.update({
    where: { id: input.id },
    data: { priceExtra: input.priceExtra },
  });
}

export async function deleteVariant(db: Db, id: string) {
  return db.productVariant.delete({ where: { id } });
}

export async function listVariantsByProduct(db: Db, productId: string) {
  return db.productVariant.findMany({
    where: { productId },
    include: { attributeValue: { include: { attribute: true } } },
    orderBy: { attributeValue: { value: "asc" } },
  });
}

// ── Plans ─────────────────────────────────────────────────────────────────────

export async function listPlans(db: Db, opts: ListPlansInput) {
  const rows = await db.plan.findMany({
    where: {
      ...(opts.isActive !== undefined ? { isActive: opts.isActive } : {}),
      ...(opts.productId ? { productId: opts.productId } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    cursor: opts.cursor ? { id: opts.cursor } : undefined,
    skip: opts.cursor ? 1 : 0,
    take: opts.take + 1,
    include: { product: { select: { id: true, name: true } } },
  });
  return toPage(rows, opts.take);
}

export async function getPlanById(db: Db, id: string) {
  return db.plan.findUnique({
    where: { id },
    include: { product: true },
  });
}

export async function createPlan(db: Db, input: CreatePlanInput) {
  return db.plan.create({
    data: {
      productId: input.productId,
      price: input.price,
      period: input.period,
      minQuantity: input.minQuantity,
      availableFrom: new Date(input.availableFrom),
      availableTo: new Date(input.availableTo),
      autoClose: input.autoClose,
      closableEarly: input.closableEarly,
      pausable: input.pausable,
      renewable: input.renewable,
      isActive: input.isActive,
    },
    include: { product: { select: { id: true, name: true } } },
  });
}

export async function updatePlan(db: Db, input: UpdatePlanInput) {
  const { id, availableFrom, availableTo, ...rest } = input;
  return db.plan.update({
    where: { id },
    data: {
      ...rest,
      ...(availableFrom ? { availableFrom: new Date(availableFrom) } : {}),
      ...(availableTo ? { availableTo: new Date(availableTo) } : {}),
    },
  });
}

export async function deletePlan(db: Db, id: string) {
  return db.plan.update({ where: { id }, data: { isActive: false } });
}

// ── Taxes ─────────────────────────────────────────────────────────────────────

export async function listTaxes(db: Db, opts: ListTaxesInput) {
  return db.tax.findMany({
    where: opts.isActive !== undefined ? { isActive: opts.isActive } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function getTaxById(db: Db, id: string) {
  return db.tax.findUnique({ where: { id } });
}

export async function createTax(db: Db, input: CreateTaxInput) {
  return db.tax.create({
    data: { name: input.name, ratePercent: input.ratePercent, isActive: input.isActive },
  });
}

export async function updateTax(db: Db, input: UpdateTaxInput) {
  const { id, ...data } = input;
  return db.tax.update({ where: { id }, data });
}

export async function deleteTax(db: Db, id: string) {
  return db.tax.update({ where: { id }, data: { isActive: false } });
}
