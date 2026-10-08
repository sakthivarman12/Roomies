"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
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
}

type SheetState =
  | { kind: "none" }
  | { kind: "expense"; expense: Expense | null }
  | { kind: "settle"; toUserId?: string }
  | { kind: "chore"; chore: Chore | null }
  | { kind: "bill" }
  | { kind: "payBill"; bill: Bill }
  | { kind: "announcement" | "member" | "profile" | "password" | "household" | "switch" };

const noop = () => undefined;
const ActionsContext = createContext<Actions>({
  addExpense: noop, settle: noop, addChore: noop, addBill: noop, payBill: noop, addAnnouncement: noop, addMember: noop,
  editProfile: noop, changePassword: noop, editHousehold: noop, switchHousehold: noop,
});

export const useActions = () => useContext(ActionsContext);

/** Hosts every bottom sheet in one place so any screen can open them. */
export function AppActionsProvider({ children }: { children: React.ReactNode }) {
  const [sheet, setSheet] = useState<SheetState>({ kind: "none" });
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
      <SwitchHouseholdSheet open={sheet.kind === "switch"} onClose={close} />
    </ActionsContext.Provider>
  );
}
