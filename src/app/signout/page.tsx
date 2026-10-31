/**
 * Sign out — /signout (next-auth signOut override, registered in
 * src/shared/auth authOptions.pages). Server shell: soft ground, two faint
 * orbit ellipses as backdrop art, and a lifted white card with the brand
 * lockup. The CSRF-dependent sign-out POST lives in the client child
 * (signout-button.tsx) so this page stays a server component.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { LogoMark } from "@/shared/ui/logo";
import { SignOutButton, CancelLink } from "./signout-button";

export const metadata: Metadata = {
  title: "Sign out — Orbit",
  description: "Sign out of your Orbit session.",
};

/** Two faint orbit ellipses — the landing grammar's orbital backdrop. */
function OrbitBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      width="1200"
      height="800"
      viewBox="0 0 1200 800"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="600"
        cy="400"
        rx="520"
        ry="180"
        stroke="hsl(var(--primary))"
        strokeOpacity="0.10"
        strokeWidth="1.5"
        transform="rotate(-16 600 400)"
      />
      <ellipse
        cx="600"
        cy="400"
        rx="380"
        ry="130"
        stroke="hsl(var(--primary))"
        strokeOpacity="0.07"
        strokeWidth="1.5"
        transform="rotate(-16 600 400)"
      />
    </svg>
  );
}

export default function SignOutPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(var(--background))] p-6">
      <OrbitBackdrop />

      <main className="relative w-full max-w-md">
        <div className="rounded-[var(--radius-lg)] bg-[hsl(var(--card))] p-8 shadow-[var(--shadow-lift)] ring-1 ring-[hsl(var(--border))]">
          {/* brand lockup */}
          <Link href="/" className="inline-flex items-center gap-3" aria-label="Orbit home">
            <LogoMark size={40} />
            <span className="text-2xl font-bold tracking-tight">Orbit</span>
          </Link>

          <h1 className="mt-6 text-2xl font-bold tracking-[-0.02em] [text-wrap:balance]">
            Sign out of Orbit
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))] [text-wrap:pretty]">
            Your billing stays exactly where you left it.
          </p>

          <div className="mt-6">
            <SignOutButton />
          </div>

          <div className="mt-6 border-t border-[hsl(var(--border))] pt-4 text-center">
            <CancelLink />
          </div>
        </div>
      </main>
    </div>
  );
}
