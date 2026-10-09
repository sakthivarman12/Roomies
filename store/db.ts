"use client";

import { useSyncExternalStore } from "react";
import { repository } from "@/lib/repository";
import { pushDb, startSync } from "@/lib/supabase/sync";
import type { Db } from "@/types";

let state: Db | null = null;
const listeners = new Set<() => void>();
let syncStarted = false;

function ensure(): Db {
  if (!state) state = repository.load();
  if (!syncStarted && typeof window !== "undefined") {
    syncStarted = true;
    startSync(state, (remote) => {
      state = remote;
      repository.save(remote);
      emit();
    });
  }
  return state;
}

function emit() {
  listeners.forEach((l) => l());
}

export const dbStore = {
  read(): Db {
    return ensure();
  },
  /** Apply a mutation to a cloned copy, persist, and notify subscribers. */
  update<T>(fn: (draft: Db) => T): T {
    const draft = structuredClone(ensure());
    const result = fn(draft);
    state = draft;
    repository.save(draft);
    pushDb(draft);
    emit();
    return result;
  },
  reset() {
    state = repository.reset();
    pushDb(state);
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith("roomies.")) {
        state = repository.load();
        l();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  },
};

/** Returns null during SSR/hydration, then the live database. */
export function useDb(): Db | null {
  return useSyncExternalStore(
    dbStore.subscribe,
    () => ensure(),
    () => null,
  );
}
