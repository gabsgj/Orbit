/**
 * Staged email detail (FR-MAIL-02) — server component reading the outbox row
 * directly via Prisma (read-only page; tRPC would add no value here).
 * The "Open link" button surfaces the email's first href — this is how the
 * demo clicks a password-reset link with zero SMTP/internet.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/shared/db";
import { Badge, Button, Card, CardHeader } from "@/shared/ui";
import { formatDate } from "@/shared/lib/money";
import type { OutboxKind } from "@prisma/client";

const kindTone: Record<OutboxKind, "info" | "success" | "warning"> = {
  RESET: "info",
  INVOICE_SENT: "success",
  REMINDER: "warning",
};

/** First href in the rendered email (reset link / invoice link). */
function firstHref(html: string): string | null {
  const m = html.match(/href="([^"]+)"/i);
  return m?.[1] ?? null;
}

export default async function OutboxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mail = await prisma.emailOutbox.findUnique({ where: { id } });
  if (!mail) notFound();

  const href = firstHref(mail.bodyHtml);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/outbox"
          className="text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          ← Back to outbox
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{mail.subject}</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Staged {formatDate(mail.createdAt)} · to {mail.toEmail}
        </p>
      </div>

      <Card>
        <CardHeader
          title="Message"
          description="Exactly as staged by the app — no SMTP involved."
          actions={
            <div className="flex items-center gap-2">
              <Badge tone={kindTone[mail.kind]}>{mail.kind}</Badge>
              {mail.sentAt ? (
                <Badge tone="success">Sent {formatDate(mail.sentAt)}</Badge>
              ) : (
                <Badge tone="warning">Queued</Badge>
              )}
            </div>
          }
        />

        <dl className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">To</dt>
            <dd className="mt-1">{mail.toEmail}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Created</dt>
            <dd className="mt-1">{formatDate(mail.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Kind</dt>
            <dd className="mt-1">{mail.kind}</dd>
          </div>
        </dl>

        {href ? (
          <div className="mb-4">
            <a href={href} target="_blank" rel="noreferrer">
              <Button>Open link</Button>
            </a>
            <p className="mt-2 break-all text-xs text-[hsl(var(--muted-foreground))]">{href}</p>
          </div>
        ) : null}

        {/* Admin-only preview of our own staged content (never user-supplied
            input), so dangerouslySetInnerHTML is acceptable here. */}
        <div
          className="rounded-lg border border-[hsl(var(--border))] bg-white p-6"
          dangerouslySetInnerHTML={{ __html: mail.bodyHtml }}
        />
      </Card>
    </div>
  );
}
