/**
 * DEMO ONLY — seeded demo accounts, shown in the UI as a demo affordance.
 * This file is the SINGLE source of truth: the seed script
 * (prisma/seed/index.ts) creates exactly these users, and the UI's
 * DemoCredentials card displays the same values. Nothing is duplicated.
 * Delete this file (and the card) for any real deployment.
 */

export const DEMO_MODE = true;

export interface DemoLogin {
  role: "Admin" | "Staff" | "Customer";
  email: string;
  password: string;
  note: string;
}

export const DEMO_LOGINS: DemoLogin[] = [
  {
    role: "Admin",
    email: "admin@orbit.local",
    password: "Admin@Orbit1",
    note: "everything: catalog, discounts, billing runs, staff, outbox",
  },
  {
    role: "Staff",
    email: "staff@orbit.local",
    password: "Staff@Orbit1",
    note: "day-to-day: subscriptions, invoices, payments, billing day",
  },
  {
    role: "Customer",
    email: "customer@acme.test",
    password: "Cust@Orbit1",
    note: "the portal: Acme's own subscriptions and invoices only",
  },
];
