"use client";

import * as React from "react";

/**
 * FR-DASH-06 (P2) — CSV export buttons for the finance dashboard.
 * Navigates to the streaming export routes; the browser handles the download.
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
      <button
        type="button"
        onClick={handleExportInvoices}
        className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors cursor-pointer"
      >
        <DownloadIcon size={12} />
        Invoices CSV
      </button>
      <button
        type="button"
        onClick={handleExportPayments}
        className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors cursor-pointer"
      >
        <DownloadIcon size={12} />
        Payments CSV
      </button>
    </div>
  );
}
