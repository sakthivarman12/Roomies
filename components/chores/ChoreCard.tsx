"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Pencil, Play, RotateCcw, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type Tone } from "@/components/ui/Badge";
import { daysFromNow, dueLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Chore, ChoreStatus, User } from "@/types";

export function choreStatus(c: Chore): ChoreStatus {
  if (c.completed) return "completed";
  if (daysFromNow(c.dueDate) < 0) return "overdue";
  if (c.inProgress) return "in_progress";
  return "upcoming";
}

export const STATUS_LABEL: Record<ChoreStatus, string> = { upcoming: "Upcoming", in_progress: "In progress", completed: "Completed", overdue: "Overdue" };
const STATUS_TONE: Record<ChoreStatus, Tone> = { upcoming: "info", in_progress: "violet", completed: "success", overdue: "danger" };
const PRIORITY_TONE: Record<Chore["priority"], Tone> = { low: "neutral", medium: "warning", high: "danger" };

interface Props {
  chore: Chore;
  assignee?: User;
  nextUp?: User;
  canEdit: boolean;
  onComplete: () => void;
  onReopen: () => void;
  onProgress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ChoreCard({ chore, assignee, nextUp, canEdit, onComplete, onReopen, onProgress, onEdit, onDelete }: Props) {
  const status = choreStatus(chore);
  const done = status === "completed";
  return (
    <motion.article layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} className={cn("rounded-3xl border bg-surface p-4 shadow-card", status === "overdue" ? "border-danger/40" : "border-line")}>
      <div className="flex items-start gap-3.5">
        <button
          onClick={done ? onReopen : onComplete}
          aria-label={done ? `Mark ${chore.title} as not done` : `Complete ${chore.title}`}
          className={cn("relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 transition-colors", done ? "border-success bg-success text-white" : "border-line text-transparent hover:border-success hover:text-success")}
        >
          <AnimatePresence>{done && <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}><Check className="h-6 w-6" strokeWidth={3} /></motion.span>}</AnimatePresence>
          {!done && <Check className="h-6 w-6 opacity-0 hover:opacity-100" strokeWidth={3} />}
        </button>
        <div className="min-w-0 flex-1">
          <h3 className={cn("text-[15px] font-bold", done && "text-muted line-through decoration-2")}>{chore.title}</h3>
          {chore.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{chore.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
            <Badge tone={PRIORITY_TONE[chore.priority]}>{chore.priority[0].toUpperCase() + chore.priority.slice(1)} priority</Badge>
            {chore.frequency !== "once" && <Badge tone="neutral">{chore.frequency}</Badge>}
          </div>
        </div>
        {assignee && <Avatar user={assignee} size="sm" />}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
        <div className="min-w-0 text-xs">
          <p className="font-semibold">{assignee?.name ?? "Unassigned"}{" · "}<span className={cn(status === "overdue" ? "text-danger" : "text-muted")}>{done ? "Done" : dueLabel(chore.dueDate)}</span></p>
          {nextUp && chore.frequency !== "once" && !done && <p className="text-muted">Next: {nextUp.name}</p>}
        </div>
        <div className="flex shrink-0 items-center">
          {!done && <button onClick={onProgress} aria-label={chore.inProgress ? "Stop progress" : "Start chore"} title={chore.inProgress ? "Mark not started" : "Start"} className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface2">{chore.inProgress ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>}
          {canEdit && <button onClick={onEdit} aria-label={`Edit ${chore.title}`} className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface2"><Pencil className="h-4 w-4" /></button>}
          {canEdit && <button onClick={onDelete} aria-label={`Delete ${chore.title}`} className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"><Trash2 className="h-4 w-4" /></button>}
        </div>
      </div>
    </motion.article>
  );
}
