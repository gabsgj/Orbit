import { cn } from "@/shared/lib/utils";
import type { HTMLAttributes, TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes, ReactNode } from "react";

/** Minimal table primitives (shared/ui). Dense-data pattern (PLAN §11 Gate 1):
 *  sticky header, readable rows; TanStack Table wiring arrives with Pavithra. */
export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[hsl(var(--border))]">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}
export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="sticky top-0 bg-[hsl(var(--muted))]" {...props} />;
}
export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-[hsl(var(--border))]" {...props} />;
}
export function TR(props: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className="hover:bg-[hsl(var(--muted))]/50" {...props} />;
}
export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]", className)} {...props} />;
}
export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3", className)} {...props} />;
}

/** Designed empty state for every list (Gate 1 checklist — never blank). */
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[hsl(var(--border))] py-16 text-center">
      <p className="font-medium">{title}</p>
      {hint ? <p className="text-sm text-[hsl(var(--muted-foreground))]">{hint}</p> : null}
      {action}
    </div>
  );
}
