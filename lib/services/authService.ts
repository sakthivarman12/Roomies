import { AVATAR_COLORS } from "@/lib/constants";
import { currentUser } from "@/lib/selectors";
import { remoteSignOut } from "@/lib/supabase/auth";
import { mockHash, nowIso, uid } from "@/lib/utils";
import { dbStore } from "@/store/db";
import type { Preferences } from "@/types";
import { mutateUser, ServiceError } from "./context";
import type { AuthService } from "./types";

const DEFAULT_PREFS: Preferences = { hiddenUnlocked: false, currency: "INR", language: "English", notifications: true };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const localAuthService: AuthService = {
  login(email, password) {
    return dbStore.update((db) => {
      const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!user || user.passwordHash !== mockHash(password)) {
        throw new ServiceError("Incorrect email or password.");
      }
      const first = db.members.find((m) => m.userId === user.id);
      db.session = { userId: user.id, householdId: first?.householdId ?? null };
      return user;
    });
  },

  signup({ name, email, phone, password }) {
    return dbStore.update((db) => {
      if (name.trim().length < 2) throw new ServiceError("Please enter your name.");
      if (!EMAIL_RE.test(email.trim())) throw new ServiceError("Enter a valid email address.");
      if (password.length < 6) throw new ServiceError("Password must be at least 6 characters.");
      if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
        throw new ServiceError("An account with this email already exists.");
      }
      const user = {
        id: uid(), name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(),
        passwordHash: mockHash(password), avatarColor: AVATAR_COLORS[db.users.length % AVATAR_COLORS.length],
        createdAt: nowIso(),
      };
      db.users.push(user);
      db.session = { userId: user.id, householdId: null };
      return user;
    });
  },

  logout() {
    dbStore.update((db) => {
      db.session = { userId: null, householdId: null };
    });
    void remoteSignOut();
  },

  getCurrentUser() {
    return currentUser(dbStore.read());
  },

  requestPasswordReset(email) {
    const exists = dbStore.read().users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!exists) throw new ServiceError("We couldn't find an account with that email.");
  },

  resetPassword(email, newPassword) {
    dbStore.update((db) => {
      const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!user) throw new ServiceError("We couldn't find an account with that email.");
      if (newPassword.length < 6) throw new ServiceError("Password must be at least 6 characters.");
      user.passwordHash = mockHash(newPassword);
    });
  },

  updateProfile(patch) {
    return mutateUser((db, user) => {
      const target = db.users.find((u) => u.id === user.id)!;
      if (patch.email && patch.email !== target.email) {
        if (!EMAIL_RE.test(patch.email)) throw new ServiceError("Enter a valid email address.");
        if (db.users.some((u) => u.id !== user.id && u.email.toLowerCase() === patch.email!.toLowerCase())) {
          throw new ServiceError("That email is already in use.");
        }
      }
      if (patch.name !== undefined && patch.name.trim().length < 2) throw new ServiceError("Please enter your name.");
      Object.assign(target, patch);
      return target;
    });
  },

  changePassword(current, next) {
    mutateUser((db, user) => {
      const target = db.users.find((u) => u.id === user.id)!;
      if (target.passwordHash !== mockHash(current)) throw new ServiceError("Current password is incorrect.");
      if (next.length < 6) throw new ServiceError("New password must be at least 6 characters.");
      target.passwordHash = mockHash(next);
    });
  },

  updateTheme(patch) {
    mutateUser((db, user) => {
      const prev = db.prefs[user.id] ?? DEFAULT_PREFS;
      db.prefs[user.id] = { ...DEFAULT_PREFS, ...prev, theme: { ...prev.theme, ...patch } };
    });
  },

  updatePrefs(patch) {
    mutateUser((db, user) => {
      db.prefs[user.id] = { ...DEFAULT_PREFS, ...db.prefs[user.id], ...patch };
    });
  },
};

export { DEFAULT_PREFS };
