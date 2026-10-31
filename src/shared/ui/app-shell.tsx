"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  OrbitLogo,
  DashboardIcon,
  SubscriptionIcon,
  InvoiceIcon,
  PaymentIcon,
  CatalogIcon,
  DiscountIcon,
  BillingRunIcon,
  UsersIcon,
  MailIcon,
  AuditIcon,
  LogOutIcon,
  PlayIcon,
  TemplateIcon,
} from "./icons";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Finance Dashboard",
        href: "/dashboard",
        icon: DashboardIcon,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Subscriptions",
        href: "/subscriptions",
        icon: SubscriptionIcon,
      },
      {
        label: "Quotation Templates",
        href: "/templates",
        icon: TemplateIcon,
      },
      {
        label: "Invoices",
        href: "/invoices",
        icon: InvoiceIcon,
      },
      {
        label: "Payments",
        href: "/payments",
        icon: PaymentIcon,
      },
      {
        label: "Billing Runs",
        href: "/billing",
        icon: BillingRunIcon,
      },
    ],
  },
  {
    title: "Catalog",
    items: [
      {
        label: "Products & Variants",
        href: "/catalog/products",
        icon: CatalogIcon,
      },
      {
        label: "Subscription Plans",
        href: "/catalog/plans",
        icon: CatalogIcon,
      },
      {
        label: "Taxes",
        href: "/catalog/taxes",
        icon: CatalogIcon,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Discount Rules",
        href: "/discounts",
        icon: DiscountIcon,
        adminOnly: true,
      },
      {
        label: "Staff Management",
        href: "/admin/staff",
        icon: UsersIcon,
        adminOnly: true,
      },
      {
        label: "Mail Outbox",
        href: "/admin/outbox",
        icon: MailIcon,
        adminOnly: true,
      },
      {
        label: "Audit Log",
        href: "/admin/audit",
        icon: AuditIcon,
        adminOnly: true,
      },
    ],
  },
];

export interface AppShellProps {
  children: React.ReactNode;
  user?: {
    email: string;
    role: "ADMIN" | "STAFF" | "CUSTOMER";
  };
  onRunBilling?: () => void;
  isBillingRunning?: boolean;
}

export function AppShell({
  children,
  user = { email: "admin@brightloop.local", role: "ADMIN" },
  onRunBilling,
  isBillingRunning = false,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex flex-col lg:flex-row">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation (240px) */}
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-0 -translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-[hsl(var(--border))] px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-semibold tracking-tight text-[hsl(var(--foreground))]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
              <OrbitLogo size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none">Orbit</span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] leading-tight">
                Brightloop Software
              </span>
            </div>
          </Link>
          <Badge variant={isAdmin ? "default" : "neutral"} className="text-[10px] uppercase">
            {user.role}
          </Badge>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 text-xs">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.adminOnly || isAdmin
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <p className="px-2 text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-[var(--radius-xs)] px-2.5 py-1.5 text-xs font-medium transition-colors select-none",
                          isActive
                            ? "bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] font-semibold"
                            : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                        )}
                      >
                        <Icon size={15} className={isActive ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]"} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer — User & Logout */}
        <div className="border-t border-[hsl(var(--border))] p-3">
          <div className="flex items-center justify-between rounded-[var(--radius-xs)] bg-[hsl(var(--background))] p-2">
            <div className="min-w-0 flex-1 pr-2">
              <p className="truncate text-xs font-medium text-[hsl(var(--foreground))]">
                {user.email}
              </p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase">
                {user.role} account
              </p>
            </div>
            <Link
              href="/api/auth/signout"
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors p-1"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOutIcon size={14} />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar (48px) */}
        <header className="no-print sticky top-0 z-30 flex h-12 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/90 backdrop-blur-sm px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-xs)] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
              <span>Orbit</span>
              <span>/</span>
              <span className="font-medium text-[hsl(var(--foreground))] capitalize">
                {pathname?.split("/")[1] || "Overview"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--radius-xs)] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
              title="Open Customer Portal view in new tab"
            >
              <span>Customer Portal ↗</span>
            </Link>

            {onRunBilling && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRunBilling}
                isLoading={isBillingRunning}
                className="gap-1.5 text-xs"
              >
                <PlayIcon size={12} className="text-[hsl(var(--kpi-primary))]" />
                <span>Run Billing Day</span>
              </Button>
            )}
          </div>
        </header>

        {/* Page Content Canvas */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
