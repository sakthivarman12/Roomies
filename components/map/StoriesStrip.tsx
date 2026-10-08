"use client";

import { Plus } from "lucide-react";
import { useActions } from "@/components/AppActions";
import { Avatar } from "@/components/ui/Avatar";
import { useApp } from "@/hooks/useApp";
import { activeStories } from "@/lib/selectors";
import { cn } from "@/lib/utils";

/** Instagram-style row of roommates with a ring when they have a fresh update. */
export function StoriesStrip() {
  const app = useApp();
  const actions = useActions();
  if (!app) return null;
  const stories = activeStories(app.db, app.household.id);
  const people = app.members.map((m) => m.user).sort((a, b) => Number(stories.some((s) => s.userId === b.id)) - Number(stories.some((s) => s.userId === a.id)));

  return (
    <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 py-1" role="list" aria-label="Roommate updates">
      <div role="listitem" className="flex w-16 shrink-0 flex-col items-center gap-1.5">
        <button onClick={actions.addStory} aria-label="Share an update" className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-primary text-primary">
          <Avatar user={app.user} size="md" className="opacity-70" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-ink ring-2 ring-[var(--bg)]"><Plus className="h-4 w-4" strokeWidth={3} /></span>
        </button>
        <span className="text-[11px] font-semibold text-muted">Add update</span>
      </div>
      {people.map((u) => {
        const mine = stories.filter((s) => s.userId === u.id);
        if (!mine.length) return null;
        const unseen = mine.some((s) => !s.viewedBy.includes(app.user.id));
        return (
          <div role="listitem" key={u.id} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
            <button onClick={() => actions.viewStory(u.id)} aria-label={`View ${u.id === app.user.id ? "your" : `${u.name}'s`} update`}
              className={cn("rounded-full p-[3px]", unseen ? "bg-gradient-to-tr from-[var(--c-amber)] via-[var(--c-pink)] to-[var(--primary)]" : "bg-line")}>
              <span className="block rounded-full bg-[var(--bg)] p-[2px]"><Avatar user={u} size="md" /></span>
            </button>
            <span className="max-w-full truncate text-[11px] font-semibold">{u.id === app.user.id ? "You" : u.name}</span>
          </div>
        );
      })}
    </div>
  );
}
