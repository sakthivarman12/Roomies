import type { Db, Expense, Role, User } from "@/types";

export class PermissionError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "PermissionError";
  }
}

export function roleOf(db: Db, userId: string | null | undefined, householdId: string | null | undefined): Role | null {
  if (!userId || !householdId) return null;
  return db.members.find((m) => m.userId === userId && m.householdId === householdId)?.role ?? null;
}

export function isMember(db: Db, user: User | null, householdId: string): boolean {
  return roleOf(db, user?.id, householdId) !== null;
}

export function canManageHousehold(db: Db, user: User | null, householdId: string): boolean {
  const r = roleOf(db, user?.id, householdId);
  return r === "OWNER" || r === "ADMIN";
}

export function canManageMembers(db: Db, user: User | null, householdId: string): boolean {
  return canManageHousehold(db, user, householdId);
}

export function canChangeRoles(db: Db, user: User | null, householdId: string): boolean {
  return roleOf(db, user?.id, householdId) === "OWNER";
}

export function canEditExpense(db: Db, user: User | null, expense: Expense): boolean {
  if (!user || !isMember(db, user, expense.householdId)) return false;
  return expense.createdBy === user.id || expense.paidBy === user.id || canManageHousehold(db, user, expense.householdId);
}

export function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) throw new PermissionError(message);
}
