import { describe, it, expect } from "vitest";
import { addPeriod, isPastDue, toISODate } from "./dates";

describe("addPeriod", () => {
  it("advances daily and weekly", () => {
    expect(addPeriod(new Date("2026-01-31"), "DAILY")).toEqual(new Date("2026-02-01"));
    expect(addPeriod(new Date("2026-01-31"), "WEEKLY")).toEqual(new Date("2026-02-07"));
  });
  it("clamps month-end: Jan 31 + 1 MONTH → Feb 28/29 (not Mar 3)", () => {
    expect(addPeriod(new Date("2026-01-31"), "MONTHLY")).toEqual(new Date("2026-02-28"));
    expect(addPeriod(new Date("2028-01-31"), "MONTHLY")).toEqual(new Date("2028-02-29")); // leap
  });
  it("advances yearly with clamp", () => {
    expect(addPeriod(new Date("2028-02-29"), "YEARLY")).toEqual(new Date("2029-02-28"));
  });
  it("formats ISO date and detects overdue", () => {
    expect(toISODate(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01-01");
    expect(isPastDue(new Date("2026-01-01"), new Date("2026-06-01"))).toBe(true);
    expect(isPastDue(new Date("2026-12-31"), new Date("2026-06-01"))).toBe(false);
  });
});
