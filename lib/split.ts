import { round2, sum } from "@/lib/utils";
import type { ExpenseSplit, SplitMode } from "@/types";

export interface SplitInput {
  mode: SplitMode;
  amount: number;
  participants: string[];
  /** percentage (0-100) for "percentage", rupee amount for "custom", ignored for "equal" */
  values: Record<string, number>;
}

export interface SplitResult {
  splits: ExpenseSplit[];
  error?: string;
  /** difference between target and allocated (amount for custom, percent for percentage) */
  remaining: number;
}

export function equalSplit(amount: number, ids: string[]): ExpenseSplit[] {
  if (!ids.length) return [];
  const cents = Math.round(amount * 100);
  const base = Math.floor(cents / ids.length);
  const extra = cents - base * ids.length;
  return ids.map((userId, i) => ({ userId, amount: (base + (i < extra ? 1 : 0)) / 100 }));
}

export function computeSplits({ mode, amount, participants, values }: SplitInput): SplitResult {
  if (!participants.length) return { splits: [], error: "Pick at least one person to split with.", remaining: amount };
  if (mode === "equal") return { splits: equalSplit(amount, participants), remaining: 0 };

  if (mode === "percentage") {
    const pcts = participants.map((id) => values[id] ?? 0);
    const total = round2(sum(pcts));
    const remaining = round2(100 - total);
    if (remaining !== 0) return { splits: [], error: `Percentages must add up to 100% (currently ${total}%).`, remaining };
    const splits = participants.map((userId, i) => ({ userId, amount: round2((amount * pcts[i]) / 100) }));
    const drift = round2(amount - sum(splits.map((s) => s.amount)));
    if (splits.length) splits[0].amount = round2(splits[0].amount + drift);
    return { splits: splits.filter((s) => s.amount > 0), remaining: 0 };
  }

  const splits = participants.map((userId) => ({ userId, amount: round2(values[userId] ?? 0) }));
  const remaining = round2(amount - sum(splits.map((s) => s.amount)));
  if (remaining !== 0) return { splits: [], error: `Custom amounts must add up to the total (₹${remaining} left to allocate).`, remaining };
  return { splits: splits.filter((s) => s.amount > 0), remaining: 0 };
}

export function validateSplitTotal(amount: number, splits: ExpenseSplit[]): boolean {
  return Math.abs(round2(sum(splits.map((s) => s.amount))) - round2(amount)) < 0.01;
}
