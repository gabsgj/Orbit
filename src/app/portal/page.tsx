import { PortalShell } from "@/shared/ui";
import { CustomerPortal } from "@/modules/portal";

export const metadata = {
  title: "Customer Portal — Orbit",
  description: "View and manage your active subscriptions and invoices for Brightloop Software.",
};

export default function CustomerPortalPage() {
  return (
    <PortalShell user={{ email: "customer@brightloop.local", companyName: "Acme Stores Pvt Ltd" }}>
      <CustomerPortal />
    </PortalShell>
  );
}
