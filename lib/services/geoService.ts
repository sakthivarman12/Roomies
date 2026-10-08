import { mediaStore } from "@/lib/mediaStore";
import { nowIso, uid } from "@/lib/utils";
import { dbStore } from "@/store/db";
import { currentHousehold } from "@/lib/selectors";
import { mutate, ServiceError } from "./context";
import type { GeoService } from "./types";

const STORY_TTL_MS = 24 * 60 * 60 * 1000;

export const localGeoService: GeoService = {
  setSharing(on) {
    mutate(({ db, user, household }) => {
      const existing = db.locations.find((l) => l.userId === user.id && l.householdId === household.id);
      if (existing) { existing.sharing = on; existing.updatedAt = nowIso(); }
      else if (on) {
        db.locations.push({ userId: user.id, householdId: household.id, lat: household.lat ?? 12.9716, lng: household.lng ?? 77.5946, sharing: true, updatedAt: nowIso() });
      }
    });
  },

  updateLocation(lat, lng, accuracy) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new ServiceError("Invalid location.");
    mutate(({ db, user, household }) => {
      const existing = db.locations.find((l) => l.userId === user.id && l.householdId === household.id);
      if (existing) Object.assign(existing, { lat, lng, accuracy, updatedAt: nowIso() });
      else db.locations.push({ userId: user.id, householdId: household.id, lat, lng, accuracy, sharing: true, updatedAt: nowIso() });
    });
  },

  createStory(input) {
    return mutate(({ db, user, household }) => {
      if (input.kind === "image" && !input.src) throw new ServiceError("Add a photo first.");
      if (input.kind === "video" && !input.mediaId) throw new ServiceError("Add a video first.");
      const now = nowIso();
      const story = {
        id: uid(), householdId: household.id, userId: user.id, kind: input.kind, src: input.src, mediaId: input.mediaId,
        caption: input.caption?.trim() || undefined, lat: input.lat, lng: input.lng, viewedBy: [user.id], createdAt: now,
        expiresAt: new Date(Date.now() + STORY_TTL_MS).toISOString(),
      };
      db.stories.unshift(story);
      if (input.saveToGallery) {
        db.galleryPhotos.unshift({
          id: uid(), householdId: household.id, src: input.src ?? "", kind: input.kind, mediaId: input.mediaId,
          caption: story.caption, addedBy: user.id, hidden: false, useAsBackground: false, createdAt: now,
        });
      }
      return story;
    });
  },

  removeStory(id) {
    mutate(({ db, user, household }) => {
      const s = db.stories.find((x) => x.id === id && x.householdId === household.id);
      if (!s) throw new ServiceError("Story not found.");
      if (s.userId !== user.id) throw new ServiceError("You can only delete your own stories.");
      db.stories = db.stories.filter((x) => x.id !== id);
      if (s.mediaId && !db.galleryPhotos.some((g) => g.mediaId === s.mediaId) && !db.stories.some((x) => x.mediaId === s.mediaId)) {
        void mediaStore.remove(s.mediaId).catch(() => undefined);
      }
    });
  },

  markStoryViewed(id) {
    mutate(({ db, user, household }) => {
      const s = db.stories.find((x) => x.id === id && x.householdId === household.id);
      if (s && !s.viewedBy.includes(user.id)) s.viewedBy.push(user.id);
    });
  },

  getLocations() {
    const db = dbStore.read();
    const h = currentHousehold(db);
    return h ? db.locations.filter((l) => l.householdId === h.id && l.sharing) : [];
  },
};
