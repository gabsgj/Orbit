import React from "react";
import { Badge, statusTone } from "@/shared/ui";
import type { InvoiceStatus } from "@prisma/client";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  isOverdue?: boolean;
  className?: string;
}

const statusLabels: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  CONFIRMED: "Confirmed",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export function InvoiceStatusBadge({ status, isOverdue, className = "" }: InvoiceStatusBadgeProps) {
  if (isOverdue && status === "CONFIRMED") {
    return (
      <Badge tone="danger" dot className={className}>
        Overdue
      </Badge>
    );
  }

  const tone = statusTone[status] ?? "neutral";
  const label = statusLabels[status] ?? status;

  return (
    <Badge tone={tone} dot className={className}>
      {label}
    </Badge>
  );
}
