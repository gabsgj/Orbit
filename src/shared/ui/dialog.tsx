"use client";

import { cn } from "@/shared/lib/utils";
import type { ReactNode } from "react";

/** Minimal modal dialog (shared/ui). No portal lib — fixed overlay; replaced by
 *  a full shadcn Dialog at Gate 0 without changing call-site props. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={cn("w-full rounded-lg bg-white p-6 shadow-xl", wide ? "max-w-2xl" : "max-w-md")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-[hsl(var(--muted-foreground))] hover:text-black">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
