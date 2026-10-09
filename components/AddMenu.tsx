"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Camera, CalendarPlus, ClipboardPlus, FilePlus2, HandCoins, Images, Megaphone, Plus, Receipt, Repeat2, ShoppingBasket, UserPlus, X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useActions } from "@/components/AppActions";
import { restrictionsOf } from "@/lib/access";
import { IconButton } from "@/components/ui/Button";
import { useApp } from "@/hooks/useApp";
import { cn } from "@/lib/utils";

interface Item { label: string; hint: string; icon: LucideIcon; run: () => void; managerOnly?: boolean; tone: string }

/** "+" button with a dropdown of every "add" action in the app. */
export function AddMenu() {
  const app = useApp();
  const a = useActions();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!app) return null;
  const canAdd = restrictionsOf(app.db, app.user.id, app.household.id).addExpenses;

  const items: Item[] = [
    { label: "Expense", hint: "Split a cost with roommates", icon: Receipt, run: () => a.addExpense(), tone: "bg-info-soft text-info" },
    { label: "Settle up", hint: "Pay back a roommate", icon: HandCoins, run: () => a.settle(), tone: "bg-success-soft text-success" },
    { label: "Update / story", hint: "Photo or video for 24 hours", icon: Camera, run: a.addStory, tone: "bg-danger-soft text-danger" },
    { label: "Chore", hint: "Assign or rotate a task", icon: ClipboardPlus, run: () => a.addChore(), tone: "bg-violet-soft text-violet" },
    { label: "Shopping item", hint: "Add to the shared list", icon: ShoppingBasket, run: a.addShopping, tone: "bg-warning-soft text-warning" },
    { label: "Event", hint: "Dinner, visit, party…", icon: CalendarPlus, run: a.addEvent, tone: "bg-info-soft text-info" },
    { label: "Photos / videos", hint: "Add to the gallery", icon: Images, run: a.addPhotos, tone: "bg-primary-soft text-primary" },
    { label: "Bill", hint: "Recurring or one-time", icon: Repeat2, run: a.addBill, managerOnly: true, tone: "bg-warning-soft text-warning" },
    { label: "Announcement", hint: "Notify the whole house", icon: Megaphone, run: a.addAnnouncement, managerOnly: true, tone: "bg-violet-soft text-violet" },
    { label: "Document", hint: "Agreements, manuals", icon: FilePlus2, run: a.addDocument, managerOnly: true, tone: "bg-surface2 text-muted" },
    { label: "Roommate", hint: "Add someone to the house", icon: UserPlus, run: a.addMember, managerOnly: true, tone: "bg-success-soft text-success" },
  ].filter((i) => (!i.managerOnly || app.canManage) && (canAdd || !["Expense", "Settle up"].includes(i.label)));

  return (
    <div ref={box} className="relative">
      <IconButton label={open ? "Close add menu" : "Add"} tone="filled" aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((o) => !o)}>
        <motion.span animate={{ rotate: open ? 135 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 22 }} className="flex">{open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}</motion.span>
      </IconButton>
      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId} role="menu" aria-label="Add"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[272px] origin-top-right overflow-hidden rounded-3xl border border-line bg-strong p-2 shadow-[var(--shadow-lg)]"
            initial={{ opacity: 0, scale: 0.9, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
          >
            <p className="px-3 pb-1 pt-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted">Add new</p>
            <ul className="max-h-[70dvh] overflow-y-auto">
              {items.map((it, i) => (
                <motion.li key={it.label} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}>
                  <button role="menuitem" onClick={() => { setOpen(false); it.run(); }} className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl px-2.5 py-1.5 text-left transition-colors hover:bg-surface2">
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", it.tone)}><it.icon className="h-[18px] w-[18px]" /></span>
                    <span className="min-w-0"><span className="block text-sm font-bold">{it.label}</span><span className="block truncate text-[11px] text-muted">{it.hint}</span></span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
