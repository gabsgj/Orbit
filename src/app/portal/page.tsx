import { PortalShell } from "@/shared/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { formatINR } from "@/shared/lib/money";

export const metadata = {
  title: "Customer Portal — Orbit",
  description: "View and manage your active subscriptions and invoices.",
};

export default function CustomerPortalPage() {
  return (
    <PortalShell user={{ email: "customer@brightloop.local", companyName: "Acme Enterprises" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            My Subscriptions & Billing
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            Manage your Brightloop Software recurring services and view invoices
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Brightloop CRM Enterprise</CardTitle>
                <Badge variant="active">Active</Badge>
              </div>
              <CardDescription>Plan: Monthly · Net 15 days payment terms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-[hsl(var(--muted-foreground))]">Monthly Line Value:</span>
                <span className="font-semibold tabular-nums text-sm">{formatINR(5560)}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="text-xs">
                  Request Pause
                </Button>
                <Button size="sm" variant="secondary" className="text-xs">
                  Renew Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Invoices Summary</CardTitle>
                <Badge variant="paid">All Paid</Badge>
              </div>
              <CardDescription>Account settlement status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-[hsl(var(--muted-foreground))]">Outstanding Balance:</span>
                <span className="font-semibold tabular-nums text-sm text-[hsl(var(--status-active-ink))]">
                  {formatINR(0)}
                </span>
              </div>
              <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                Last payment settled on time via UPI.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalShell>
  );
}

