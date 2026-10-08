import { AVATAR_COLORS, DEMO_PASSWORD } from "@/lib/constants";
import { assert, canChangeRoles, canManageHousehold, canManageMembers, roleOf } from "@/lib/permissions";
import { myHouseholds } from "@/lib/selectors";
import { inviteCode, mockHash, nowIso, uid } from "@/lib/utils";
import { dbStore } from "@/store/db";
import type { Household, HouseholdMember } from "@/types";
import { mutate, mutateUser, notify, ServiceError } from "./context";
import type { HouseholdInput, RoomService } from "./types";

function validate(input: Partial<HouseholdInput>) {
  if (input.name !== undefined && input.name.trim().length < 2) throw new ServiceError("Give your household a name.");
  if (input.monthlyRent !== undefined && (Number.isNaN(input.monthlyRent) || input.monthlyRent < 0)) {
    throw new ServiceError("Enter a valid monthly rent.");
  }
  if (input.rentDueDay !== undefined && (input.rentDueDay < 1 || input.rentDueDay > 28)) {
    throw new ServiceError("Rent due day must be between 1 and 28.");
  }
}

export const localRoomService: RoomService = {
  createHousehold(input) {
    validate(input);
    return mutateUser((db, user) => {
      const household: Household = {
        id: uid(), name: input.name.trim(), address: input.address.trim(), monthlyRent: input.monthlyRent,
        rentDueDay: input.rentDueDay, rooms: input.rooms, rules: input.rules, inviteCode: inviteCode(), createdAt: nowIso(),
      };
      db.households.push(household);
      db.members.push({ id: uid(), householdId: household.id, userId: user.id, role: "OWNER", joinedAt: nowIso() });
      db.invites.push({ id: uid(), householdId: household.id, code: household.inviteCode, createdBy: user.id, createdAt: nowIso() });
      db.session.householdId = household.id;
      return household;
    });
  },

  joinByCode(code) {
    return mutateUser((db, user) => {
      const invite = db.invites.find((i) => i.code.toUpperCase() === code.trim().toUpperCase());
      if (!invite) throw new ServiceError("That invite code doesn't match any household.");
      const household = db.households.find((h) => h.id === invite.householdId)!;
      if (db.members.some((m) => m.householdId === household.id && m.userId === user.id)) {
        db.session.householdId = household.id;
        return household;
      }
      db.members.push({ id: uid(), householdId: household.id, userId: user.id, role: "MEMBER", joinedAt: nowIso() });
      db.session.householdId = household.id;
      notify(
        db, household.id,
        db.members.filter((m) => m.householdId === household.id && m.userId !== user.id).map((m) => m.userId),
        "announcement", "New roommate", `${user.name} joined ${household.name}`,
      );
      return household;
    });
  },

  switchHousehold(id) {
    mutateUser((db, user) => {
      assert(myHouseholds(db, user.id).some((h) => h.id === id), "You're not a member of that household.");
      db.session.householdId = id;
    });
  },

  updateHousehold(id, patch) {
    validate(patch);
    return mutateUser((db, user) => {
      assert(canManageHousehold(db, user, id), "Only owners and admins can edit the household.");
      const h = db.households.find((x) => x.id === id)!;
      Object.assign(h, patch);
      return h;
    });
  },

  addMember(householdId, { name, email }) {
    return mutateUser((db, user) => {
      assert(canManageMembers(db, user, householdId), "Only owners and admins can add members.");
      const mail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) throw new ServiceError("Enter a valid email address.");
      let target = db.users.find((u) => u.email === mail);
      if (!target) {
        if (name.trim().length < 2) throw new ServiceError("Enter the roommate's name.");
        // Prototype only: invited users get the demo password until real invites exist.
        target = {
          id: uid(), name: name.trim(), email: mail, phone: "", passwordHash: mockHash(DEMO_PASSWORD),
          avatarColor: AVATAR_COLORS[db.users.length % AVATAR_COLORS.length], createdAt: nowIso(),
        };
        db.users.push(target);
      }
      if (db.members.some((m) => m.householdId === householdId && m.userId === target!.id)) {
        throw new ServiceError(`${target.name} is already in this household.`);
      }
      const member: HouseholdMember = { id: uid(), householdId, userId: target.id, role: "MEMBER", joinedAt: nowIso() };
      db.members.push(member);
      notify(db, householdId, [target.id], "announcement", "Welcome to the household", `${user.name} added you`);
      return member;
    });
  },

  removeMember(householdId, userId) {
    mutateUser((db, user) => {
      assert(canManageMembers(db, user, householdId), "Only owners and admins can remove members.");
      const role = roleOf(db, userId, householdId);
      if (role === "OWNER") throw new ServiceError("The owner can't be removed.");
      if (role === "ADMIN" && roleOf(db, user.id, householdId) !== "OWNER") {
        throw new ServiceError("Only the owner can remove an admin.");
      }
      db.members = db.members.filter((m) => !(m.householdId === householdId && m.userId === userId));
      db.chores.forEach((c) => {
        if (c.householdId === householdId) c.rotation = c.rotation.filter((id) => id !== userId);
      });
    });
  },

  changeRole(householdId, userId, role) {
    mutateUser((db, user) => {
      assert(canChangeRoles(db, user, householdId), "Only the owner can change roles.");
      const m = db.members.find((x) => x.householdId === householdId && x.userId === userId);
      if (!m) throw new ServiceError("Member not found.");
      if (m.role === "OWNER") throw new ServiceError("The owner's role can't be changed.");
      if (role === "OWNER") throw new ServiceError("There can only be one owner.");
      m.role = role;
    });
  },

  leaveHousehold(householdId) {
    mutateUser((db, user) => {
      const role = roleOf(db, user.id, householdId);
      if (!role) throw new ServiceError("You're not in that household.");
      const others = db.members.filter((m) => m.householdId === householdId && m.userId !== user.id);
      if (role === "OWNER" && others.length > 0) {
        throw new ServiceError("Transfer ownership by promoting another member before leaving.");
      }
      db.members = db.members.filter((m) => !(m.householdId === householdId && m.userId === user.id));
      const next = myHouseholds(db, user.id)[0];
      db.session.householdId = next?.id ?? null;
    });
  },

  regenerateInvite(householdId) {
    return mutate(({ db, user }) => {
      assert(canManageHousehold(db, user, householdId), "Only owners and admins can generate invite codes.");
      const code = inviteCode();
      db.households.find((h) => h.id === householdId)!.inviteCode = code;
      db.invites.push({ id: uid(), householdId, code, createdBy: user.id, createdAt: nowIso() });
      return code;
    });
  },
};

export function transferOwnership(householdId: string, userId: string): void {
  dbStore.update((db) => {
    const me = db.session.userId;
    assert(roleOf(db, me, householdId) === "OWNER", "Only the owner can transfer ownership.");
    const target = db.members.find((m) => m.householdId === householdId && m.userId === userId);
    const mine = db.members.find((m) => m.householdId === householdId && m.userId === me);
    if (!target || !mine) throw new ServiceError("Member not found.");
    target.role = "OWNER";
    mine.role = "ADMIN";
  });
}
