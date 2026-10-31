"use client";

/**
 * Audit log list (FR-ADM-03) — client component.
 * Same keyset "Load more" pattern as the outbox (nextCursor, no OFFSET).
 */
import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { trpc } from "@/shared/trpc/react";
import { Badge, Button, EmptyState, Table, TBody, TD, TH, THead, TR } from "@/shared/ui";
import { formatDate } from "@/shared/lib/money";
import type { Prisma } from "@prisma/client";

type AuditRow = {
  id: string;
  at: Date;
  entity: string;
  entityId: string;
  action: string;
  meta: Prisma.JsonValue | null;
  user: { email: string };
};

export function AuditLogList() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [pages, setPages] = useState<AuditRow[]>([]);

  const q = trpc.admin.auditLog.useQuery(
    { cursor, take: 25 },
    { placeholderData: keepPreviousData },
  );

  const items = [...pages, ...(q.data?.items ?? [])];
  const nextCursor = q.data?.nextCursor ?? null;

  return (
    <div className="space-y-4">
      {items.length === 0 && !q.isLoading ? (
        <EmptyState
          title="Nothing audited yet"
          hint="Sensitive actions — status changes, payments, discounts — are recorded here."
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>At</TH>
              <TH>User</TH>
              <TH>Entity</TH>
              <TH>Action</TH>
              <TH>Meta</TH>
            </tr>
          </THead>
          <TBody>
            {items.map((row) => (
              <TR key={row.id}>
                <TD className="whitespace-nowrap">{formatDate(row.at)}</TD>
                <TD>{row.user.email}</TD>
                <TD>
                  <Badge tone="neutral">{row.entity}</Badge>
                </TD>
                <TD>
                  <Badge tone="info">{row.action}</Badge>
                </TD>
                <TD className="max-w-sm">
                  {row.meta ? (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                        View JSON
                      </summary>
                      <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-[hsl(var(--muted))] p-2">
                        {JSON.stringify(row.meta, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-[hsl(var(--muted-foreground))]">—</span>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {nextCursor ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            disabled={q.isFetching}
            onClick={() => {
              setPages((prev) => [...prev, ...(q.data?.items ?? [])]);
              setCursor(nextCursor);
            }}
          >
            {q.isFetching ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
