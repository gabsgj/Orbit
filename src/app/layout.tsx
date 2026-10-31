import type { Metadata } from "next";
import { TRPCProvider } from "@/shared/trpc/react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Orbit — Recurring billing that cannot bill you twice",
    template: "%s — Orbit",
  },
  description:
    "Orbit runs the full life of a subscription business: plans, subscriptions, idempotent recurring billing, invoices, payments and revenue reporting. Offline-first, on your own PostgreSQL.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
