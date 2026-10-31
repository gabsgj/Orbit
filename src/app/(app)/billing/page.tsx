import { Card, CardHeader } from "@/shared/ui";
import { RunBillingButton, BillingRunsTable } from "@/modules/billing/client";

/**
 * Billing day page (FR-BILL-02 / FR-BILL-06) — the demo centerpiece.
 * Staff/admin trigger a billing run and watch the audit trail update live.
 */
export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Billing day</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Generate invoices for every subscription whose billing date has arrived.
          The engine is idempotent and concurrency-safe — re-running never bills
          the same period twice.
        </p>
      </div>

      <Card className="rounded-[var(--radius-lg)] shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--border))] border-0">
        <CardHeader
          title="Run billing"
          description="Trigger a billing run for all due subscriptions right now."
          actions={<RunBillingButton />}
        />
      </Card>

      <Card className="rounded-[var(--radius-lg)] shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--border))] border-0">
        <CardHeader
          title="Runs history"
          description="Every billing run — manual or scheduled — is audited here."
        />
        <BillingRunsTable />
      </Card>
    </div>
  );
}
