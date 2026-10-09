import type { SupabaseClient } from "@supabase/supabase-js";
import { DB_VERSION } from "@/lib/constants";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Db } from "@/types";

/**
 * Mirrors the in-memory Db into the `roomies_state` table: one row per record (collection + id, JSON payload).
 * Startup loads the rows; each change upserts the records that differ from the last synced snapshot and
 * deletes the ones that were removed. The session stays on the device (localStorage only).
 */

const TABLE = "roomies_state";
const PAGE = 1000;
const CHUNK = 500;
const SEP = "\u0000";

const LIST_KEYS = [
  "users", "households", "members", "expenses", "payments", "bills", "chores", "shopping", "announcements",
  "notifications", "invites", "documents", "events", "galleryPhotos", "locations", "stories", "joinRequests",
  "fund", "galleryFolders",
] as const;
const MAP_KEYS = ["receipts", "prefs"] as const;

interface Row {
  collection: string;
  id: string;
  household_id: string | null;
  data: unknown;
}

/** Last state known to match Supabase: record key -> JSON payload. */
let baseline = new Map<string, string>();
let queue: Promise<void> = Promise.resolve();
/** Turned off when the initial load fails, so stale local data can't overwrite remote rows. */
let syncEnabled = true;

function snapshot(db: Db): Map<string, Row> {
  const rows = new Map<string, Row>();
  const add = (collection: string, id: string, data: unknown) => {
    const householdId = (data as { householdId?: unknown } | null)?.householdId;
    rows.set(collection + SEP + id, {
      collection, id, household_id: typeof householdId === "string" ? householdId : null, data,
    });
  };
  for (const key of LIST_KEYS) {
    // Locations have no id; one per member per household.
    for (const item of db[key] as unknown as { id?: string; householdId?: string; userId?: string }[]) {
      add(key, item.id ?? `${item.householdId}:${item.userId}`, item);
    }
  }
  for (const key of MAP_KEYS) {
    for (const [id, value] of Object.entries(db[key] as Record<string, unknown>)) add(key, id, value);
  }
  return rows;
}

function fromRows(rows: Row[], session: Db["session"]): Db {
  const db: Record<string, unknown> = { version: DB_VERSION, session };
  for (const key of LIST_KEYS) db[key] = [];
  for (const key of MAP_KEYS) db[key] = {};
  for (const row of rows) {
    if ((LIST_KEYS as readonly string[]).includes(row.collection)) (db[row.collection] as unknown[]).push(row.data);
    else if ((MAP_KEYS as readonly string[]).includes(row.collection)) (db[row.collection] as Record<string, unknown>)[row.id] = row.data;
  }
  return db as unknown as Db;
}

async function fetchRows(client: SupabaseClient): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client
      .from(TABLE).select("collection,id,household_id,data").order("collection").order("id").range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data as Row[]));
    if (data.length < PAGE) break;
  }
  return rows;
}

async function pushNow(db: Db): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !syncEnabled) return;
  const next = snapshot(db);
  const upserts: Row[] = [];
  next.forEach((row, key) => {
    if (baseline.get(key) !== JSON.stringify(row.data)) upserts.push(row);
  });
  const removed: string[] = [];
  baseline.forEach((_, key) => { if (!next.has(key)) removed.push(key); });

  for (let i = 0; i < upserts.length; i += CHUNK) {
    const chunk = upserts.slice(i, i + CHUNK).map((r) => ({ ...r, updated_at: new Date().toISOString() }));
    const { error } = await client.from(TABLE).upsert(chunk, { onConflict: "collection,id" });
    if (error) throw error;
  }
  const byCollection = new Map<string, string[]>();
  for (const key of removed) {
    const [collection, id] = key.split(SEP);
    byCollection.set(collection, [...(byCollection.get(collection) ?? []), id]);
  }
  for (const [collection, ids] of byCollection) {
    for (let i = 0; i < ids.length; i += CHUNK) {
      const { error } = await client.from(TABLE).delete().eq("collection", collection).in("id", ids.slice(i, i + CHUNK));
      if (error) throw error;
    }
  }

  for (const row of upserts) baseline.set(row.collection + SEP + row.id, JSON.stringify(row.data));
  for (const key of removed) baseline.delete(key);
}

function enqueue(task: () => Promise<void>): void {
  queue = queue.then(task).catch((err) => console.warn("Supabase sync failed; will retry on the next change.", err));
}

/**
 * Loads the household data from Supabase. If the table is empty, uploads the local data instead.
 * Writes queued before this finishes wait for it, so local state can't overwrite remote rows.
 */
export function startSync(local: Db, onRemote: (db: Db) => void): void {
  const client = getSupabaseClient();
  if (!client) return;
  queue = queue.then(async () => {
    const rows = await fetchRows(client);
    if (rows.length) {
      const remote = fromRows(rows, local.session);
      baseline = new Map([...snapshot(remote)].map(([key, row]) => [key, JSON.stringify(row.data)]));
      onRemote(remote);
    } else {
      baseline = new Map();
      await pushNow(local);
    }
  }).catch((err) => {
    syncEnabled = false;
    console.warn("Supabase load failed; using local data without syncing.", err);
  });
}

/** Queues a sync of the current Db. Safe to call on every change. */
export function pushDb(db: Db): void {
  if (!getSupabaseClient()) return;
  enqueue(() => pushNow(db));
}
