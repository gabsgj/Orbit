"use client";

/**
 * SignOutButton — client piece of /signout. next-auth v4 requires a CSRF
 * token for the signout POST, so we fetch /api/auth/csrf, then POST the form
 * to /api/auth/signout with `json: true` (keeps the flow on this page instead
 * of following next-auth's redirect). States: idle → pending → signed out.
 */
import { useState } from "react";
import Link from "next/link";
import { authButtonClass } from "@/shared/ui/auth-layout";

type Phase = "idle" | "pending" | "done" | "error";

export function SignOutButton() {
  const [phase, setPhase] = useState<Phase>("idle");

  async function onSignOut() {
    setPhase("pending");
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      if (!csrfRes.ok) throw new Error("csrf");
      const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

      const body = new URLSearchParams({ csrfToken, json: "true" });
      const signOutRes = await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        credentials: "include",
      });
      if (!signOutRes.ok) throw new Error("signout");
      setPhase("done");
    } catch {
      setPhase("error");
    }
  }

  if (phase === "done") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-[var(--radius-xs)] border border-[hsl(var(--status-active-ink))]/20 bg-[hsl(var(--status-active-bg))] px-3 py-2.5">
          <svg
            viewBox="0 0 16 16"
            className="h-4 w-4 shrink-0 text-[hsl(var(--status-active-ink))]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2.5 8.5l3.5 3.5 7-8" />
          </svg>
          <p className="text-sm font-medium text-[hsl(var(--status-active-ink))]">
            Signed out — your session is closed.
          </p>
        </div>
        <Link href="/login" className={`${authButtonClass} block text-center`}>
          Back to sign in
        </Link>
        <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
          <Link href="/" className="font-medium underline underline-offset-2 hover:text-[hsl(var(--foreground))]">
            Return to landing
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onSignOut}
        disabled={phase === "pending"}
        className={authButtonClass}
      >
        {phase === "pending" ? "Signing you out…" : "Sign out"}
      </button>
      {phase === "error" && (
        <p className="text-center text-xs font-medium text-[hsl(var(--destructive))]">
          Something went wrong — please try again.
        </p>
      )}
    </div>
  );
}

/**
 * CancelLink — secondary escape hatch. Uses history.back() when there is a
 * history entry to return to; otherwise the plain href="/dashboard" fallback
 * navigates normally.
 */
export function CancelLink() {
  return (
    <a
      href="/dashboard"
      onClick={(e) => {
        if (window.history.length > 1) {
          e.preventDefault();
          window.history.back();
        }
      }}
      className="text-sm font-medium text-[hsl(var(--muted-foreground))] underline underline-offset-2 transition hover:text-[hsl(var(--foreground))]"
    >
      Cancel and go back
    </a>
  );
}
