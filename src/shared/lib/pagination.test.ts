import { describe, it, expect } from "vitest";
import { keysetArgs, toPage, cursorInput, DEFAULT_TAKE, MAX_TAKE } from "./pagination";

const rows = (n: number, start = 1) =>
  Array.from({ length: n }, (_, i) => ({ id: `row-${String(start + i).padStart(3, "0")}` }));

describe("keysetArgs — Prisma findMany keyset args", () => {
  it("defaults to take 25 and fetches take + 1 probe rows", () => {
    expect(keysetArgs()).toEqual({ take: DEFAULT_TAKE + 1 });
    expect(keysetArgs(undefined, undefined)).toEqual({ take: 26 });
  });

  it("omits cursor/skip entirely on the first page (no cursor given)", () => {
    const args = keysetArgs(undefined, 10);
    expect(args).toEqual({ take: 11 });
    expect("cursor" in args).toBe(false);
    expect("skip" in args).toBe(false);
  });

  it("clamps take into 1..100", () => {
    expect(keysetArgs(undefined, 0).take).toBe(2); // 1 + 1
    expect(keysetArgs(undefined, -5).take).toBe(2);
    expect(keysetArgs(undefined, 1).take).toBe(2);
    expect(keysetArgs(undefined, 100).take).toBe(MAX_TAKE + 1);
    expect(keysetArgs(undefined, 101).take).toBe(MAX_TAKE + 1);
    expect(keysetArgs(undefined, 9999).take).toBe(MAX_TAKE + 1);
  });

  it("truncates fractional take and falls back to default on NaN", () => {
    expect(keysetArgs(undefined, 10.9).take).toBe(11);
    expect(keysetArgs(undefined, Number.NaN).take).toBe(DEFAULT_TAKE + 1);
  });

  it("passes the cursor through with skip: 1 to hop over the anchor row", () => {
    expect(keysetArgs("inv_009", 25)).toEqual({
      take: 26,
      cursor: { id: "inv_009" },
      skip: 1,
    });
    // cursor is passed through verbatim — no parsing/rewriting
    expect(keysetArgs("018f3c2a-7b1d-4e9f-a5c6-2d8e0f1a3b4c", 5).cursor).toEqual({
      id: "018f3c2a-7b1d-4e9f-a5c6-2d8e0f1a3b4c",
    });
  });

  it("supports a custom unique cursor key (typed)", () => {
    expect(keysetArgs("SUB-2026-00042", 10, "number")).toEqual({
      take: 11,
      cursor: { number: "SUB-2026-00042" },
      skip: 1,
    });
  });
});

describe("toPage — fold take+1 rows into { items, nextCursor }", () => {
  it("exactly `take` rows → last page, nextCursor null, nothing sliced", () => {
    const result = toPage(rows(25), 25);
    expect(result.items).toHaveLength(25);
    expect(result.items.at(-1)!.id).toBe("row-025");
    expect(result.nextCursor).toBeNull();
  });

  it("take + 1 rows → next page exists; cursor is the last RETURNED item, not the probe", () => {
    const result = toPage(rows(26), 25);
    expect(result.items).toHaveLength(25);
    expect(result.items.at(-1)!.id).toBe("row-025");
    expect(result.nextCursor).toBe("row-025"); // probe row-026 is dropped, not exposed
    expect(result.items.find((r) => r.id === "row-026")).toBeUndefined();
  });

  it("chains: nextCursor feeds back into keysetArgs for the following page", () => {
    // DB holds row-001..row-010; walk pages of 4.
    const db = rows(10);
    const q = (cursor?: string) => {
      const args = keysetArgs(cursor, 4);
      const start = cursor ? db.findIndex((r) => r.id === cursor) + args.skip! : 0;
      return toPage(db.slice(start, start + args.take), 4);
    };

    const p1 = q();
    expect(p1.items.map((r) => r.id)).toEqual(["row-001", "row-002", "row-003", "row-004"]);
    expect(p1.nextCursor).toBe("row-004");

    const p2 = q(p1.nextCursor!);
    expect(p2.items.map((r) => r.id)).toEqual(["row-005", "row-006", "row-007", "row-008"]);
    expect(p2.nextCursor).toBe("row-008");

    const p3 = q(p2.nextCursor!);
    expect(p3.items.map((r) => r.id)).toEqual(["row-009", "row-010"]);
    expect(p3.nextCursor).toBeNull(); // partial last page → no more pages
  });

  it("empty result → empty page, nextCursor null", () => {
    expect(toPage([], 25)).toEqual({ items: [], nextCursor: null });
  });

  it("single row with take 1 → nextCursor is that row's id", () => {
    const result = toPage(rows(2), 1);
    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBe("row-001");
  });
});

describe("cursorInput — zod schema for module list inputs", () => {
  it("applies defaults when the input is empty", () => {
    expect(cursorInput.parse({})).toEqual({ cursor: undefined, take: 25 });
  });

  it("coerces query-string take and clamps are enforced by min/max", () => {
    expect(cursorInput.parse({ take: "10" })).toEqual({ cursor: undefined, take: 10 });
    expect(() => cursorInput.parse({ take: 0 })).toThrow();
    expect(() => cursorInput.parse({ take: 101 })).toThrow();
    expect(() => cursorInput.parse({ take: 2.5 })).toThrow();
  });

  it("accepts an optional cursor string", () => {
    expect(cursorInput.parse({ cursor: "inv_009", take: 50 })).toEqual({
      cursor: "inv_009",
      take: 50,
    });
    expect(() => cursorInput.parse({ cursor: "" })).toThrow();
  });
});
