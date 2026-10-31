import React from "react";
import { Badge, statusTone } from "@/shared/ui";
import type { SubscriptionStatus } from "@prisma/client";

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus;
  className?: string;
}

const statusLabels: Record<SubscriptionStatus, string> = {
  DRAFT: "Draft",
  QUOTATION: "Quotation",
  CONFIRMED: "Confirmed",
  ACTIVE: "Active",
  PAUSED: "Paused",
  CLOSED: "Closed",
};

export function SubscriptionStatusBadge({ status, className = "" }: SubscriptionStatusBadgeProps) {
  const tone = statusTone[status] ?? "neutral";
  const label = statusLabels[status] ?? status;

  return (
    <Badge tone={tone} dot className={className}>
      {label}
    </Badge>
  );
}
