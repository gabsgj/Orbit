"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { LogoMark } from "@/shared/ui/logo";
import { LogOutIcon, SubscriptionIcon, InvoiceIcon } from "./icons";

export interface PortalShellProps {
  children: React.ReactNode;
  user?: {
    email: string;
    companyName?: string;
  };
}

function getInitials(name: string, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function PortalShell({
  children,
  user = { email: "customer@client.com", companyName: "Acme Corp" },
}: PortalShellProps) {
  const pathname = usePathname();
  const initials = getInitials(user.companyName || "", user.email);

  const navLinks = [
    {
      label: "My Subscriptions",
      href: "/portal",
      icon: SubscriptionIcon,
    },
    {
      label: "Invoices & Billing",
      href: "/portal#invoices",
      icon: InvoiceIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex flex-col">
      {/* ── Floating glass header ──────────────────────────────────────── */}
      <header className="no-print fixed top-4 inset-x-4 z-30">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-full bg-[hsl(var(--card))]/60 backdrop-blur-xl ring-1 ring-white/50 shadow-[var(--shadow-soft)] px-5 py-3">
            <div className="flex items-center justify-between">
              {/* Brand */}
              <div className="flex items-center gap-5">
                <Link href="/portal" className="flex items-center gap-2.5">
                  <LogoMark size={36} />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold leading-none tracking-tight">Orbit</span>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] leading-tight mt-0.5">
                      Customer Portal
                    </span>
                  </div>
                </Link>

                {/* Nav pills */}
                <nav className="hidden sm:flex items-center gap-1 ml-2">
                  {navLinks.map((link) => {
                    const isActive =
                      pathname === link.href ||
                      (link.href === "/portal" && pathname === "/portal");
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.label}
                        href={link.href}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                          isActive
                            ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                            : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                        )}
                      >
                        <Icon size={14} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Right side: user info + actions */}
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="hidden md:inline-flex items-center gap-1 text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mr-1 transition-colors"
                  title="Return to Staff App"
                >
                  <span>&larr; Staff App</span>
                </Link>

                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium leading-none text-[hsl(var(--foreground))]">
                    {user.companyName || user.email}
                  </p>
                  <span className="inline-flex items-center rounded-full bg-[hsl(var(--status-neutral-bg))] text-[hsl(var(--status-neutral-ink))] border border-[hsl(var(--status-neutral-ink))]/15 px-1.5 py-0 text-[9px] uppercase font-medium tracking-wide mt-0.5">
                    Customer
                  </span>
                </div>

                {/* Initials avatar */}
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
                  style={{
                    backgroundColor: "hsl(var(--tint-blue))",
                    color: "hsl(var(--tint-blue-ink))",
                  }}
                >
                  {initials}
                </div>

                <Link
                  href="/api/auth/signout"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--destructive))] transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOutIcon size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content (pt-24 clears the fixed header) ──────────────── */}
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 lg:px-8 pt-24 pb-8">
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="no-print py-5 text-center text-[11px] text-[hsl(var(--muted-foreground))] font-mono">
        <p>Orbit &middot; Brightloop Software &middot; offline-first</p>
      </footer>
    </div>
  );
}
