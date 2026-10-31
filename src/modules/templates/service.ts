/**
 * modules/templates — Pure service (no next/trpc imports).
 * FR-QT-01: Template CRUD + lines management.
 */
import type { PrismaClient } from "@prisma/client";
import {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  archiveTemplate,
  upsertTemplateLines,
} from "./queries";
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  UpsertTemplateLinesInput,
  ListTemplatesInput,
} from "./schemas";

export const getTemplates = (db: PrismaClient, input: ListTemplatesInput) =>
  listTemplates(db, input);

export const getTemplate = (db: PrismaClient, id: string) =>
  getTemplateById(db, id);

export const addTemplate = (db: PrismaClient, input: CreateTemplateInput) =>
  createTemplate(db, input);

export const editTemplate = (db: PrismaClient, input: UpdateTemplateInput) =>
  updateTemplate(db, input);

export const deactivateTemplate = (db: PrismaClient, id: string) =>
  archiveTemplate(db, id);

export const setTemplateLines = (db: PrismaClient, input: UpsertTemplateLinesInput) =>
  upsertTemplateLines(db, input);
