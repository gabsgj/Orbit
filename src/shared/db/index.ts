import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton — avoids exhausting connections during Next.js
 * hot-reload in dev. The ONLY PrismaClient instance in the app.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
