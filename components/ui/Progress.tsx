"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useEffect } from "react";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AnimatedNumber({ value, format = money, className }: { value: number; format?: (n: number) => string; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const text = useTransform(mv, (v) => format(Math.round(v * 100) / 100));
  useEffect(() => {
    if (reduce) { mv.set(value); return; }
    const controls = animate(mv, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, mv, reduce]);
  return <motion.span className={cn("tnum", className)}>{text}</motion.span>;
}

export function ProgressBar({ value, color = "var(--primary)", className, label }: { value: number; color?: string; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface2", className)}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
      />
    </div>
  );
}

/** Stepper dots for onboarding. */
export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1} aria-label="Onboarding progress">
      {Array.from({ length: total }, (_, i) => (
        <motion.span key={i} className="h-1.5 rounded-full bg-primary" animate={{ width: i === current ? 28 : 8, opacity: i <= current ? 1 : 0.25 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
      ))}
    </div>
  );
}
