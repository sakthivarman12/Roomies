import { DB_VERSION, STORAGE_KEY } from "@/lib/constants";
import { buildSeed } from "@/lib/mock/seed";
import type { Db } from "@/types";

/**
 * Persistence boundary. UI -> hooks -> services -> Repository -> (localStorage | Supabase).
 * A SupabaseRepository can implement this same contract later (see lib/supabase/).
 */
export interface Repository {
  load(): Db;
  save(db: Db): void;
  reset(): Db;
}

export class LocalRepository implements Repository {
  load(): Db {
    if (typeof window === "undefined") return buildSeed();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Db;
        if (parsed.version === DB_VERSION) {
          // Additive defaults for data saved before these collections existed.
          parsed.events ??= [];
          parsed.galleryPhotos ??= [];
          parsed.locations ??= [];
          parsed.stories ??= [];
          parsed.joinRequests ??= [];
          parsed.fund ??= [];
          parsed.galleryFolders ??= [];
          return parsed;
        }
      }
    } catch {
      /* corrupted storage falls through to a fresh seed */
    }
    const seed = buildSeed();
    this.save(seed);
    return seed;
  }

  save(db: Db): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      /* quota exceeded — keep in-memory state */
    }
  }

  reset(): Db {
    const seed = buildSeed();
    this.save(seed);
    return seed;
  }
}

export const repository: Repository = new LocalRepository();
