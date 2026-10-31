import { cn } from "@/shared/lib/utils";

/**
 * Orbit mark — the brand logo as an inline SVG (no raster, theme-free).
 * An ink tile with the orbit ring, the recurring-revenue core, and its
 * satellite period. `bare` renders the mark without the tile for light
 * surfaces.
 */
export function LogoMark({
  size = 28,
  bare = false,
  className,
}: {
  size?: number;
  bare?: boolean;
  className?: string;
}) {
  const ring = (
    <ellipse
      cx="32"
      cy="32"
      rx={bare ? 24 : 20}
      ry={bare ? 11.5 : 9.5}
      fill="none"
      stroke="#1d5fbf"
      strokeWidth={bare ? 3 : 3.5}
      transform="rotate(-24 32 32)"
    />
  );
  const core = <circle cx="32" cy="32" r={bare ? 8 : 7} fill={bare ? "#0f172a" : "#f8fafc"} />;
  const satellite = (
    <circle cx={bare ? 50.3 : 46.6} cy={bare ? 18.4 : 20.2} r={bare ? 4.4 : 4} fill="#1d5fbf" />
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Orbit logo"
      className={cn("shrink-0", className)}
    >
      {!bare && <rect width="64" height="64" rx="14" fill="#0f172a" />}
      {ring}
      {core}
      {satellite}
    </svg>
  );
}

/** Logo lockup: mark + wordmark. */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span className="font-bold tracking-tight" style={{ fontSize: size * 0.56 }}>
        Orbit
      </span>
    </span>
  );
}
