import { currentHousehold, currentUser, membersOf } from "@/lib/selectors";
import { nowIso, uid } from "@/lib/utils";
import { dbStore } from "@/store/db";
import type { AppNotification, Db, Household, NotificationType, Receipt, User } from "@/types";

export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceError";
  }
}

export interface Ctx {
  db: Db;
  user: User;
  household: Household;
}

export function requireUser(db: Db): User {
  const user = currentUser(db);
  if (!user) throw new ServiceError("Please log in to continue.");
  return user;
}

/** Runs a mutation with an authenticated user + active household. */
export function mutate<T>(fn: (ctx: Ctx) => T): T {
  return dbStore.update((db) => {
    const user = requireUser(db);
    const household = currentHousehold(db);
    if (!household) throw new ServiceError("Join or create a household first.");
    return fn({ db, user, household });
  });
}

/** Runs a mutation that only needs an authenticated user. */
export function mutateUser<T>(fn: (db: Db, user: User) => T): T {
  return dbStore.update((db) => fn(db, requireUser(db)));
}

export function notify(
  db: Db, householdId: string, userIds: string[], type: NotificationType, title: string, description: string,
): void {
  for (const userId of new Set(userIds)) {
    const n: AppNotification = {
      id: uid(), householdId, userId, type, title, description, read: false, createdAt: nowIso(),
    };
    db.notifications.unshift(n);
  }
}

export function otherMemberIds(db: Db, householdId: string, exceptUserId: string): string[] {
  return membersOf(db, householdId).map((m) => m.user.id).filter((id) => id !== exceptUserId);
}

export function receiptNumber(): string {
  return `RM-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
}

export function saveReceipt(db: Db, key: string, receipt: Receipt): Receipt {
  db.receipts[key] = receipt;
  return receipt;
}
