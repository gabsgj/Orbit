import { cn } from "@/shared/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

/** Card primitive (shared/ui — presentational). */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-[hsl(var(--border))] bg-white p-6 shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
