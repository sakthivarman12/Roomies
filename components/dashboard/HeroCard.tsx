"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { GROUP_COLOR } from "@/lib/constants";
import { monthLabel } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/Progress";
import { breakdown, monthChange, monthTotal } from "@/lib/selectors";
import { useApp } from "@/hooks/useApp";
import { money } from "@/lib/format";

export function HeroCard() {
  const app = useApp();
  if (!app) return null;
  const { db, household } = app;
  const total = monthTotal(db, household.id);
  const change = monthChange(db, household.id);
  const parts = breakdown(db, household.id).filter((p) => p.amount > 0);
  const up = change >= 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      aria-label="Household expenses this month"
      className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] p-6 text-white shadow-[var(--shadow-lg)]"
    >
      <motion.div aria-hidden className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-emerald-300/15" animate={{ scale: [1.05, 1, 1.05] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/70">{household.name}</p>
            <p className="mt-0.5 text-sm text-white/80">{monthLabel(new Date())} expenses</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold backdrop-blur">
            {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(change)}% <span className="sr-only">{up ? "up" : "down"} from last month</span>
          </span>
        </div>
        <p className="mt-5 text-[44px] font-black leading-none tracking-tight"><AnimatedNumber value={total} /></p>
        <p className="mt-1.5 text-xs text-white/70">{up ? "↑" : "↓"} {Math.abs(change)}% from last month</p>

        <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-white/15" role="img" aria-label={`Spending split: ${parts.map((p) => `${p.label} ${money(p.amount)}`).join(", ")}`}>
          {parts.map((p, i) => (
            <motion.div key={p.label} initial={{ width: 0 }} animate={{ width: `${(p.amount / (total || 1)) * 100}%` }} transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 100, damping: 20 }} style={{ background: GROUP_COLOR[p.label], opacity: 0.95 }} className="mr-0.5 last:mr-0" />
          ))}
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4">
          {["Rent", "Electricity", "Internet", "Groceries", "Other"].slice(0, 4).map((label) => {
            const p = parts.find((x) => x.label === label);
            return (
              <li key={label} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: GROUP_COLOR[label] }} />
                <span className="text-white/75">{label}</span>
                <span className="tnum ml-auto font-bold sm:ml-1">{money(p?.amount ?? 0)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.section>
  );
}
