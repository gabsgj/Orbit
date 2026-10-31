import * as React from "react";
import { cn } from "@/shared/lib/utils";

export type BadgeVariant =
  | "default"
  | "active"
  | "paid"
  | "overdue"
  | "cancelled"
  | "warning"
  | "paused"
  | "neutral"
  | "draft"
  | "quotation"
  | "closed"
  | "running"
  | "done"
  | "failed";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-xs)] text-xs font-medium tracking-tight whitespace-nowrap select-none border";

  const variantStyles: Record<BadgeVariant, string> = {
    default:
      "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-transparent",
    active:
      "bg-[hsl(var(--status-active-bg))] text-[hsl(var(--status-active-ink))] border-[hsl(var(--status-active-ink))]/20",
    paid:
      "bg-[hsl(var(--status-active-bg))] text-[hsl(var(--status-active-ink))] border-[hsl(var(--status-active-ink))]/20",
    done:
      "bg-[hsl(var(--status-active-bg))] text-[hsl(var(--status-active-ink))] border-[hsl(var(--status-active-ink))]/20",
    overdue:
      "bg-[hsl(var(--status-overdue-bg))] text-[hsl(var(--status-overdue-ink))] border-[hsl(var(--status-overdue-ink))]/20",
    cancelled:
      "bg-[hsl(var(--status-overdue-bg))] text-[hsl(var(--status-overdue-ink))] border-[hsl(var(--status-overdue-ink))]/20",
    failed:
      "bg-[hsl(var(--status-overdue-bg))] text-[hsl(var(--status-overdue-ink))] border-[hsl(var(--status-overdue-ink))]/20",
    warning:
      "bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning-ink))] border-[hsl(var(--status-warning-ink))]/20",
    paused:
      "bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning-ink))] border-[hsl(var(--status-warning-ink))]/20",
    running:
      "bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning-ink))] border-[hsl(var(--status-warning-ink))]/20",
    neutral:
      "bg-[hsl(var(--status-neutral-bg))] text-[hsl(var(--status-neutral-ink))] border-[hsl(var(--status-neutral-ink))]/15",
    draft:
      "bg-[hsl(var(--status-neutral-bg))] text-[hsl(var(--status-neutral-ink))] border-[hsl(var(--status-neutral-ink))]/15",
    quotation:
      "bg-[hsl(var(--status-neutral-bg))] text-[hsl(var(--status-neutral-ink))] border-[hsl(var(--status-neutral-ink))]/15",
    closed:
      "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]",
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: "bg-current",
    active: "bg-[hsl(var(--status-active-ink))]",
    paid: "bg-[hsl(var(--status-active-ink))]",
    done: "bg-[hsl(var(--status-active-ink))]",
    overdue: "bg-[hsl(var(--status-overdue-ink))]",
    cancelled: "bg-[hsl(var(--status-overdue-ink))]",
    failed: "bg-[hsl(var(--status-overdue-ink))]",
    warning: "bg-[hsl(var(--status-warning-ink))]",
    paused: "bg-[hsl(var(--status-warning-ink))]",
    running: "bg-[hsl(var(--status-warning-ink))] animate-pulse",
    neutral: "bg-[hsl(var(--status-neutral-ink))]",
    draft: "bg-[hsl(var(--status-neutral-ink))]",
    quotation: "bg-[hsl(var(--status-neutral-ink))]",
    closed: "bg-[hsl(var(--muted-foreground))]",
  };

  return (
    <div className={cn(baseStyles, variantStyles[variant], className)} {...props}>
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </div>
  );
}

