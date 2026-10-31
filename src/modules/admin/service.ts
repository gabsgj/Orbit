import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * NumberingService — gapless, race-safe document numbers (SRS §6 rule 8).
 * Sequences are incremented with an UPSERT … increment inside the caller's
 * transaction: the row lock serializes concurrent issuers, so two simultaneous
 * invoices can never receive the same number. Format: PREFIX-YEAR-00042.
 */

type Tx = Prisma.TransactionClient | PrismaClient;

export type DocType = "SUB" | "INV";

export async function nextNumber(tx: Tx, docType: DocType, date: Date): Promise<string> {
  const year = date.getFullYear();
  const row = await tx.sequence.upsert({
    where: { docType_year: { docType, year } },
    create: { docType, year, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
    select: { lastNumber: true },
  });
  const n = typeof row.lastNumber === "bigint" ? row.lastNumber : BigInt(row.lastNumber);
  return `${docType}-${year}-${n.toString().padStart(5, "0")}`;
}
