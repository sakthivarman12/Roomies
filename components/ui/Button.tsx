"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "soft";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-ink shadow-float hover:brightness-110",
  secondary: "bg-surface text-ink border border-line hover:bg-surface2",
  ghost: "text-ink hover:bg-surface2",
  danger: "bg-danger text-white hover:brightness-110",
  success: "bg-success text-white hover:brightness-110",
  soft: "bg-primary-soft text-primary hover:brightness-95",
};
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-xl gap-1.5",
  md: "h-11 px-5 text-sm rounded-2xl gap-2",
  lg: "h-14 px-6 text-base rounded-[20px] gap-2",
};

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  children?: React.ReactNode;
}

export function Button({ variant = "primary", size = "md", loading, block, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none select-none min-h-[44px]",
        VARIANTS[variant], SIZES[size], block && "w-full", className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </motion.button>
  );
}

interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  label: string;
  children: React.ReactNode;
  tone?: "plain" | "filled";
}

export function IconButton({ label, children, tone = "plain", className, ...rest }: IconButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors",
        tone === "filled" ? "bg-surface border border-line shadow-card hover:bg-surface2" : "hover:bg-surface2",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
