"use client";

/**
 * Billing runs audit table (FR-BILL-06 / FR-ADM-02).
 * Polls every 10s so cron runs appear live during the demo (FR-DASH-07).
 */
import { trpc } from "@/shared/trpc/react";
import { Badge, EmptyState, Skeleton, Table, TBody, TD, TH, THead, TR, statusTone } from "@/shared/ui";
import { formatDate } from "@/shared/lib/money";
import type { BillingTriggerType } from "@prisma/client";

const triggerTone: Record<BillingTriggerType, "info" | "neutral" | "warning"> = {
  MANUAL: "info",
  CRON_LOCAL: "neutral",
  CRON_VERCEL: "neutral",
};

export function BillingRunsTable() {
  const q = trpc.billing.runs.useQuery(undefined, {
    refetchInterval: 10_000,
  });

  if (q.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const runs = q.data ?? [];

  if (runs.length === 0) {
    return (
      <EmptyState
        title="No billing runs yet — run your first billing day"
      />
    );
  }

  return (
    <Table>
      <THead>
        <tr>
          <TH>Started</TH>
          <TH>Trigger</TH>
          <TH>Triggered by</TH>
          <TH className="text-right">Created</TH>
          <TH className="text-right">Skipped</TH>
          <TH className="text-right">Errors</TH>
          <TH>Status</TH>
          <TH className="text-right">Duration</TH>
        </tr>
      </THead>
      <TBody>
        {runs.map((run) => (
          <TR key={run.id}>
            <TD className="whitespace-nowrap">{formatDate(run.startedAt)}</TD>
            <TD>
              <Badge tone={triggerTone[run.triggerType]}>{run.triggerType}</Badge>
            </TD>
            <TD>{run.triggeredBy?.email ?? "cron"}</TD>
            <TD className="text-right">{run.invoicesCreated}</TD>
            <TD className="text-right">{run.skippedAlreadyBilled}</TD>
            <TD className="text-right">{run.errors}</TD>
            <TD>
              <Badge tone={statusTone[run.status]}>{run.status}</Badge>
            </TD>
            <TD className="whitespace-nowrap text-right">
              {run.finishedAt
                ? `${new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()}ms`
                : "—"}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
