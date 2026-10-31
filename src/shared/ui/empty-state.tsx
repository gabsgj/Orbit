import * as React from "react";
import { cn } from "@/shared/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

