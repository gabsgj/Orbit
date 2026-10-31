/**
 * modules/admin — CLIENT-SAFE barrel (PLAN §1 rule 1).
 * Browser pages import from here. NEVER import server-only code
 * (@trpc/server, prisma, service) into this file.
 */
export { AuditLogList } from "./components/audit-log-list";
export { OutboxList } from "./components/outbox-list";
export { StaffView } from "./components/staff-view";
