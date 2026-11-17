import { useId } from "react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/**
 * myprofile icon: a lowercase "m" whose right arch carries a dot —
 * read together, the second arch becomes a person (head + shoulders).
 */
export function LogoMark({ className }: { className?: string | undefined }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--primary-glow)" }} />
          <stop offset="1" style={{ stopColor: "var(--primary)" }} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id}-g)`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" style={{ stroke: "oklch(1 0 0 / 0.18)" }} />
      <g
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: "var(--primary-foreground)" }}
      >
        <path d="M9 24V16.5a3.5 3.5 0 0 1 7 0V24" />
        <path d="M16 16.5a3.5 3.5 0 0 1 7 0V24" />
      </g>
      <circle cx="19.5" cy="8.6" r="2.05" style={{ fill: "var(--primary-foreground)" }} />
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string | undefined; markClassName?: string | undefined }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className="text-[1.15rem] font-semibold lowercase tracking-[-0.04em] text-foreground">
        {BRAND.name}
      </span>
    </span>
  );
}
