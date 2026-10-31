/**
 * modules/templates — Prisma data access (this module only).
 * Keyset pagination for lists, as per NFR-PERF-01.
 */
import type { PrismaClient } from "@prisma/client";
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  UpsertTemplateLinesInput,
  ListTemplatesInput,
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

// ── Template CRUD ──────────────────────────────────────────────────────────────

export async function listTemplates(db: Db, opts: ListTemplatesInput) {
  const rows = await db.quotationTemplate.findMany({
    where: {
      ...(opts.isActive !== undefined ? { isActive: opts.isActive } : {}),
      ...(opts.planId ? { planId: opts.planId } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    cursor: opts.cursor ? { id: opts.cursor } : undefined,
    skip: opts.cursor ? 1 : 0,
    take: opts.take + 1,
    include: {
      plan: {
        include: { product: { select: { id: true, name: true } } },
      },
      lines: {
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true } },
              attributeValue: { include: { attribute: true } },
            },
          },
        },
      },
    },
  });
  return toPage(rows, opts.take);
}

export async function getTemplateById(db: Db, id: string) {
  return db.quotationTemplate.findUnique({
    where: { id },
    include: {
      plan: { include: { product: true } },
      lines: {
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true } },
              attributeValue: { include: { attribute: true } },
            },
          },
        },
      },
    },
  });
}

export async function createTemplate(db: Db, input: CreateTemplateInput) {
  return db.quotationTemplate.create({
    data: {
      name: input.name,
      planId: input.planId,
      validityDays: input.validityDays,
      isActive: input.isActive,
    },
    include: { plan: { include: { product: { select: { id: true, name: true } } } } },
  });
}

export async function updateTemplate(db: Db, input: UpdateTemplateInput) {
  const { id, ...data } = input;
  return db.quotationTemplate.update({ where: { id }, data });
}

export async function archiveTemplate(db: Db, id: string) {
  return db.quotationTemplate.update({ where: { id }, data: { isActive: false } });
}

// ── Template lines ─────────────────────────────────────────────────────────────

/**
 * Replaces ALL lines for a template atomically.
 * Design: delete-then-insert in a transaction so the template always has a
 * consistent set of lines. No partial updates.
 */
export async function upsertTemplateLines(db: Db, input: UpsertTemplateLinesInput) {
  return db.$transaction(async (tx) => {
    // Delete existing lines for this template
    await tx.quotationTemplateLine.deleteMany({
      where: { templateId: input.templateId },
    });
    // Insert all new lines
    await tx.quotationTemplateLine.createMany({
      data: input.lines.map((line) => ({
        templateId: input.templateId,
        variantId: line.variantId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
    });
    // Return the template with fresh lines
    return tx.quotationTemplate.findUniqueOrThrow({
      where: { id: input.templateId },
      include: {
        lines: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true } },
                attributeValue: { include: { attribute: true } },
              },
            },
          },
        },
      },
    });
  });
}
