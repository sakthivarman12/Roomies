import { assert, canManageHousehold } from "@/lib/permissions";
import { nowIso, uid } from "@/lib/utils";
import { dbStore } from "@/store/db";
import { mutate, mutateUser, notify, otherMemberIds, ServiceError } from "./context";
import type { DevService, HouseService, NotificationService } from "./types";

export const localHouseService: HouseService = {
  addShoppingItem(name, quantity) {
    return mutate(({ db, user, household }) => {
      if (!name.trim()) throw new ServiceError("What do you need to buy?");
      const item = { id: uid(), householdId: household.id, name: name.trim(), quantity: quantity.trim() || "1", addedBy: user.id, purchased: false, createdAt: nowIso() };
      db.shopping.unshift(item);
      return item;
    });
  },
  toggleShoppingItem(id) {
    mutate(({ db, household }) => {
      const item = db.shopping.find((s) => s.id === id && s.householdId === household.id);
      if (item) item.purchased = !item.purchased;
    });
  },
  removeShoppingItem(id) {
    mutate(({ db, household }) => {
      db.shopping = db.shopping.filter((s) => !(s.id === id && s.householdId === household.id));
    });
  },
  clearPurchased() {
    mutate(({ db, household }) => {
      db.shopping = db.shopping.filter((s) => !(s.householdId === household.id && s.purchased));
    });
  },

  createAnnouncement(title, body) {
    return mutate(({ db, user, household }) => {
      assert(canManageHousehold(db, user, household.id), "Only owners and admins can post announcements.");
      if (title.trim().length < 2 || body.trim().length < 2) throw new ServiceError("Add a title and a message.");
      const a = { id: uid(), householdId: household.id, title: title.trim(), body: body.trim(), authorId: user.id, reactions: {}, acknowledgedBy: [user.id], createdAt: nowIso() };
      db.announcements.unshift(a);
      notify(db, household.id, otherMemberIds(db, household.id, user.id), "announcement", "New announcement", a.title);
      return a;
    });
  },
  reactToAnnouncement(id, emoji) {
    mutate(({ db, user, household }) => {
      const a = db.announcements.find((x) => x.id === id && x.householdId === household.id);
      if (!a) return;
      if (a.reactions[user.id] === emoji) delete a.reactions[user.id];
      else a.reactions[user.id] = emoji;
    });
  },
  acknowledgeAnnouncement(id) {
    mutate(({ db, user, household }) => {
      const a = db.announcements.find((x) => x.id === id && x.householdId === household.id);
      if (a && !a.acknowledgedBy.includes(user.id)) a.acknowledgedBy.push(user.id);
    });
  },
  deleteAnnouncement(id) {
    mutate(({ db, user, household }) => {
      assert(canManageHousehold(db, user, household.id), "Only owners and admins can delete announcements.");
      db.announcements = db.announcements.filter((a) => a.id !== id);
    });
  },

  addDocument(name, note) {
    mutate(({ db, household }) => {
      if (!name.trim()) throw new ServiceError("Name the document.");
      db.documents.unshift({ id: uid(), householdId: household.id, name: name.trim(), note: note.trim(), createdAt: nowIso() });
    });
  },
  removeDocument(id) {
    mutate(({ db, user, household }) => {
      assert(canManageHousehold(db, user, household.id), "Only owners and admins can remove documents.");
      db.documents = db.documents.filter((d) => d.id !== id);
    });
  },

  addRule(rule) {
    mutate(({ db, user, household }) => {
      assert(canManageHousehold(db, user, household.id), "Only owners and admins can edit house rules.");
      if (!rule.trim()) throw new ServiceError("Write the rule first.");
      db.households.find((h) => h.id === household.id)!.rules.push(rule.trim());
    });
  },
  removeRule(index) {
    mutate(({ db, user, household }) => {
      assert(canManageHousehold(db, user, household.id), "Only owners and admins can edit house rules.");
      db.households.find((h) => h.id === household.id)!.rules.splice(index, 1);
    });
  },
};

export const localNotificationService: NotificationService = {
  markRead(id) {
    mutateUser((db, user) => {
      const n = db.notifications.find((x) => x.id === id && x.userId === user.id);
      if (n) n.read = true;
    });
  },
  markAllRead() {
    mutateUser((db, user) => {
      db.notifications.filter((n) => n.userId === user.id).forEach((n) => (n.read = true));
    });
  },
  sendTest() {
    mutate(({ db, user, household }) => {
      notify(db, household.id, [user.id], "announcement", "Test notification", `Hi ${user.name}, this is how Roomies alerts look and sound.`);
    });
  },
  clearAll() {
    mutateUser((db, user) => {
      db.notifications = db.notifications.filter((n) => n.userId !== user.id);
    });
  },
};

export const localDevService: DevService = {
  resetDemoData() {
    dbStore.reset();
  },
};
