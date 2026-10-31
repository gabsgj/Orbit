/**
 * modules/catalog — PUBLIC API barrel.
 * Other modules may import ONLY from this file (eslint no-restricted-imports).
 */
export { catalogRouter } from "./router";
export {
  listProductsSchema,
  createProductSchema,
  updateProductSchema,
  createAttributeSchema,
  createAttributeValueSchema,
  createVariantSchema,
  updateVariantSchema,
  setPriceExtraSchema,
  createVariantForProductSchema,
  createPlanSchema,
  updatePlanSchema,
  listPlansSchema,
  listTaxesSchema,
  createTaxSchema,
  updateTaxSchema,
  periodSchema,
  productTypeSchema,
} from "./schemas";
export type {
  CreateProductInput,
  UpdateProductInput,
  CreateAttributeInput,
  CreateAttributeValueInput,
  CreateVariantInput,
  UpdateVariantInput,
  SetPriceExtraInput,
  CreateVariantForProductInput,
  CreatePlanInput,
  UpdatePlanInput,
  ListProductsInput,
  ListPlansInput,
  ListTaxesInput,
  CreateTaxInput,
  UpdateTaxInput,
} from "./schemas";

// UI Components
export { ProductsView } from "./components/products-view";
export { PlansView } from "./components/plans-view";
export { TaxesView } from "./components/taxes-view";
export { VariantsPanel } from "./components/variants-panel";
