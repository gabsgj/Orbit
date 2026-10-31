/**
 * modules/catalog — Pure business logic service (no next/trpc imports).
 *
 * FR-CAT-01…05 business rules:
 * - Plan dates: availableTo > availableFrom (also enforced by zod + DB CHECK).
 * - Variant priceExtra: must be ≥ 0; added to product.salesPrice for quoting.
 * - Tax rate: 0 < rate ≤ 100 (zod + DB CHECK).
 * - Inactive taxes are excluded from new invoices (billing engine reads only
 *   is_active=true taxes — enforced in BillingService, not here).
 *
 * Decision: service functions are deliberately thin here because catalog
 * operations have few cross-entity business rules beyond validation (which
 * zod handles). The value of the service layer is making the logic testable
 * independently of tRPC/Next.js — the router stays thin (parse→guard→call→shape).
 */
import type { PrismaClient } from "@prisma/client";
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  listAttributes,
  getAttributeById,
  createAttribute,
  deleteAttribute,
  createAttributeValue,
  deleteAttributeValue,
  createVariant,
  updateVariant,
  deleteVariant,
  listVariantsByProduct,
  listPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  listTaxes,
  getTaxById,
  createTax,
  updateTax,
  deleteTax,
} from "./queries";
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

// ── Products ──────────────────────────────────────────────────────────────────

export const getProducts = (db: PrismaClient, input: ListProductsInput) =>
  listProducts(db, input);

export const getProduct = (db: PrismaClient, id: string) =>
  getProductById(db, id);

export const addProduct = (db: PrismaClient, input: CreateProductInput) =>
  createProduct(db, input);

export const editProduct = (db: PrismaClient, input: UpdateProductInput) =>
  updateProduct(db, input);

export const archiveProduct = (db: PrismaClient, id: string) =>
  deleteProduct(db, id);

// ── Attributes ────────────────────────────────────────────────────────────────

export const getAttributes = (db: PrismaClient) => listAttributes(db);

export const getAttribute = (db: PrismaClient, id: string) =>
  getAttributeById(db, id);

export const addAttribute = (db: PrismaClient, input: CreateAttributeInput) =>
  createAttribute(db, input);

export const removeAttribute = (db: PrismaClient, id: string) =>
  deleteAttribute(db, id);

// ── AttributeValues ───────────────────────────────────────────────────────────

export const addAttributeValue = (db: PrismaClient, input: CreateAttributeValueInput) =>
  createAttributeValue(db, input);

export const removeAttributeValue = (db: PrismaClient, id: string) =>
  deleteAttributeValue(db, id);

// ── Variants ──────────────────────────────────────────────────────────────────

export const addVariant = (db: PrismaClient, input: CreateVariantInput) =>
  createVariant(db, input);

export const editVariant = (db: PrismaClient, input: UpdateVariantInput) =>
  updateVariant(db, input);

export const removeVariant = (db: PrismaClient, id: string) =>
  deleteVariant(db, id);

export const getVariantsForProduct = (db: PrismaClient, productId: string) =>
  listVariantsByProduct(db, productId);

// ── Plans ─────────────────────────────────────────────────────────────────────

export const getPlans = (db: PrismaClient, input: ListPlansInput) =>
  listPlans(db, input);

export const getPlan = (db: PrismaClient, id: string) =>
  getPlanById(db, id);

export const addPlan = (db: PrismaClient, input: CreatePlanInput) =>
  createPlan(db, input);

export const editPlan = (db: PrismaClient, input: UpdatePlanInput) =>
  updatePlan(db, input);

export const archivePlan = (db: PrismaClient, id: string) =>
  deletePlan(db, id);

// ── Taxes ─────────────────────────────────────────────────────────────────────

export const getTaxes = (db: PrismaClient, input: ListTaxesInput) =>
  listTaxes(db, input);

export const getTax = (db: PrismaClient, id: string) =>
  getTaxById(db, id);

export const addTax = (db: PrismaClient, input: CreateTaxInput) =>
  createTax(db, input);

export const editTax = (db: PrismaClient, input: UpdateTaxInput) =>
  updateTax(db, input);

export const archiveTax = (db: PrismaClient, id: string) =>
  deleteTax(db, id);
