import type { Prisma, PrismaClient } from "@prisma/client";

type Tx = Prisma.TransactionClient | PrismaClient;

/**
 * Race-safe gapless document numbering from `sequences` table.
 * Formats: SUB-YYYY-XXXXX, INV-YYYY-XXXXX
 */
export async function nextSequenceNumber(
  tx: Tx,
  docType: "SUB" | "INV",
  date: Date = new Date(),
): Promise<string> {
  const year = date.getFullYear();

  const seq = await tx.sequence.upsert({
    where: {
      docType_year: {
        docType,
        year,
      },
    },
    update: {
      lastNumber: {
        increment: 1,
      },
    },
    create: {
      docType,
      year,
      lastNumber: 1,
    },
  });

  const num = Number(seq.lastNumber);
  const formatted = String(num).padStart(5, "0");
  return `${docType}-${year}-${formatted}`;
}

