"use client";

import { AnimatePresence } from "framer-motion";
import { ClipboardCheck, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useActions } from "@/components/AppActions";
import { ChoreCard, choreStatus } from "@/components/chores/ChoreCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MiniSelect, SearchBox } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { useAction } from "@/hooks/useAction";
import { useApp } from "@/hooks/useApp";
import { daysFromNow } from "@/lib/format";
import { nextInRotation } from "@/lib/selectors";
import { choreService } from "@/lib/services";
import type { ChoreStatus } from "@/types";

type Filter = "all" | ChoreStatus;

export default function ChoresPage() {
  const app = useApp();
  const actions = useActions();
  const run = useAction();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Filter>("all");
  const [person, setPerson] = useState("all");
  const [due, setDue] = useState("all");

  const chores = useMemo(() => (app ? app.db.chores.filter((c) => c.householdId === app.household.id) : []), [app]);
  const filtered = useMemo(() => chores
    .filter((c) => (q ? `${c.title} ${c.description ?? ""}`.toLowerCase().includes(q.toLowerCase()) : true))
    .filter((c) => (status === "all" ? true : choreStatus(c) === status))
    .filter((c) => (person === "all" ? true : c.assignedTo === person))
    .filter((c) => (due === "all" ? true : due === "today" ? daysFromNow(c.dueDate) <= 0 : daysFromNow(c.dueDate) <= 7))
    .sort((a, b) => Number(a.completed) - Number(b.completed) || +new Date(a.dueDate) - +new Date(b.dueDate)), [chores, q, status, person, due]);

  if (!app) return null;
  const counts = (s: ChoreStatus) => chores.filter((c) => choreStatus(c) === s).length;
  const thisWeek = chores.filter((c) => c.frequency !== "once" && !c.completed);
  const rotating = thisWeek.find((c) => c.rotation.length > 1);

  return (
    <div>
      <PageHeader title="Chores" subtitle={`${counts("upcoming") + counts("in_progress")} to do · ${counts("overdue")} overdue`}
        right={<Button size="sm" onClick={() => actions.addChore()}><Plus className="h-4 w-4" />Add</Button>} />
      <div className="space-y-4 px-4 pt-2 pb-6">
        {rotating && (
          <Card className="bg-gradient-to-br from-violet-soft to-surface">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted">This week · {rotating.title}</p>
            <div className="mt-3 flex items-center gap-3">
              {app.userById(rotating.assignedTo) && <Avatar user={app.userById(rotating.assignedTo)!} size="md" />}
              <div className="flex-1"><p className="text-lg font-extrabold">{app.nameOf(rotating.assignedTo)}</p><p className="text-xs text-muted">Next week: {app.nameOf(nextInRotation(rotating.rotation, rotating.assignedTo))}</p></div>
            </div>
            <div className="mt-3 flex -space-x-1.5" aria-label="Rotation order">
              {rotating.rotation.map((id) => app.userById(id) && <Avatar key={id} user={app.userById(id)!} size="xs" className="ring-2 ring-surface" />)}
            </div>
          </Card>
        )}
        <SearchBox value={q} onChange={setQ} placeholder="Search chores" />
        <Tabs<Filter> label="Filter chores" value={status} onChange={setStatus} options={[
          { value: "all", label: "All", count: chores.length }, { value: "upcoming", label: "Upcoming", count: counts("upcoming") }, { value: "in_progress", label: "In progress", count: counts("in_progress") },
          { value: "overdue", label: "Overdue", count: counts("overdue") }, { value: "completed", label: "Completed", count: counts("completed") },
        ]} />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <MiniSelect label="Assigned to" value={person} onChange={setPerson} options={[{ value: "all", label: "Everyone" }, ...app.members.map((m) => ({ value: m.user.id, label: m.user.id === app.user.id ? "Me" : m.user.name }))]} />
          <MiniSelect label="Due" value={due} onChange={setDue} options={[{ value: "all", label: "Any date" }, { value: "today", label: "Due today / overdue" }, { value: "week", label: "Next 7 days" }]} />
        </div>
        {chores.length === 0 ? (
          <EmptyState icon={<ClipboardCheck className="h-7 w-7" />} title="Your chore board is clear" description="Add a chore and set it to rotate between roommates." actionLabel="Add chore" onAction={() => actions.addChore()} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<ClipboardCheck className="h-7 w-7" />} title="No chores match" description="Try a different filter." />
        ) : (
          <div className="space-y-3"><AnimatePresence initial={false}>
            {filtered.map((c) => {
              const nextId = nextInRotation(c.rotation, c.assignedTo);
              const mine = c.assignedTo === app.user.id;
              return (
                <ChoreCard key={c.id} chore={c} assignee={app.userById(c.assignedTo)} nextUp={nextId !== c.assignedTo ? app.userById(nextId) : undefined}
                  canEdit={mine || app.canManage}
                  onComplete={() => run(() => choreService.complete(c.id), "Chore completed — nice work!")} onReopen={() => run(() => choreService.reopen(c.id), "Chore reopened")}
                  onProgress={() => run(() => choreService.setInProgress(c.id))} onEdit={() => actions.addChore(c)} onDelete={() => run(() => choreService.remove(c.id), "Chore deleted")} />
              );
            })}
          </AnimatePresence></div>
        )}
      </div>
    </div>
  );
}
