import Link from "next/link";
import { OrbitLogo } from "@/shared/ui/icons";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="w-full max-w-xl text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--radius)] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-xs">
          <OrbitLogo size={32} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2">
            <h1 className="text-4xl font-extrabold tracking-tight">Orbit</h1>
            <Badge variant="active" className="text-xs">
              Phase 0 Complete
            </Badge>
          </div>
          <p className="text-base text-[hsl(var(--muted-foreground))]">
            Put your revenue in orbit — the unified subscription management and recurring billing platform for Brightloop Software.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto font-medium">
              Open Finance Dashboard
            </Button>
          </Link>
          <Link href="/portal" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Customer Portal
            </Button>
          </Link>
        </div>

        <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-xs text-[hsl(var(--muted-foreground))] space-y-2 text-left">
          <div className="flex items-center justify-between font-medium text-[hsl(var(--foreground))]">
            <span>Stack & Architecture Verification</span>
            <span className="text-[hsl(var(--status-active-ink))] font-semibold">100% Offline-First</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>• Next.js 15 App Router</div>
            <div>• tRPC v11 End-to-End Type Safety</div>
            <div>• Prisma 6 + PostgreSQL 18 Local</div>
            <div>• Tailwind CSS v4 + Design Tokens</div>
            <div>• TanStack Query / Table</div>
            <div>• UI Excellence Program (Gate 0 ✓)</div>
          </div>
        </div>
      </div>
    </main>
  );
}
