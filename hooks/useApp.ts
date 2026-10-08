"use client";

import { useMemo } from "react";
import { DEFAULT_PREFS } from "@/lib/services/authService";
import { canManageHousehold } from "@/lib/permissions";
import { currentHousehold, currentUser, membersOf, type MemberView, myHouseholds } from "@/lib/selectors";
import { useDb } from "@/store/db";
import type { Db, Household, Preferences, Role, User } from "@/types";

export interface AppState {
  db: Db;
  user: User;
  household: Household;
  households: Household[];
  members: MemberView[];
  role: Role;
  canManage: boolean;
  isOwner: boolean;
  prefs: Preferences;
  nameOf: (id: string) => string;
  userById: (id: string) => User | undefined;
}

/** Session snapshot: `ready` is false until local data has hydrated. */
export function useSession() {
  const db = useDb();
  return {
    ready: db !== null,
    db,
    user: db ? currentUser(db) : null,
    household: db ? currentHousehold(db) : null,
  };
}

/** Fully-resolved app context for authenticated screens. Null when not signed in / no household. */
export function useApp(): AppState | null {
  const db = useDb();
  return useMemo(() => {
    if (!db) return null;
    const user = currentUser(db);
    const household = currentHousehold(db);
    if (!user || !household) return null;
    const members = membersOf(db, household.id);
    const role = members.find((m) => m.user.id === user.id)?.member.role ?? "MEMBER";
    return {
      db, user, household, members, role,
      households: myHouseholds(db, user.id),
      canManage: canManageHousehold(db, user, household.id),
      isOwner: role === "OWNER",
      prefs: { ...DEFAULT_PREFS, ...db.prefs[user.id] },
      nameOf: (id: string) => (id === user.id ? "You" : members.find((m) => m.user.id === id)?.user.name ?? "Someone"),
      userById: (id: string) => members.find((m) => m.user.id === id)?.user,
    };
  }, [db]);
}
