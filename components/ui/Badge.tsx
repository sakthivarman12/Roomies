import { cn } from "@/lib/utils";

export type Tone = "success" | "warning" | "danger" | "info" | "violet" | "neutral";

const TONES: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  violet: "bg-violet-soft text-violet",
  neutral: "bg-surface2 text-muted",
};

/** Status is always conveyed with an icon/text label as well as colour. */
export function Badge({ tone = "neutral", children, className, icon }: { tone?: Tone; children: React.ReactNode; className?: string; icon?: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none", TONES[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export const toneText: Record<Tone, string> = {
  success: "text-success", warning: "text-warning", danger: "text-danger", info: "text-info", violet: "text-violet", neutral: "text-muted",
};
export const toneBg: Record<Tone, string> = {
  success: "bg-success-soft", warning: "bg-warning-soft", danger: "bg-danger-soft", info: "bg-info-soft", violet: "bg-violet-soft", neutral: "bg-surface2",
};
