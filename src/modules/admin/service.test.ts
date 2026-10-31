import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { nextNumber } from "./service";

/**
 * NumberingService tests — run against the dedicated orbit_test database
 * (created in Phase 1; see README). Requires local PostgreSQL running.
 */
const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.TEST_DATABASE_URL ??
        "postgresql://orbit_app:orbit@localhost:5432/orbit_test",
    },
  },
});

beforeAll(async () => {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "sequences" RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("nextNumber", () => {
  it("formats PREFIX-YEAR-000NN and increments within the year", async () => {
    const d = new Date("2026-03-01");
    const first = await prisma.$transaction((tx) => nextNumber(tx, "SUB", d));
    const second = await prisma.$transaction((tx) => nextNumber(tx, "SUB", d));
    expect(first).toBe("SUB-2026-00001");
    expect(second).toBe("SUB-2026-00002");
  });

  it("tracks doc types and years independently", async () => {
    const inv26 = await prisma.$transaction((tx) =>
      nextNumber(tx, "INV", new Date("2026-06-15")),
    );
    const inv27 = await prisma.$transaction((tx) =>
      nextNumber(tx, "INV", new Date("2027-01-01")),
    );
    expect(inv26).toBe("INV-2026-00001");
    expect(inv27).toBe("INV-2027-00001");
  });

  it("never issues duplicates under concurrency (row lock serializes issuers)", async () => {
    const d = new Date("2028-01-01");
    const numbers = await Promise.all(
      Array.from({ length: 5 }, () =>
        prisma.$transaction((tx) => nextNumber(tx, "SUB", d)),
      ),
    );
    expect(new Set(numbers).size).toBe(5);
  });
});
