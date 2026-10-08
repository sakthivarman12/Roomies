import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-12 w-12", className)} aria-hidden>
      <defs>
        <linearGradient id="rm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3730a3" />
          <stop offset="1" stopColor="#6d5ef0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#rm-g)" />
      <path d="M16 33 32 19l16 14v15a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2z" fill="#fff" />
      <path d="M27 50V38h10v12" fill="#4338ca" />
      <circle cx="32" cy="31" r="3" fill="#4338ca" />
    </svg>
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9" />
      <span className={cn("text-xl font-extrabold tracking-tight", light ? "text-white" : "text-ink")}>Roomies</span>
    </span>
  );
}
