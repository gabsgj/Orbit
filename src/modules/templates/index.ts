/**
 * modules/templates — PUBLIC API barrel.
 * Other modules may import ONLY from this file (eslint no-restricted-imports).
 */
export { templatesRouter } from "./router";
export {
  createTemplateSchema,
  updateTemplateSchema,
  upsertTemplateLinesSchema,
  listTemplatesSchema,
  templateLineSchema,
} from "./schemas";
export type {
  CreateTemplateInput,
  UpdateTemplateInput,
  UpsertTemplateLinesInput,
  ListTemplatesInput,
  TemplateLine,
} from "./schemas";

// UI Components
export { TemplatesView } from "./components/templates-view";
