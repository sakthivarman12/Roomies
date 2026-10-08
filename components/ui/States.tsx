"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export function EmptyState({
  icon, title, description, actionLabel, onAction, className,
}: { icon: React.ReactNode; title: string; description?: string; actionLabel?: string; onAction?: () => void; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      className={cn("flex flex-col items-center rounded-[24px] border border-dashed border-line bg-surface px-6 py-10 text-center", className)}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-soft text-primary">{icon}</div>
      <h3 className="text-base font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-xs whitespace-pre-line text-sm text-muted">{description}</p>}
      {actionLabel && onAction && <Button className="mt-5" onClick={onAction}>{actionLabel}</Button>}
    </motion.div>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-[24px] border border-danger/30 bg-danger-soft px-6 py-8 text-center">
      <AlertTriangle className="mb-2 h-8 w-8 text-danger" aria-hidden />
      <p className="text-sm font-semibold text-danger">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-2xl", className)} />;
}

export function ScreenSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-52 w-full rounded-[28px]" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
