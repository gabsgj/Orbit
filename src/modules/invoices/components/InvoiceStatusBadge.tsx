import React from "react";
import type { InvoiceStatus } from "@prisma/client";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  isOverdue?: boolean;
  className?: string;
}

export function InvoiceStatusBadge({ status, isOverdue, className = "" }: InvoiceStatusBadgeProps) {
  if (isOverdue && status === "CONFIRMED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-800 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
        Overdue
      </span>
    );
  }

  const styles: Record<InvoiceStatus, { bg: string; text: string; border: string; dot: string; label: string }> = {
    DRAFT: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
      dot: "bg-slate-400",
      label: "Draft",
    },
    CONFIRMED: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      dot: "bg-blue-600",
      label: "Confirmed",
    },
    PAID: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-600",
      label: "Paid",
    },
    CANCELLED: {
      bg: "bg-zinc-100",
      text: "text-zinc-600",
      border: "border-zinc-200",
      dot: "bg-zinc-400",
      label: "Cancelled",
    },
  };

  const c = styles[status] ?? styles.DRAFT;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text} ${c.border} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

