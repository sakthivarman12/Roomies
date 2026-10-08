import { DB_VERSION, STORAGE_KEY } from "@/lib/constants";
import { buildSeed, buildSeedGeo, buildSeedMedia } from "@/lib/mock/seed";
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
          // Additive migration for data saved before events/gallery existed.
          if (!parsed.events || !parsed.galleryPhotos) {
            const media = buildSeedMedia();
            parsed.events ??= parsed.households.some((h) => h.id === media.events[0].householdId) ? media.events : [];
            parsed.galleryPhotos ??= parsed.households.some((h) => h.id === media.galleryPhotos[0].householdId) ? media.galleryPhotos : [];
          }
          if (!parsed.locations || !parsed.stories) {
            const geo = buildSeedGeo();
            const seeded = parsed.households.some((h) => h.id === geo.locations[0].householdId);
            parsed.locations ??= seeded ? geo.locations : [];
            parsed.stories ??= [];
            parsed.households.forEach((h) => { if (h.lat === undefined && seeded && h.id === geo.locations[0].householdId) { h.lat = 12.9352; h.lng = 77.6245; } });
          }
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
