"use client";

import { useId } from "react";
import { appIconSvg, useTheme, type AppIconId } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Rounded app tile. Follows the user's accent colour and chosen app icon unless `icon` is forced. */
export function LogoMark({ className, icon }: { className?: string; icon?: AppIconId }) {
  const theme = useTheme();
  const gid = useId();
  const glyph = appIconSvg(icon ?? theme.appIcon);
  return (
    <svg viewBox="0 0 24 24" className={cn("h-12 w-12", className)} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--hero-from)" />
          <stop offset="1" stopColor="var(--hero-to)" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6.8" fill={`url(#${gid})`} />
      <g transform="translate(2.6 2.6) scale(.78)" dangerouslySetInnerHTML={{ __html: glyph }} />
    </svg>
  );
}

export function Logo({ className }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9" />
      <span className="text-xl font-extrabold tracking-tight text-ink">Roomies</span>
    </span>
  );
}
