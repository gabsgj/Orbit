"use client";

/**
 * "Run billing day" button (FR-BILL-02a) — triggers the billing engine and
 * shows the result in a modal. The demo script depends on the exact result
 * string: "<n> invoices created · <m> skipped (already billed) · <e> errors · <ms>ms".
 */
import { useState } from "react";
import { trpc } from "@/shared/trpc/react";
import { Badge, Button, Dialog } from "@/shared/ui";
import type { BillingRunResult } from "../service";

export function RunBillingButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [result, setResult] = useState<BillingRunResult | null>(null);

  const utils = trpc.useUtils();
  const run = trpc.billing.run.useMutation({
    onSettled: () => {
      utils.billing.runs.invalidate();
    },
  });

  const alreadyRunning = result?.status === "ALREADY_RUNNING";

  function handleClick() {
    run.mutate(undefined, {
      onSuccess: (data) => {
        setResult(data);
        setDialogOpen(true);
      },
    });
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {alreadyRunning && <Badge tone="warning">A run is already in progress</Badge>}
        <Button onClick={handleClick} disabled={run.isPending}>
          {run.isPending ? "Running…" : "Run billing day"}
        </Button>
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Billing run complete">
        {result ? (
          <div className="space-y-4">
            <p className="text-lg font-medium">
              {result.invoicesCreated} invoices created &middot; {result.skippedAlreadyBilled}{" "}
              skipped (already billed) &middot; {result.errors} errors &middot; {result.durationMs}ms
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Idempotent — re-running never bills the same period twice.
            </p>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
