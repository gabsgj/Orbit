"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import type { ReactNode } from "react";

const DialogContext = React.createContext<{
  open: boolean;
  onClose: () => void;
}>({
  open: false,
  onClose: () => {},
});

export function Dialog({
  open,
  onClose,
  onOpenChange,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ open, onClose: handleClose }}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        role="dialog"
        aria-modal="true"
        onClick={handleClose}
      >
        {title ? (
          <div
            className={cn(
              "w-full rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 shadow-xl text-[hsl(var(--foreground))]",
              wide ? "max-w-2xl" : "max-w-md",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                ✕
              </button>
            </div>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </DialogContext.Provider>
  );
}

export function DialogContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { onClose } = React.useContext(DialogContext);
  return (
    <div
      className={cn(
        "relative w-full max-w-lg rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-lg text-[hsl(var(--foreground))]",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        type="button"
        className="absolute right-4 top-4 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-sm font-semibold"
      >
        ✕
      </button>
      {children}
    </div>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 text-left mb-4", className)} {...props} />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-base font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-[hsl(var(--muted-foreground))]", className)} {...props} />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 pt-4 border-t border-[hsl(var(--border))]",
        className,
      )}
      {...props}
    />
  );
}
