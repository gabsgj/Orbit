"use client";

/**
 * Footer easter eggs — a GitHub link, a spinning fidget, and a stick man.
 * Pure inline SVG + CSS animation. No emoji, no external assets.
 */

export function GitHubIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-label="GitHub" className={className}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

/** A fidget spinner that spins slowly, faster on hover. */
export function FidgetSpinner({ size = 26 }: { size?: number }) {
  return (
    <>
      <style>{`
        @keyframes orbit-fidget-spin { to { transform: rotate(360deg); } }
        .orbit-fidget { animation: orbit-fidget-spin 6s linear infinite; transform-origin: 50% 50%; }
        .orbit-fidget:hover { animation-duration: 0.9s; }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className="orbit-fidget"
        role="img"
        aria-label="A fidget spinner, spinning"
        style={{ display: "inline-block", verticalAlign: "middle" }}
      >
        <g fill="none" stroke="currentColor" strokeWidth="4">
          <circle cx="32" cy="14" r="9" />
          <circle cx="16" cy="42" r="9" />
          <circle cx="48" cy="42" r="9" />
          <circle cx="32" cy="32" r="7" />
        </g>
        <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
          <line x1="32" y1="23" x2="32" y2="25" />
          <line x1="23.8" y1="37" x2="25.5" y2="35" />
          <line x1="40.2" y1="37" x2="38.5" y2="35" />
        </g>
      </svg>
    </>
  );
}

/** A stick man who waves when you hover near him. */
export function StickMan({ size = 34 }: { size?: number }) {
  return (
    <>
      <style>{`
        @keyframes orbit-stickman-wave {
          0%, 60%, 100% { transform: rotate(0deg); }
          70% { transform: rotate(-24deg); }
          80% { transform: rotate(14deg); }
          90% { transform: rotate(-10deg); }
        }
        .orbit-stickman .arm { transform-origin: 32px 26px; transform-box: view-box; }
        .orbit-stickman:hover .arm { animation: orbit-stickman-wave 1.2s ease-in-out infinite; }
      `}</style>
      <svg
        width={size}
        height={size * 1.6}
        viewBox="0 0 64 96"
        className="orbit-stickman"
        role="img"
        aria-label="A stick man standing by, ready to wave"
        style={{ display: "inline-block", verticalAlign: "bottom" }}
      >
        <g stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none">
          {/* head */}
          <circle cx="32" cy="14" r="10" />
          {/* body */}
          <line x1="32" y1="24" x2="32" y2="58" />
          {/* resting arm (left) */}
          <line x1="32" y1="30" x2="18" y2="44" />
          {/* waving arm (right) */}
          <line className="arm" x1="32" y1="30" x2="50" y2="16" />
          {/* legs */}
          <line x1="32" y1="58" x2="20" y2="88" />
          <line x1="32" y1="58" x2="44" y2="88" />
        </g>
      </svg>
    </>
  );
}
