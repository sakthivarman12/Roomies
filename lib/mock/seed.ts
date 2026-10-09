import { DB_VERSION } from "@/lib/constants";
import type { Db } from "@/types";

/** Fresh, empty database: no demo users, households, expenses or activity. */
export function buildSeed(): Db {
  return {
    version: DB_VERSION,
    users: [],
    households: [],
    members: [],
    expenses: [],
    payments: [],
    bills: [],
    chores: [],
    shopping: [],
    announcements: [],
    notifications: [],
    invites: [],
    documents: [],
    events: [],
    galleryPhotos: [],
    locations: [],
    stories: [],
    joinRequests: [],
    fund: [],
    galleryFolders: [],
    receipts: {},
    session: { userId: null, householdId: null },
    prefs: {},
  };
}
