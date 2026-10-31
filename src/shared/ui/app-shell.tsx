"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { trpc } from "@/shared/trpc/react";
import { Button } from "./button";
import { LogoMark } from "./logo";
import {
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

/** Rotating pastel tint pairs (bg / ink) keyed by section index for wayfinding. */
const SECTION_TINTS = [
  { bg: "bg-tint-blue", ink: "text-tint-blue-ink" },
  { bg: "bg-tint-green", ink: "text-tint-green-ink" },
  { bg: "bg-tint-lavender", ink: "text-tint-lavender-ink" },
  { bg: "bg-tint-rose", ink: "text-tint-rose-ink" },
  { bg: "bg-tint-teal", ink: "text-tint-teal-ink" },
  { bg: "bg-tint-peach", ink: "text-tint-peach-ink" },
] as const;

export interface AppShellProps {
  children: React.ReactNode;
  user?: {
    email: string;
    role: "ADMIN" | "STAFF" | "CUSTOMER";
  };
  onRunBilling?: () => void;
  isBillingRunning?: boolean;
}

function NavLink({
  item,
  tint,
  isActive,
  overdueBadge,
  onNavigate,
}: {
  item: NavItem;
  tint: (typeof SECTION_TINTS)[number];
  isActive: boolean;
  overdueBadge?: number;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      key={item.href}
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors select-none",
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-foreground hover:bg-muted"
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-primary"
          aria-hidden="true"
        />
      )}

      {/* Icon — plain, no tile background (per design review) */}
      <span className="flex h-8 w-8 shrink-0 items-center justify-center">
        <Icon
          size={17}
          className={isActive ? "text-primary" : tint.ink}
        />
      </span>

      <span className="flex-1 truncate">{item.label}</span>

      {/* Overdue invoice count badge */}
      {item.href === "/invoices" && overdueBadge != null && overdueBadge > 0 && (
        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-status-overdue-bg px-1.5 text-[11px] font-semibold tabular-nums text-status-overdue-ink">
          {overdueBadge > 99 ? "99+" : overdueBadge}
        </span>
      )}
    </Link>
  );
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

  // Live overdue-invoice count for the sidebar badge (cheap: 60s stale, no polling)
  const kpisQuery = trpc.dashboard.kpis.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const overdueCount = kpisQuery.data?.overdueInvoicesCount ?? 0;

  const initials = user.email
    .split("@")[0]
    .split(/[._-]/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const renderNav = (onNavigate?: () => void) => (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {NAV_SECTIONS.map((section, sectionIdx) => {
        const visibleItems = section.items.filter(
          (item) => !item.adminOnly || isAdmin
        );
        if (visibleItems.length === 0) return null;

        const tint = SECTION_TINTS[sectionIdx % SECTION_TINTS.length];

        return (
          <div key={section.title} className="space-y-1.5">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <div className="space-y-1">
              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname?.startsWith(item.href));

                return (
                  <NavLink
                    key={item.href}
                    item={item}
                    tint={tint}
                    isActive={!!isActive}
                    overdueBadge={overdueCount}
                    onNavigate={onNavigate}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card shadow-[var(--shadow-soft)] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 text-foreground"
          >
            <LogoMark size={36} />
            <span className="text-lg font-bold tracking-tight">Orbit</span>
          </Link>
        </div>

        {/* Navigation Links */}
        {renderNav(() => setMobileOpen(false))}

        {/* Sidebar Footer — Sign out */}
        <div className="border-t border-border p-3">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive select-none"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <LogOutIcon size={16} />
            </span>
            <span>Sign out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar */}
        <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 backdrop-blur-sm px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>Orbit</span>
              <span>/</span>
              <span className="font-medium text-foreground capitalize">
                {pathname?.split("/")[1] || "Overview"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Open Customer Portal view in new tab"
            >
              <span>Customer Portal ↗</span>
            </Link>

            {/* Sign out — always visible (topbar, every viewport) */}
            <Link
              href="/api/auth/signout"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOutIcon size={14} />
              <span className="hidden md:inline">Sign out</span>
            </Link>

            {onRunBilling && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRunBilling}
                isLoading={isBillingRunning}
                className="gap-1.5"
              >
                <PlayIcon size={12} className="text-primary" />
                <span>Run Billing Day</span>
              </Button>
            )}

            {/* User chip */}
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card py-1.5 pl-1.5 pr-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tint-blue text-xs font-semibold text-tint-blue-ink">
                {initials}
              </span>
              <div className="hidden md:flex flex-col leading-tight">
                <span className="max-w-[10rem] truncate text-xs font-medium text-foreground">
                  {user.email}
                </span>
                <span className="mt-0.5 inline-flex w-fit items-center rounded-full bg-status-neutral-bg px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-status-neutral-ink">
                  {user.role}
                </span>
              </div>
            </div>
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
