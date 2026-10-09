import { isSameMonth } from "@/lib/format";
import { round2, sum } from "@/lib/utils";
import type { Expense } from "@/types";

export function inMonth(list: Expense[], ref: Date): Expense[] {
  return list.filter((e) => isSameMonth(e.date, ref));
}

/** What a person consumed (their split share) vs. what they paid out, per month for the last N months. */
export function personMonthly(list: Expense[], userId: string, months = 6, now: Date = new Date()) {
  const out: { label: string; ref: Date; share: number; paid: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = inMonth(list, ref);
    out.push({
      label: ref.toLocaleDateString("en-IN", { month: "short" }), ref,
      share: round2(sum(m.map((e) => e.splits.find((s) => s.userId === userId)?.amount ?? 0))),
      paid: round2(sum(m.filter((e) => e.paidBy === userId && !e.paidFromFund).map((e) => e.amount))),
    });
  }
  return out;
}
