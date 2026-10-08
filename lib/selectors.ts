import { BREAKDOWN_GROUPS } from "@/lib/constants";
import { isSameMonth } from "@/lib/format";
import { round2, sum } from "@/lib/utils";
import type { Db, Expense, Household, HouseholdMember, Transaction, User } from "@/types";

export interface MemberView {
  user: User;
  member: HouseholdMember;
}

export function currentUser(db: Db): User | null {
  return db.users.find((u) => u.id === db.session.userId) ?? null;
}

export function myHouseholds(db: Db, userId: string): Household[] {
  const ids = db.members.filter((m) => m.userId === userId).map((m) => m.householdId);
  return db.households.filter((h) => ids.includes(h.id));
}

export function currentHousehold(db: Db): Household | null {
  const user = currentUser(db);
  if (!user) return null;
  const mine = myHouseholds(db, user.id);
  return mine.find((h) => h.id === db.session.householdId) ?? mine[0] ?? null;
}

export function membersOf(db: Db, householdId: string): MemberView[] {
  return db.members
    .filter((m) => m.householdId === householdId)
    .map((member) => ({ member, user: db.users.find((u) => u.id === member.userId) as User }))
    .filter((v) => Boolean(v.user));
}

export function userName(db: Db, id: string, me?: string): string {
  if (me && id === me) return "You";
  return db.users.find((u) => u.id === id)?.name ?? "Unknown";
}

export function householdExpenses(db: Db, householdId: string): Expense[] {
  return db.expenses
    .filter((e) => e.householdId === householdId)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

/** Positive => `other` owes `me`. Negative => `me` owes `other`. */
export function pairBalance(db: Db, householdId: string, me: string, other: string): number {
  let bal = 0;
  for (const e of db.expenses) {
    if (e.householdId !== householdId) continue;
    if (e.paidBy === me) bal += e.splits.find((s) => s.userId === other)?.amount ?? 0;
    if (e.paidBy === other) bal -= e.splits.find((s) => s.userId === me)?.amount ?? 0;
  }
  for (const p of db.payments) {
    if (p.householdId !== householdId) continue;
    if (p.fromUserId === other && p.toUserId === me) bal -= p.amount;
    if (p.fromUserId === me && p.toUserId === other) bal += p.amount;
  }
  return round2(bal);
}

/** Net position of a user: positive => owed money overall. */
export function netBalance(db: Db, householdId: string, userId: string): number {
  const others = membersOf(db, householdId).filter((m) => m.user.id !== userId);
  return round2(sum(others.map((o) => pairBalance(db, householdId, userId, o.user.id))));
}

export function monthTotal(db: Db, householdId: string, ref: Date = new Date()): number {
  return sum(householdExpenses(db, householdId).filter((e) => isSameMonth(e.date, ref)).map((e) => e.amount));
}

export function monthChange(db: Db, householdId: string): number {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const cur = monthTotal(db, householdId, now);
  const last = monthTotal(db, householdId, prev);
  if (!last) return cur ? 100 : 0;
  return Math.round(((cur - last) / last) * 1000) / 10;
}

export function breakdown(db: Db, householdId: string, ref: Date = new Date()): { label: string; amount: number }[] {
  const list = householdExpenses(db, householdId).filter((e) => isSameMonth(e.date, ref));
  return Object.entries(BREAKDOWN_GROUPS).map(([label, cats]) => ({
    label,
    amount: sum(list.filter((e) => cats.includes(e.category)).map((e) => e.amount)),
  }));
}

export function transactionsFor(db: Db, householdId: string, me: string): Transaction[] {
  const rows: Transaction[] = [];
  for (const e of householdExpenses(db, householdId)) {
    const myShare = e.splits.find((s) => s.userId === me)?.amount ?? 0;
    const paid = e.paidBy === me;
    const net = paid ? round2(e.amount - myShare) : -myShare;
    let settled = true;
    if (paid) {
      settled = e.splits.filter((s) => s.userId !== me).every((s) => pairBalance(db, householdId, me, s.userId) <= 0);
    } else if (myShare > 0) {
      settled = pairBalance(db, householdId, me, e.paidBy) >= 0;
    }
    rows.push({
      id: `tx-${e.id}`, kind: "expense", date: e.date, title: e.title, category: e.category,
      amount: e.amount, paidBy: e.paidBy, involved: e.splits.map((s) => s.userId), net, settled, refId: e.id,
    });
  }
  for (const p of db.payments.filter((x) => x.householdId === householdId)) {
    rows.push({
      id: `tx-${p.id}`, kind: "payment", date: p.createdAt, title: p.billId ? "Bill payment" : "Settlement",
      category: "Settlement", amount: p.amount, paidBy: p.fromUserId, involved: [p.fromUserId, p.toUserId],
      net: p.toUserId === me ? p.amount : p.fromUserId === me ? -p.amount : 0, settled: true, refId: p.id,
    });
  }
  return rows.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function monthlySeries(db: Db, householdId: string, months = 6): { label: string; total: number }[] {
  const out: { label: string; total: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ label: ref.toLocaleDateString("en-IN", { month: "short" }), total: monthTotal(db, householdId, ref) });
  }
  return out;
}

export function contributions(db: Db, householdId: string): { name: string; paid: number; color: string }[] {
  return membersOf(db, householdId).map(({ user }) => ({
    name: user.name,
    color: user.avatarColor,
    paid: sum(householdExpenses(db, householdId).filter((e) => e.paidBy === user.id).map((e) => e.amount)),
  }));
}

export function nextInRotation(rotation: string[], current: string): string {
  if (!rotation.length) return current;
  const i = rotation.indexOf(current);
  return rotation[(i + 1) % rotation.length] ?? current;
}
