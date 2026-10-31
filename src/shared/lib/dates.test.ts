import { describe, it, expect } from "vitest";
import { addPeriod } from "./dates";

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
});
