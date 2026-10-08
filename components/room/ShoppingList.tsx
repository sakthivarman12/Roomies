"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { useAction } from "@/hooks/useAction";
import { useApp } from "@/hooks/useApp";
import { houseService } from "@/lib/services";
import { cn } from "@/lib/utils";
import type { ShoppingItem } from "@/types";

function Row({ item, adderName, adder, onToggle, onRemove }: { item: ShoppingItem; adderName: string; adder?: React.ComponentProps<typeof Avatar>["user"]; onToggle: () => void; onRemove: () => void }) {
  return (
    <motion.li
      layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
      className="relative overflow-hidden rounded-2xl"
    >
      <div className="absolute inset-0 flex items-center justify-end bg-danger px-5 text-white" aria-hidden><Trash2 className="h-5 w-5" /></div>
      <motion.div
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.5, right: 0 }}
        onDragEnd={(_, info) => { if (info.offset.x < -90) onRemove(); }}
        className="relative flex min-h-[56px] items-center gap-3 bg-surface px-3"
      >
        <button onClick={onToggle} role="checkbox" aria-checked={item.purchased} aria-label={`${item.name}, ${item.purchased ? "purchased" : "to buy"}`}
          className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors", item.purchased ? "border-success bg-success text-white" : "border-line")}>
          <AnimatePresence>{item.purchased && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check className="h-4 w-4" strokeWidth={3} /></motion.span>}</AnimatePresence>
        </button>
        <div className="min-w-0 flex-1 py-2">
          <p className="relative inline-block max-w-full truncate text-[15px] font-semibold">
            <span className={cn("transition-colors", item.purchased && "text-muted")}>{item.name}</span>
            <motion.span aria-hidden className="absolute left-0 top-1/2 h-0.5 bg-muted" initial={false} animate={{ width: item.purchased ? "100%" : "0%" }} transition={{ duration: 0.25 }} />
          </p>
          <p className="text-xs text-muted">{item.quantity} · added by {adderName}</p>
        </div>
        {adder && <Avatar user={adder} size="xs" />}
        <button onClick={onRemove} aria-label={`Remove ${item.name}`} className="hidden h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger sm:flex"><Trash2 className="h-4 w-4" /></button>
      </motion.div>
    </motion.li>
  );
}

export function ShoppingList({ limit, showAdd = true }: { limit?: number; showAdd?: boolean }) {
  const app = useApp();
  const run = useAction();
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  if (!app) return null;

  const all = app.db.shopping.filter((s) => s.householdId === app.household.id);
  const todo = all.filter((s) => !s.purchased);
  const done = all.filter((s) => s.purchased);
  const items = limit ? [...todo, ...done].slice(0, limit) : [...todo, ...done];

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (run(() => houseService.addShoppingItem(name, qty), "Added to shopping list")) { setName(""); setQty(""); }
  };

  return (
    <div>
      {showAdd && (
        <form onSubmit={add} className="mb-3 flex gap-2">
          <input aria-label="Item" value={name} onChange={(e) => setName(e.target.value)} placeholder="Add an item…" className="min-h-[48px] min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 text-[15px] focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10" />
          <input aria-label="Quantity" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty" className="min-h-[48px] w-16 rounded-2xl border border-line bg-surface px-3 text-center text-[15px] focus:border-primary focus:outline-none sm:w-20" />
          <Button type="submit" aria-label="Add item" className="w-12 px-0"><Plus className="h-5 w-5" /></Button>
        </form>
      )}
      {items.length === 0 ? (
        <EmptyState icon={<ShoppingBasket className="h-7 w-7" />} title="Shopping list is empty" description="Add what the house needs and everyone can tick things off." />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <Row key={item.id} item={item} adderName={app.nameOf(item.addedBy)} adder={app.userById(item.addedBy)}
                onToggle={() => run(() => houseService.toggleShoppingItem(item.id))} onRemove={() => run(() => houseService.removeShoppingItem(item.id))} />
            ))}
          </AnimatePresence>
        </ul>
      )}
      {!limit && done.length > 0 && <Button variant="ghost" size="sm" className="mt-2" onClick={() => run(() => houseService.clearPurchased(), "Cleared purchased items")}>Clear purchased ({done.length})</Button>}
    </div>
  );
}
