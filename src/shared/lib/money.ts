/**
 * Money formatting — the ONLY place currency is formatted (PLAN §1 patterns).
 * Storage is Prisma Decimal(12,2); format only at the edge.
 */
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatINR(value: number | string | { toString(): string }): string {
  return inr.format(Number(value.toString()));
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return dateFmt.format(new Date(value));
}
