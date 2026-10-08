import { currentHousehold, currentUser } from "@/lib/selectors";
import { dbStore } from "@/store/db";

/** Where to send a user right after authentication. */
export function selectedHouseholdPath(): string {
  const db = dbStore.read();
  if (!currentUser(db)) return "/welcome";
  return currentHousehold(db) ? "/home" : "/household";
}

export const NAV_ITEMS = [
  { href: "/home", label: "Home" },
  { href: "/expenses", label: "Expenses" },
  { href: "/chores", label: "Chores" },
  { href: "/house", label: "House" },
  { href: "/profile", label: "Profile" },
] as const;
