import { assert, canManageHousehold } from "@/lib/permissions";
import { membersOf, nextInRotation } from "@/lib/selectors";
import { nowIso, uid } from "@/lib/utils";
import type { Chore, Frequency } from "@/types";
import { mutate, notify, ServiceError } from "./context";
import type { ChoreInput, ChoreService } from "./types";

function advance(date: string, frequency: Frequency): string {
  const d = new Date(date);
  if (frequency === "daily") d.setDate(d.getDate() + 1);
  else if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  while (d.getTime() < Date.now() - 86400000) {
    if (frequency === "daily") d.setDate(d.getDate() + 1);
    else if (frequency === "weekly") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString();
}

function findChore(chores: Chore[], id: string, householdId: string): Chore {
  const chore = chores.find((c) => c.id === id && c.householdId === householdId);
  if (!chore) throw new ServiceError("Chore not found.");
  return chore;
}

export const localChoreService: ChoreService = {
  create(input: ChoreInput) {
    return mutate(({ db, user, household }) => {
      if (input.title.trim().length < 2) throw new ServiceError("Give the chore a title.");
      const ids = membersOf(db, household.id).map((m) => m.user.id);
      if (!ids.includes(input.assignedTo)) throw new ServiceError("Assign the chore to a household member.");
      const chore: Chore = {
        id: uid(), householdId: household.id, title: input.title.trim(), description: input.description?.trim() || undefined,
        assignedTo: input.assignedTo, dueDate: input.dueDate, frequency: input.frequency, priority: input.priority,
        completed: false, inProgress: false, rotation: input.frequency === "once" ? [] : input.rotation.filter((id) => ids.includes(id)),
        createdAt: nowIso(),
      };
      db.chores.push(chore);
      if (chore.assignedTo !== user.id) notify(db, household.id, [chore.assignedTo], "chore_assigned", "Chore assigned", `${user.name} assigned you: ${chore.title}`);
      return chore;
    });
  },

  update(id, patch) {
    return mutate(({ db, user, household }) => {
      const chore = findChore(db.chores, id, household.id);
      assert(chore.assignedTo === user.id || canManageHousehold(db, user, household.id), "Only the assignee or an admin can edit this chore.");
      Object.assign(chore, patch);
      if (patch.assignedTo && patch.assignedTo !== user.id) {
        notify(db, household.id, [patch.assignedTo], "chore_assigned", "Chore assigned", `${user.name} assigned you: ${chore.title}`);
      }
      return chore;
    });
  },

  setInProgress(id) {
    mutate(({ db, household }) => {
      const chore = findChore(db.chores, id, household.id);
      chore.inProgress = !chore.inProgress;
    });
  },

  complete(id) {
    mutate(({ db, user, household }) => {
      const chore = findChore(db.chores, id, household.id);
      chore.completed = true;
      chore.inProgress = false;
      if (chore.frequency !== "once") {
        const next = nextInRotation(chore.rotation, chore.assignedTo);
        db.chores.push({
          ...chore, id: uid(), assignedTo: next, dueDate: advance(chore.dueDate, chore.frequency),
          completed: false, inProgress: false, createdAt: nowIso(),
        });
        notify(db, household.id, [next], "chore_assigned", "Your turn", `${chore.title} is yours next`);
      }
      void user;
    });
  },

  reopen(id) {
    mutate(({ db, household }) => {
      findChore(db.chores, id, household.id).completed = false;
    });
  },

  remove(id) {
    mutate(({ db, user, household }) => {
      const chore = findChore(db.chores, id, household.id);
      assert(chore.assignedTo === user.id || canManageHousehold(db, user, household.id), "Only the assignee or an admin can delete this chore.");
      db.chores = db.chores.filter((c) => c.id !== id);
    });
  },
};
