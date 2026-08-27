import type { ExpenseRow, SettlementRow } from '../types/database';

export interface SplitInput {
  userId: string;
  amount?: number;
  percentage?: number;
  shares?: number;
}

/** Compute per-user amounts for a given split method. Returns amounts rounded to 2dp, remainder assigned to first payer. */
export function computeSplits(
  method: 'equal' | 'custom' | 'percentage' | 'shares',
  totalAmount: number,
  participants: SplitInput[]
): { userId: string; amount: number; percentage?: number; shares?: number }[] {
  if (participants.length === 0) return [];

  if (method === 'equal') {
    const base = Math.floor((totalAmount / participants.length) * 100) / 100;
    const results = participants.map((p) => ({ userId: p.userId, amount: base }));
    const remainder = round2(totalAmount - base * participants.length);
    results[0].amount = round2(results[0].amount + remainder);
    return results;
  }

  if (method === 'custom') {
    return participants.map((p) => ({ userId: p.userId, amount: round2(p.amount ?? 0) }));
  }

  if (method === 'percentage') {
    const results = participants.map((p) => ({
      userId: p.userId,
      percentage: p.percentage ?? 0,
      amount: round2((totalAmount * (p.percentage ?? 0)) / 100),
    }));
    const sum = round2(results.reduce((acc, r) => acc + r.amount, 0));
    const remainder = round2(totalAmount - sum);
    if (results.length) results[0].amount = round2(results[0].amount + remainder);
    return results;
  }

  // shares
  const totalShares = participants.reduce((acc, p) => acc + (p.shares ?? 0), 0) || 1;
  const results = participants.map((p) => ({
    userId: p.userId,
    shares: p.shares ?? 0,
    amount: round2((totalAmount * (p.shares ?? 0)) / totalShares),
  }));
  const sum = round2(results.reduce((acc, r) => acc + r.amount, 0));
  const remainder = round2(totalAmount - sum);
  if (results.length) results[0].amount = round2(results[0].amount + remainder);
  return results;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export interface Balance {
  userId: string;
  net: number; // positive = others owe them, negative = they owe others
}

/**
 * Compute net balance per user: sum(what they paid) - sum(what they owe from splits) + settlements netting.
 */
export function computeBalances(
  expenses: ExpenseRow[],
  settlements: SettlementRow[],
  userIds: string[]
): Balance[] {
  const net: Record<string, number> = {};
  userIds.forEach((id) => (net[id] = 0));

  for (const e of expenses) {
    net[e.paid_by] = (net[e.paid_by] ?? 0) + Number(e.amount);
    for (const s of e.splits ?? []) {
      net[s.user_id] = (net[s.user_id] ?? 0) - Number(s.amount);
    }
  }

  for (const s of settlements) {
    if (s.status !== 'paid') continue;
    net[s.from_user] = (net[s.from_user] ?? 0) + Number(s.amount);
    net[s.to_user] = (net[s.to_user] ?? 0) - Number(s.amount);
  }

  return userIds.map((id) => ({ userId: id, net: round2(net[id] ?? 0) }));
}

export interface SimplifiedDebt {
  from: string;
  to: string;
  amount: number;
}

/** Simplify debts: minimal set of payments so all balances reach zero (greedy max-debtor to max-creditor). */
export function simplifyDebts(balances: Balance[]): SimplifiedDebt[] {
  const debtors = balances.filter((b) => b.net < -0.005).map((b) => ({ ...b }));
  const creditors = balances.filter((b) => b.net > 0.005).map((b) => ({ ...b }));
  const result: SimplifiedDebt[] = [];

  debtors.sort((a, b) => a.net - b.net);
  creditors.sort((a, b) => b.net - a.net);

  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = round2(Math.min(-debtor.net, creditor.net));
    if (amount > 0.005) {
      result.push({ from: debtor.userId, to: creditor.userId, amount });
      debtor.net = round2(debtor.net + amount);
      creditor.net = round2(creditor.net - amount);
    }
    if (Math.abs(debtor.net) < 0.01) i++;
    if (Math.abs(creditor.net) < 0.01) j++;
  }

  return result;
}
