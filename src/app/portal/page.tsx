import { PortalShell } from "@/shared/ui";
import { CustomerPortal } from "@/modules/portal";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/shared/auth";

export const metadata = {
  title: "Customer Portal — Orbit",
  description: "View and manage your active subscriptions and invoices for Brightloop Software.",
};

export default async function CustomerPortalPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/portal");
  if (session.user.role !== "CUSTOMER") redirect("/dashboard");
  return (
    <PortalShell user={{ email: session.user.email ?? "", companyName: "Customer account" }}>
      <CustomerPortal />
    </PortalShell>
  );
}
