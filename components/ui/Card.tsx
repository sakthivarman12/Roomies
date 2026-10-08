"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padded?: boolean;
}

export function Card({ className, interactive, padded = true, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-line bg-surface shadow-card",
        padded && "p-4 sm:p-5",
        interactive && "transition-all hover:shadow-float hover:-translate-y-0.5 cursor-pointer",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function GlassCard({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[24px] border border-white/20 bg-white/15 backdrop-blur-md text-white", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Staggered entrance wrapper for list items / sections. */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeader({
  title, action, onAction, href,
}: { title: string; action?: string; onAction?: () => void; href?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
      {action && (href ? (
        <a href={href} className="text-[13px] font-semibold text-primary hover:underline">{action}</a>
      ) : (
        <button onClick={onAction} className="min-h-[44px] -my-3 pl-3 text-[13px] font-semibold text-primary hover:underline">{action}</button>
      ))}
    </div>
  );
}
