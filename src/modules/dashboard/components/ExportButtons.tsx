"use client";

import * as React from "react";
import { Button } from "@/shared/ui/button";

/**
 * FR-DASH-06 (P2) — CSV export buttons for the finance dashboard.
 * Navigates to the streaming export routes; the browser handles the download.
 * Date-range filter state on the dashboard is view-level (period chips), so
 * exports cover the full filtered dataset via the route defaults.
 */

function DownloadIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function ExportButtons() {
  const handleExportInvoices = React.useCallback(() => {
    window.location.href = "/api/export/invoices";
  }, []);

  const handleExportPayments = React.useCallback(() => {
    window.location.href = "/api/export/payments";
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportInvoices}
        className="h-7 text-xs px-2.5 gap-1.5"
      >
        <DownloadIcon size={12} />
        Export invoices CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPayments}
        className="h-7 text-xs px-2.5 gap-1.5"
      >
        <DownloadIcon size={12} />
        Export payments CSV
      </Button>
    </div>
  );
}
