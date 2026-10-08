"use client";

import { Check } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface PersonChipsProps {
  people: Pick<User, "id" | "name" | "avatarColor" | "photo">[];
  selected: string[];
  onToggle: (id: string) => void;
  label: string;
  single?: boolean;
  meId?: string;
}

/** Multi/single select list of roommates rendered as tappable chips. */
export function PersonChips({ people, selected, onToggle, label, single, meId }: PersonChipsProps) {
  return (
    <div role={single ? "radiogroup" : "group"} aria-label={label} className="flex flex-wrap gap-2">
      {people.map((p) => {
        const on = selected.includes(p.id);
        return (
          <button
            key={p.id}
            type="button"
            role={single ? "radio" : "checkbox"}
            aria-checked={on}
            onClick={() => onToggle(p.id)}
            className={cn(
              "flex min-h-[44px] items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-[13px] font-semibold transition-all",
              on ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface text-muted hover:text-ink",
            )}
          >
            <Avatar user={p} size="xs" />
            {p.id === meId ? "You" : p.name}
            {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}
