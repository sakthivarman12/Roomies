"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCheck, Megaphone, Plus, Trash2 } from "lucide-react";
import { useActions } from "@/components/AppActions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { useAction } from "@/hooks/useAction";
import { useApp } from "@/hooks/useApp";
import { relativeTime } from "@/lib/format";
import { houseService } from "@/lib/services";
import { cn } from "@/lib/utils";

const EMOJI = ["👍", "🙌", "😂", "❤️"];

export function Announcements() {
  const app = useApp();
  const actions = useActions();
  const run = useAction();
  if (!app) return null;
  const list = app.db.announcements.filter((a) => a.householdId === app.household.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="space-y-3">
      {app.canManage && <Button variant="soft" block onClick={actions.addAnnouncement}><Plus className="h-4 w-4" />New announcement</Button>}
      {list.length === 0 ? (
        <EmptyState icon={<Megaphone className="h-7 w-7" />} title="No announcements" description="Important notices for the house will show up here." />
      ) : (
        <AnimatePresence initial={false}>
          {list.map((a) => {
            const author = app.userById(a.authorId);
            const acked = a.acknowledgedBy.includes(app.user.id);
            const counts = Object.values(a.reactions).reduce<Record<string, number>>((acc, e) => ({ ...acc, [e]: (acc[e] ?? 0) + 1 }), {});
            return (
              <motion.div key={a.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card>
                  <div className="flex items-start gap-3">
                    {author && <Avatar user={author} size="sm" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-extrabold leading-snug">{a.title}</p>
                      <p className="text-[11px] text-muted">{app.nameOf(a.authorId)} · {relativeTime(a.createdAt)}</p>
                    </div>
                    {app.canManage && <button onClick={() => run(() => houseService.deleteAnnouncement(a.id), "Announcement deleted")} aria-label="Delete announcement" className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">{a.body}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {EMOJI.map((e) => {
                      const mine = a.reactions[app.user.id] === e;
                      return (
                        <motion.button key={e} whileTap={{ scale: 0.85 }} onClick={() => run(() => houseService.reactToAnnouncement(a.id, e))} aria-pressed={mine} aria-label={`React ${e}`}
                          className={cn("flex min-h-[40px] min-w-[44px] items-center justify-center gap-1 rounded-full border px-3 text-sm", mine ? "border-primary bg-primary-soft" : "border-line bg-surface")}>
                          {e}{counts[e] ? <span className="text-xs font-bold">{counts[e]}</span> : null}
                        </motion.button>
                      );
                    })}
                    <Button size="sm" variant={acked ? "soft" : "secondary"} className="ml-auto" disabled={acked} onClick={() => run(() => houseService.acknowledgeAnnouncement(a.id), "Acknowledged")}>
                      <CheckCheck className="h-4 w-4" />{acked ? "Acknowledged" : "Got it"}
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] text-muted">{a.acknowledgedBy.length} of {app.members.length} acknowledged</p>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
