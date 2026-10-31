import { cn } from "@/shared/lib/utils";
import type { HTMLAttributes } from "react";

/** Badge primitive (shared/ui) — status pills. */
type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-sky-100 text-sky-800",
};

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}

/** Shared status→tone map (subscription + invoice statuses). Keep consistent everywhere. */
export const statusTone: Record<string, Tone> = {
  DRAFT: "neutral",
  QUOTATION: "info",
  CONFIRMED: "info",
  ACTIVE: "success",
  PAUSED: "warning",
  CLOSED: "neutral",
  PAID: "success",
  CANCELLED: "danger",
  RUNNING: "warning",
  DONE: "success",
  FAILED: "danger",
};
