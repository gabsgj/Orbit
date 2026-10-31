import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/auth";

/**
 * Staff/admin shell (AppShell placeholder — Pavithra restyles at UI Gate 0).
 * Guards the whole (app) group server-side; renders the nav + page.
 * AGENTS MAY NOT EDIT THIS FILE (orchestrator-owned to avoid agent conflicts).
 */
const NAV: Array<{ href: string; label: string }> = [
  { href: "/billing", label: "Billing" },
  { href: "/admin/runs", label: "Billing runs" },
  { href: "/admin/outbox", label: "Mail outbox" },
  { href: "/admin/audit", label: "Audit log" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/billing");
  if (session.user.role === "CUSTOMER") redirect("/portal");

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-4">
        <div className="mb-6 px-2">
          <span className="text-lg font-bold tracking-tight">Orbit</span>
          <span className="ml-2 rounded bg-[hsl(var(--primary))] px-1.5 py-0.5 text-[10px] font-semibold text-[hsl(var(--primary-foreground))]">
            {session.user.role}
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
