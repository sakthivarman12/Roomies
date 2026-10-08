import { canManageHousehold } from "@/lib/permissions";
import { assert } from "@/lib/permissions";
import { nowIso, uid } from "@/lib/utils";
import { mutate, notify, otherMemberIds, ServiceError } from "./context";
import type { EventService, GalleryService } from "./types";

export const localEventService: EventService = {
  create(input) {
    return mutate(({ db, user, household }) => {
      if (input.title.trim().length < 2) throw new ServiceError("Give the event a title.");
      if (!input.startsAt || Number.isNaN(Date.parse(input.startsAt))) throw new ServiceError("Pick a date and time.");
      const event = {
        id: uid(), householdId: household.id, title: input.title.trim(), description: input.description?.trim() || undefined,
        location: input.location?.trim() || undefined, startsAt: input.startsAt, createdBy: user.id,
        rsvps: { [user.id]: "going" as const }, createdAt: nowIso(),
      };
      db.events.unshift(event);
      notify(db, household.id, otherMemberIds(db, household.id, user.id), "announcement", "New event", `${user.name} planned ${event.title}`);
      return event;
    });
  },

  remove(id) {
    mutate(({ db, user, household }) => {
      const e = db.events.find((x) => x.id === id && x.householdId === household.id);
      if (!e) throw new ServiceError("Event not found.");
      assert(e.createdBy === user.id || canManageHousehold(db, user, household.id), "Only the organiser or an admin can delete this event.");
      db.events = db.events.filter((x) => x.id !== id);
    });
  },

  rsvp(id, status) {
    mutate(({ db, user, household }) => {
      const e = db.events.find((x) => x.id === id && x.householdId === household.id);
      if (!e) throw new ServiceError("Event not found.");
      if (e.rsvps[user.id] === status) delete e.rsvps[user.id];
      else e.rsvps[user.id] = status;
    });
  },
};

export const localGalleryService: GalleryService = {
  add(photos, hidden) {
    return mutate(({ db, user, household }) => {
      if (!photos.length) throw new ServiceError("Choose at least one photo.");
      const created = photos.map((p) => ({
        id: uid(), householdId: household.id, src: p.src, caption: p.caption?.trim() || undefined, addedBy: user.id,
        hidden, useAsBackground: !hidden, createdAt: nowIso(),
      }));
      db.galleryPhotos.unshift(...created);
      return created;
    });
  },

  setBackground(id, on) {
    mutate(({ db, user, household }) => {
      const p = db.galleryPhotos.find((x) => x.id === id && x.householdId === household.id);
      if (!p) throw new ServiceError("Photo not found.");
      if (p.hidden) throw new ServiceError("Move this photo out of the hidden folder first.");
      assert(p.addedBy === user.id || canManageHousehold(db, user, household.id), "Only the uploader or an admin can change this.");
      p.useAsBackground = on;
    });
  },

  setHidden(id, hidden) {
    mutate(({ db, user, household }) => {
      const p = db.galleryPhotos.find((x) => x.id === id && x.householdId === household.id);
      if (!p) throw new ServiceError("Photo not found.");
      assert(p.addedBy === user.id, "Only the person who added a photo can hide or unhide it.");
      p.hidden = hidden;
      if (hidden) p.useAsBackground = false;
    });
  },

  setCaption(id, caption) {
    mutate(({ db, user, household }) => {
      const p = db.galleryPhotos.find((x) => x.id === id && x.householdId === household.id);
      if (!p) throw new ServiceError("Photo not found.");
      assert(p.addedBy === user.id, "Only the uploader can edit the caption.");
      p.caption = caption.trim() || undefined;
    });
  },

  remove(id) {
    mutate(({ db, user, household }) => {
      const p = db.galleryPhotos.find((x) => x.id === id && x.householdId === household.id);
      if (!p) throw new ServiceError("Photo not found.");
      assert(p.addedBy === user.id || (!p.hidden && canManageHousehold(db, user, household.id)), "You can't delete this photo.");
      db.galleryPhotos = db.galleryPhotos.filter((x) => x.id !== id);
    });
  },
};
