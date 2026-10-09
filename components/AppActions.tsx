"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AccessSheet, type AccessTarget } from "@/components/sheets/AccessSheet";
import { StoryComposer } from "@/components/map/StoryComposer";
import { StoryViewer } from "@/components/map/StoryViewer";
import { EventSheet } from "@/components/profile/EventsPanel";
import { NotificationSheet, PermissionsSheet } from "@/components/profile/NotifySheets";
import { DocumentSheet, PhotosSheet, ShoppingSheet } from "@/components/sheets/QuickSheets";
import { ThemeSheet } from "@/components/profile/ThemeSheet";
import { ChoreSheet } from "@/components/chores/ChoreSheet";
import { ExpenseSheet } from "@/components/expenses/ExpenseSheet";
import { SettleSheet } from "@/components/expenses/SettleSheet";
import { BillSheet, PayBillSheet } from "@/components/sheets/BillSheets";
import {
  AnnouncementSheet, HouseholdSheet, MemberSheet, PasswordSheet, ProfileSheet, SwitchHouseholdSheet,
} from "@/components/sheets/MiscSheets";
import type { Bill, Chore, Expense } from "@/types";

interface Actions {
  addExpense: (expense?: Expense) => void;
  settle: (toUserId?: string) => void;
  addChore: (chore?: Chore) => void;
  addBill: () => void;
  payBill: (bill: Bill) => void;
  addAnnouncement: () => void;
  addMember: () => void;
  editProfile: () => void;
  changePassword: () => void;
  editHousehold: () => void;
  switchHousehold: () => void;
  editTheme: () => void;
  addShopping: () => void;
  addEvent: () => void;
  addPhotos: () => void;
  addDocument: () => void;
  addStory: () => void;
  viewStory: (userId: string) => void;
  editNotifications: () => void;
  editPermissions: () => void;
  reviewAccess: (target: AccessTarget) => void;
}

type SheetState =
  | { kind: "none" }
  | { kind: "expense"; expense: Expense | null }
  | { kind: "settle"; toUserId?: string }
  | { kind: "chore"; chore: Chore | null }
  | { kind: "bill" }
  | { kind: "payBill"; bill: Bill }
  | { kind: "announcement" | "member" | "profile" | "password" | "household" | "switch" | "theme" | "shopping" | "event" | "photos" | "document" | "story" | "notifications" | "permissions" | "access" };

const noop = () => undefined;
const ActionsContext = createContext<Actions>({
  addExpense: noop, settle: noop, addChore: noop, addBill: noop, payBill: noop, addAnnouncement: noop, addMember: noop,
  editProfile: noop, changePassword: noop, editHousehold: noop, switchHousehold: noop, editTheme: noop,
  addShopping: noop, addEvent: noop, addPhotos: noop, addDocument: noop, addStory: noop, viewStory: noop, editNotifications: noop, editPermissions: noop, reviewAccess: noop,
});

export const useActions = () => useContext(ActionsContext);

/** Hosts every bottom sheet in one place so any screen can open them. */
export function AppActionsProvider({ children }: { children: React.ReactNode }) {
  const [sheet, setSheet] = useState<SheetState>({ kind: "none" });
  const [accessTarget, setAccessTarget] = useState<AccessTarget | null>(null);
  const [storyUser, setStoryUser] = useState<string | null>(null);
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  const close = useCallback(() => setSheet({ kind: "none" }), []);

  const actions = useMemo<Actions>(() => ({
    addExpense: (expense) => setSheet({ kind: "expense", expense: expense ?? null }),
    settle: (toUserId) => setSheet({ kind: "settle", toUserId }),
    addChore: (chore) => setSheet({ kind: "chore", chore: chore ?? null }),
    addBill: () => setSheet({ kind: "bill" }),
    payBill: (bill) => { setLastBill(bill); setSheet({ kind: "payBill", bill }); },
    addAnnouncement: () => setSheet({ kind: "announcement" }),
    addMember: () => setSheet({ kind: "member" }),
    editProfile: () => setSheet({ kind: "profile" }),
    changePassword: () => setSheet({ kind: "password" }),
    editHousehold: () => setSheet({ kind: "household" }),
    switchHousehold: () => setSheet({ kind: "switch" }),
    editTheme: () => setSheet({ kind: "theme" }),
    addShopping: () => setSheet({ kind: "shopping" }),
    addEvent: () => setSheet({ kind: "event" }),
    addPhotos: () => setSheet({ kind: "photos" }),
    addDocument: () => setSheet({ kind: "document" }),
    addStory: () => setSheet({ kind: "story" }),
    viewStory: (userId) => setStoryUser(userId),
    editNotifications: () => setSheet({ kind: "notifications" }),
    editPermissions: () => setSheet({ kind: "permissions" }),
    reviewAccess: (target) => { setAccessTarget(target); setSheet({ kind: "access" }); },
  }), []);

  return (
    <ActionsContext.Provider value={actions}>
      {children}
      <ExpenseSheet open={sheet.kind === "expense"} onClose={close} expense={sheet.kind === "expense" ? sheet.expense : null} />
      <SettleSheet open={sheet.kind === "settle"} onClose={close} toUserId={sheet.kind === "settle" ? sheet.toUserId : undefined} />
      <ChoreSheet open={sheet.kind === "chore"} onClose={close} chore={sheet.kind === "chore" ? sheet.chore : null} />
      <BillSheet open={sheet.kind === "bill"} onClose={close} />
      <PayBillSheet open={sheet.kind === "payBill"} onClose={close} bill={sheet.kind === "payBill" ? sheet.bill : lastBill} />
      <AnnouncementSheet open={sheet.kind === "announcement"} onClose={close} />
      <MemberSheet open={sheet.kind === "member"} onClose={close} />
      <ProfileSheet open={sheet.kind === "profile"} onClose={close} />
      <PasswordSheet open={sheet.kind === "password"} onClose={close} />
      <HouseholdSheet open={sheet.kind === "household"} onClose={close} />
      <ThemeSheet open={sheet.kind === "theme"} onClose={close} />
      <ShoppingSheet open={sheet.kind === "shopping"} onClose={close} />
      <EventSheet open={sheet.kind === "event"} onClose={close} />
      <PhotosSheet open={sheet.kind === "photos"} onClose={close} />
      <DocumentSheet open={sheet.kind === "document"} onClose={close} />
      <StoryComposer open={sheet.kind === "story"} onClose={close} />
      <NotificationSheet open={sheet.kind === "notifications"} onClose={close} />
      <PermissionsSheet open={sheet.kind === "permissions"} onClose={close} />
      <AccessSheet open={sheet.kind === "access"} onClose={close} target={accessTarget} />
      <StoryViewer userId={storyUser} onClose={() => setStoryUser(null)} />
      <SwitchHouseholdSheet open={sheet.kind === "switch"} onClose={close} />
    </ActionsContext.Provider>
  );
}
