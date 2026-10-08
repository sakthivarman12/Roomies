"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors", checked ? "bg-primary" : "bg-line")}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 32 }} className={cn("h-6 w-6 rounded-full bg-white shadow", checked && "ml-auto")} />
    </button>
  );
}
