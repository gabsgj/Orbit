export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-5xl font-bold tracking-tight">Orbit</h1>
      <p className="max-w-md text-center text-lg text-[hsl(var(--muted-foreground))]">
        Put your revenue in orbit — plans, subscriptions, recurring billing,
        invoices, payments and revenue reporting in one place.
      </p>
      <p className="rounded-full border border-[hsl(var(--border))] px-4 py-1 text-sm">
        Phase 0 scaffold ✅ · Next.js 15 · tRPC · Prisma · PostgreSQL 18
      </p>
    </main>
  );
}
