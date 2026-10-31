import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/auth";
import { AppShell } from "@/shared/ui";

/**
 * Staff/admin shell (AppShell placeholder — Pavithra restyles at UI Gate 0).
 * Guards the whole (app) group server-side; renders the nav + page.
 * AGENTS MAY NOT EDIT THIS FILE (orchestrator-owned to avoid agent conflicts).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/billing");
  if (session.user.role === "CUSTOMER") redirect("/portal");

  return <AppShell user={{ email: session.user.email ?? "", role: session.user.role }}>{children}</AppShell>;
}
