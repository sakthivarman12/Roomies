"use client";

import { motion } from "framer-motion";
import { NOTIFICATION_ICON } from "@/lib/icons";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types";

const TONE: Record<NotificationType, string> = {
  expense_added: "bg-info-soft text-info", expense_split: "bg-info-soft text-info", payment_received: "bg-success-soft text-success",
  payment_requested: "bg-warning-soft text-warning", chore_assigned: "bg-violet-soft text-violet", chore_overdue: "bg-danger-soft text-danger",
  bill_reminder: "bg-warning-soft text-warning", announcement: "bg-violet-soft text-violet",
};

export function NotificationCard({ n, onRead }: { n: AppNotification; onRead: () => void }) {
  const Icon = NOTIFICATION_ICON[n.type];
  return (
    <motion.button
      layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={onRead}
      aria-label={`${n.read ? "" : "Unread: "}${n.title}. ${n.description}`}
      className={cn("flex min-h-[72px] w-full items-start gap-3.5 rounded-3xl border p-4 text-left transition-colors", n.read ? "border-line bg-surface" : "border-primary/30 bg-primary-soft/50")}
    >
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", TONE[n.type])}><Icon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-bold">{n.title}</span>
          <span className="shrink-0 text-[11px] text-muted">{relativeTime(n.createdAt)}</span>
        </span>
        <span className="mt-0.5 block text-[13px] text-muted">{n.description}</span>
      </span>
      {!n.read && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-hidden />}
    </motion.button>
  );
}
