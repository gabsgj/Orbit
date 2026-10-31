"use client";

/**
 * Billing runs (FR-ADM-02 / FR-BILL-06) — audit of every billing execution.
 * Reuses trpc.billing.runs (same procedure as the Billing page).
 */
import { trpc } from "@/shared/trpc/react";
import { Badge, Card, CardHeader, EmptyState, Skeleton, statusTone, Table, TBody, TD, TH, THead, TR } from "@/shared/ui";
import { formatDate } from "@/shared/lib/money";

export default function BillingRunsPage() {
  const q = trpc.billing.runs.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing runs</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Every execution of the billing engine — manual or scheduled — is audited
          here with invoices created, skips and errors.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Run history"
          description="Newest first. A run that found nothing new to bill reports all due subscriptions as skipped."
        />
        {q.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : q.data && q.data.length === 0 ? (
          <EmptyState
            title="No billing runs yet"
            hint="Run a billing day from the Billing page, or wait for the scheduler."
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Started</TH>
                <TH>Finished</TH>
                <TH>Trigger</TH>
                <TH>By</TH>
                <TH className="text-right">Invoices</TH>
                <TH className="text-right">Skipped</TH>
                <TH className="text-right">Errors</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {(q.data ?? []).map((run) => (
                <TR key={run.id}>
                  <TD className="whitespace-nowrap">{formatDate(run.startedAt)}</TD>
                  <TD className="whitespace-nowrap">{formatDate(run.finishedAt)}</TD>
                  <TD>
                    <Badge tone={run.triggerType === "MANUAL" ? "info" : "neutral"}>
                      {run.triggerType}
                    </Badge>
                  </TD>
                  <TD>{run.triggeredBy?.email ?? "—"}</TD>
                  <TD className="text-right tabular-nums">{run.invoicesCreated}</TD>
                  <TD className="text-right tabular-nums">{run.skippedAlreadyBilled}</TD>
                  <TD className="text-right tabular-nums">{run.errors}</TD>
                  <TD>
                    <Badge tone={statusTone[run.status] ?? "neutral"}>{run.status}</Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
