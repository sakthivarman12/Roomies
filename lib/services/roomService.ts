import { AVATAR_COLORS, DEMO_PASSWORD } from "@/lib/constants";
import { assert, canChangeRoles, canManageHousehold, canManageMembers, roleOf } from "@/lib/permissions";
import { currentHousehold, myHouseholds } from "@/lib/selectors";
import { dbStore } from "@/store/db";
import { inviteCode, mockHash, nowIso, uid } from "@/lib/utils";
import { FULL_ACCESS, type Household, type JoinRequest, type MemberKind } from "@/types";
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
      household.requireApproval = input.requireApproval ?? true;
      db.session.householdId = household.id;
      const everyone: string[] = []; // empty = every resident when it is paid
      (input.sharedCosts ?? []).filter((c) => c.amount > 0 && c.title.trim()).forEach((c) => {
        const due = new Date(); due.setDate(Math.min(Math.max(c.dueDay, 1), 28));
        if (due.getTime() < Date.now()) due.setMonth(due.getMonth() + 1);
        db.bills.push({
          id: uid(), householdId: household.id, title: c.title.trim(), category: c.category, amount: c.amount,
          dueDate: due.toISOString(), recurring: true, paid: false, assignedTo: everyone, createdAt: nowIso(),
        });
      });
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
        return { household, status: "joined" as const };
      }
      const approvers = db.members.filter((m) => m.householdId === household.id && (m.role === "OWNER" || m.role === "ADMIN")).map((m) => m.userId);
      if (household.requireApproval === false) {
        db.members.push({ id: uid(), householdId: household.id, userId: user.id, role: "MEMBER", kind: "resident", restrictions: FULL_ACCESS, joinedAt: nowIso() });
        db.session.householdId = household.id;
        notify(db, household.id, db.members.filter((m) => m.householdId === household.id && m.userId !== user.id).map((m) => m.userId), "announcement", "New roommate", `${user.name} joined ${household.name}`);
        return { household, status: "joined" as const };
      }
      if (!db.joinRequests.some((r) => r.userId === user.id && r.householdId === household.id && r.status === "pending")) {
        db.joinRequests.push({ id: uid(), householdId: household.id, userId: user.id, status: "pending", createdAt: nowIso() });
        notify(db, household.id, approvers, "join_request", "New roommate request", `${user.name} wants to join ${household.name}. Review it in Profile.`);
      }
      return { household, status: "pending" as const };
    });
  },

  approveRequest(requestId, input) {
    mutateUser((db, user) => {
      const req = db.joinRequests.find((r) => r.id === requestId);
      if (!req || req.status !== "pending") throw new ServiceError("That request was already handled.");
      assert(canManageMembers(db, user, req.householdId), "Only the owner or an admin can approve new roommates.");
      req.status = "approved";
      if (!db.members.some((m) => m.householdId === req.householdId && m.userId === req.userId)) {
        db.members.push({
          id: uid(), householdId: req.householdId, userId: req.userId, role: "MEMBER", kind: input.kind ?? req.kind ?? "resident",
          restrictions: input.restrictions, stayUntil: input.stayUntil, joinedAt: nowIso(),
        });
      }
      const h = db.households.find((x) => x.id === req.householdId)!;
      notify(db, req.householdId, [req.userId], "announcement", "You're in!", `${user.name} approved you for ${h.name}`);
    });
  },

  rejectRequest(requestId) {
    mutateUser((db, user) => {
      const req = db.joinRequests.find((r) => r.id === requestId);
      if (!req || req.status !== "pending") throw new ServiceError("That request was already handled.");
      assert(canManageMembers(db, user, req.householdId), "Only the owner or an admin can decline requests.");
      req.status = "rejected";
    });
  },

  updateMemberAccess(householdId, userId, input) {
    mutateUser((db, user) => {
      assert(canManageMembers(db, user, householdId), "Only the owner or an admin can change access.");
      const m = db.members.find((x) => x.householdId === householdId && x.userId === userId);
      if (!m) throw new ServiceError("Member not found.");
      if (m.role === "OWNER") throw new ServiceError("The owner always has full access.");
      m.kind = input.kind; m.restrictions = input.restrictions; m.stayUntil = input.stayUntil;
    });
  },

  getPendingRequests() {
    const db = dbStore.read();
    const h = currentHousehold(db);
    return h ? db.joinRequests.filter((r): r is JoinRequest => r.householdId === h.id && r.status === "pending") : [];
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

  addMember(householdId, { name, email, kind = "resident" }: { name: string; email: string; kind?: MemberKind }) {
    // Nobody joins directly: the person is queued as a pending request until the owner or an admin approves.
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
      if (db.joinRequests.some((r) => r.householdId === householdId && r.userId === target!.id && r.status === "pending")) {
        throw new ServiceError(`${target.name} is already waiting for approval.`);
      }
      const request: JoinRequest = { id: uid(), householdId, userId: target.id, kind, status: "pending", createdAt: nowIso() };
      db.joinRequests.push(request);
      const approvers = db.members.filter((m) => m.householdId === householdId && (m.role === "OWNER" || m.role === "ADMIN")).map((m) => m.userId);
      const label = kind === "guest" ? "friend" : "roommate";
      notify(db, householdId, approvers, "join_request", `New ${label} to approve`, `${user.name} added ${target.name} as a ${label}. Approve in Profile.`);
      return request;
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
