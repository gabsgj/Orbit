import { z } from "zod";

/**
 * Dashboard query filter schemas — shared by tRPC router and UI controls.
 * Single source of truth (PLAN §1 modularity contract).
 */

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional().or(z.date().optional()),
  endDate: z.string().datetime().optional().or(z.date().optional()),
});

export const dashboardFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  planId: z.string().uuid().optional(),
  periodDays: z.enum(["7", "30", "90", "365", "all"]).default("30"),
});

export type DashboardFilterInput = z.infer<typeof dashboardFilterSchema>;

export const renewalForecastFilterSchema = z.object({
  daysAhead: z.enum(["7", "30", "90"]).default("30"),
});

export type RenewalForecastFilterInput = z.infer<typeof renewalForecastFilterSchema>;
