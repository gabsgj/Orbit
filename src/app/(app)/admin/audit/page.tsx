/**
 * Audit log (FR-ADM-03) — global, append-only trail of sensitive actions
 * (status changes, discounts, payments). List lives in a client component.
 */
import { AuditLogList } from "@/modules/admin/client";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Every sensitive action recorded with who, what and when. Expand a
          row&rsquo;s meta for the full payload.
        </p>
      </div>
      <AuditLogList />
    </div>
  );
}
