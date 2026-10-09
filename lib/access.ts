import { roleOf } from "@/lib/permissions";
import { householdExpenses } from "@/lib/selectors";
import { FULL_ACCESS, type Db, type Expense, type FundEntry, type Restrictions } from "@/types";

/** Effective permissions for a member. Owners/admins and legacy members without settings get full access. */
export function restrictionsOf(db: Db, userId: string, householdId: string): Restrictions {
  const role = roleOf(db, userId, householdId);
  if (role === "OWNER" || role === "ADMIN") return FULL_ACCESS;
  const m = db.members.find((x) => x.userId === userId && x.householdId === householdId);
  return { ...FULL_ACCESS, ...m?.restrictions };
}

/** Expenses this person is allowed to see (restricted members only see ones they're part of). */
export function visibleExpenses(db: Db, householdId: string, userId: string): Expense[] {
  const all = householdExpenses(db, householdId);
  if (restrictionsOf(db, userId, householdId).seeAllExpenses) return all;
  return all.filter((e) => e.paidBy === userId || e.splits.some((s) => s.userId === userId));
}

export function fundEntries(db: Db, householdId: string): FundEntry[] {
  return db.fund.filter((f) => f.householdId === householdId).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function fundBalance(db: Db, householdId: string): number {
  const total = db.fund.filter((f) => f.householdId === householdId).reduce((a, f) => a + (f.kind === "contribution" ? f.amount : -f.amount), 0);
  return Math.round(total * 100) / 100;
}

export function pendingRequestFor(db: Db, userId: string) {
  return db.joinRequests.find((r) => r.userId === userId && r.status === "pending") ?? null;
}
