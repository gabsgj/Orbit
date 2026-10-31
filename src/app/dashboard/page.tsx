import { AppShell } from "@/shared/ui";
import { FinanceDashboard } from "@/modules/dashboard";

export const metadata = {
  title: "Dashboard — Orbit",
  description: "Executive finance and subscription recurring revenue dashboard.",
};

export default function DashboardPage() {
  return (
    <AppShell user={{ email: "admin@brightloop.local", role: "ADMIN" }}>
      <FinanceDashboard />
    </AppShell>
  );
}

