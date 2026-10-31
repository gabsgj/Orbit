import { describe, it, expect } from "vitest";
import { formatINR, formatDate } from "./money";

describe("money/date formatters (edge-only, en-IN)", () => {
  it("formats INR with the Indian digit grouping", () => {
    expect(formatINR(1559)).toContain("1,559");
    expect(formatINR("123456.5")).toContain("1,23,456.50");
  });
  it("formats dates and handles nulls", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(new Date("2026-10-31"))).not.toBe("—");
  });
});
