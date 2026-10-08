"use client";

import { AnimatePresence } from "framer-motion";
import { BellOff, CheckCheck, Trash2 } from "lucide-react";
import { NotificationCard } from "@/components/dashboard/NotificationCard";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { useAction } from "@/hooks/useAction";
import { useApp } from "@/hooks/useApp";
import { notificationService } from "@/lib/services";

export default function NotificationsPage() {
  const app = useApp();
  const run = useAction();
  if (!app) return null;
  const list = app.db.notifications
    .filter((n) => n.userId === app.user.id && n.householdId === app.household.id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const unread = list.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader title="Notifications" back subtitle={unread ? `${unread} unread` : "You're all caught up"}
        right={list.length > 0 ? (
          <div className="flex gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => run(() => notificationService.markAllRead(), "All marked as read")} disabled={!unread} aria-label="Mark all as read"><CheckCheck className="h-4 w-4" /></Button>
            <Button size="sm" variant="secondary" onClick={() => run(() => notificationService.clearAll(), "Notifications cleared")} aria-label="Clear all"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ) : undefined} />
      <div className="space-y-2.5 px-4 pt-2 pb-6">
        {list.length === 0 ? (
          <EmptyState icon={<BellOff className="h-7 w-7" />} title="You're all caught up" description="New expenses, payments and reminders will show up here." />
        ) : (
          <AnimatePresence initial={false}>{list.map((n) => <NotificationCard key={n.id} n={n} onRead={() => run(() => notificationService.markRead(n.id))} />)}</AnimatePresence>
        )}
      </div>
    </div>
  );
}
