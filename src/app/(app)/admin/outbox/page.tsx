/**
 * Mail outbox (FR-MAIL-02) — proves email flows work offline: password resets
 * and invoice emails are staged here instead of going through SMTP.
 * The interactive list lives in a client component (modules/admin/components).
 */
import { OutboxList } from "@/modules/admin/client";

export default function OutboxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Mail outbox</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          All outgoing mail is staged here — password resets, invoice-sent notices,
          reminders. Open a message to view it and follow its action link.
        </p>
      </div>
      <OutboxList />
    </div>
  );
}
