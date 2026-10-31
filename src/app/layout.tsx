import type { Metadata } from "next";
import { TRPCProvider } from "@/shared/trpc/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orbit — Subscription Management",
  description: "Put your revenue in orbit. Plans, subscriptions, recurring billing, invoices, payments and revenue reporting in one place.",
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
