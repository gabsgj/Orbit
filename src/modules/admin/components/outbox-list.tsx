"use client";

/**
 * Mail outbox list (FR-MAIL-02) — client component.
 * Keyset pagination via nextCursor (NFR-PERF-01: no OFFSET): each "Load more"
 * appends the next page to an in-memory accumulator (`pages`).
 */
import { useState } from "react";
import Link from "next/link";
import { keepPreviousData } from "@tanstack/react-query";
import { trpc } from "@/shared/trpc/react";
import { Badge, Button, EmptyState, Table, TBody, TD, TH, THead, TR } from "@/shared/ui";
import { formatDate } from "@/shared/lib/money";
import type { OutboxKind } from "@prisma/client";

const kindTone: Record<OutboxKind, "info" | "success" | "warning"> = {
  RESET: "info",
  INVOICE_SENT: "success",
  REMINDER: "warning",
};

type OutboxRow = {
  id: string;
  toEmail: string;
  subject: string;
  kind: OutboxKind;
  createdAt: Date;
  sentAt: Date | null;
};

export function OutboxList() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [pages, setPages] = useState<OutboxRow[]>([]);

  const q = trpc.admin.outbox.useQuery(
    { cursor, take: 25 },
    { placeholderData: keepPreviousData },
  );

  const items = [...pages, ...(q.data?.items ?? [])];
  const nextCursor = q.data?.nextCursor ?? null;

  return (
    <div className="space-y-4">
      {items.length === 0 && !q.isLoading ? (
        <EmptyState
          title="No mail staged"
          hint="The outbox fills when invoices are sent or resets are requested."
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Created</TH>
              <TH>To</TH>
              <TH>Subject</TH>
              <TH>Kind</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {items.map((m) => (
              <TR key={m.id}>
                <TD className="whitespace-nowrap">{formatDate(m.createdAt)}</TD>
                <TD>
                  <Link
                    href={`/admin/outbox/${m.id}`}
                    className="font-medium text-[hsl(var(--primary))] hover:underline"
                  >
                    {m.toEmail}
                  </Link>
                </TD>
                <TD className="max-w-md truncate">{m.subject}</TD>
                <TD>
                  <Badge tone={kindTone[m.kind]}>{m.kind}</Badge>
                </TD>
                <TD>
                  {m.sentAt ? (
                    <Badge tone="success">Sent</Badge>
                  ) : (
                    <Badge tone="warning">Queued</Badge>
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
