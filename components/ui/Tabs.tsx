"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}

/** Scrollable pill filter tabs. */
export function Tabs<T extends string>({ options, value, onChange, label, className }: TabsProps<T>) {
  const group = useId();
  return (
    <div role="tablist" aria-label={label} className={cn("no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative min-h-[40px] shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors",
              active ? "text-primary-ink" : "bg-surface text-muted border border-line hover:text-ink",
            )}
          >
            {active && <motion.span layoutId={`tab-${group}`} className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
            <span className="relative">{o.label}{o.count !== undefined && <span className="ml-1.5 opacity-70">{o.count}</span>}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Compact two-to-four way switch inside forms. */
export function SegmentedControl<T extends string>({ options, value, onChange, label }: { options: Option<T>[]; value: T; onChange: (v: T) => void; label: string }) {
  const group = useId();
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-2xl bg-surface2 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn("relative min-h-[40px] flex-1 rounded-xl px-2 text-[13px] font-semibold transition-colors", active ? "text-ink" : "text-muted")}
          >
            {active && <motion.span layoutId={`seg-${group}`} className="absolute inset-0 rounded-xl bg-surface shadow-card" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
