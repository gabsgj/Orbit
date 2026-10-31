/**
 * Date helpers (shared kernel — generic, no domain types).
 */

export type BillingPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

/**
 * Advance a date by one billing period, clamping to month-end where needed:
 * Jan 31 + 1 MONTH → Feb 28/29 (not Mar 3). Used by the billing engine to
 * compute period windows [start, start+period).
 */
export function addPeriod(date: Date, period: BillingPeriod): Date {
  const d = new Date(date);
  const day = d.getDate();
  switch (period) {
    case "DAILY":
      d.setDate(day + 1);
      break;
    case "WEEKLY":
      d.setDate(day + 7);
      break;
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      if (d.getDate() < day) d.setDate(0); // clamped into previous month = month-end
      break;
    case "YEARLY":
      d.setFullYear(d.getFullYear() + 1);
      if (d.getDate() < day) d.setDate(0);
      break;
  }
  return d;
}

/**
 * Strip time — billing works on CALENDAR DAYS, so all day-anchored values are
 * UTC midnights. This round-trips perfectly through Prisma (which serializes
 * Date → UTC) and the pg driver's DATE↔JS mapping (UTC midnight in, UTC
 * midnight out), making the entire billing domain timezone-independent.
 * Derive the day from UTC components when the source is UTC-midnight
 * ("YYYY-MM-DD" parses, DB read-backs), else from local components (new Date()).
 */
export function dateOnly(d: Date): Date {
  const isUtcMidnight =
    d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
  return isUtcMidnight
    ? new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    : new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}
