import { AppShell } from "@/shared/ui";
import { FinanceDashboard } from "@/modules/dashboard";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/shared/auth";

export const metadata = {
  title: "Dashboard — Orbit",
  description: "Executive finance and subscription recurring revenue dashboard.",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");
  if (session.user.role === "CUSTOMER") redirect("/portal");
  return (
    <AppShell user={{ email: session.user.email ?? "", role: session.user.role }}>
      <FinanceDashboard />
    </AppShell>
  );
}

