"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { Badge } from "./badge";
import { OrbitLogo, LogOutIcon, SubscriptionIcon, InvoiceIcon } from "./icons";

export interface PortalShellProps {
  children: React.ReactNode;
  user?: {
    email: string;
    companyName?: string;
  };
}

export function PortalShell({
  children,
  user = { email: "customer@client.com", companyName: "Acme Corp" },
}: PortalShellProps) {
  const pathname = usePathname();

  const navLinks = [
    {
      label: "My Subscriptions",
      href: "/portal",
      icon: SubscriptionIcon,
    },
    {
      label: "Invoices & Billing",
      href: "/portal/invoices",
      icon: InvoiceIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 lg:px-8">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/portal" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                <OrbitLogo size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none tracking-tight">Orbit</span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] leading-tight">
                  Customer Portal · Brightloop
                </span>
              </div>
            </Link>

            {/* Navigation tabs */}
            <nav className="hidden sm:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 rounded-[var(--radius-xs)] px-3 py-1.5 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] font-semibold"
                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                    )}
                  >
                    <Icon size={14} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium leading-none text-[hsl(var(--foreground))]">
                {user.companyName || user.email}
              </p>
              <Badge variant="neutral" className="mt-0.5 text-[9px] uppercase px-1.5 py-0">
                Customer
              </Badge>
            </div>
            <Link
              href="/api/auth/signout"
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-xs)] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--destructive))] transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOutIcon size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-5xl w-full p-4 lg:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] py-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
        <p>Orbit Subscription Management · Brightloop Software · All rights reserved.</p>
      </footer>
    </div>
  );
}

