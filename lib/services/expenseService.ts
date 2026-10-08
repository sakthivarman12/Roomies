import { canEditExpense, assert } from "@/lib/permissions";
import { membersOf } from "@/lib/selectors";
import { validateSplitTotal } from "@/lib/split";
import { nowIso, uid } from "@/lib/utils";
import { money } from "@/lib/format";
import type { Db, Expense, Receipt } from "@/types";
import { mutate, notify, otherMemberIds, receiptNumber, saveReceipt, ServiceError } from "./context";
import type { ExpenseInput, ExpenseService } from "./types";

function validate(db: Db, householdId: string, input: ExpenseInput) {
  if (input.title.trim().length < 2) throw new ServiceError("Give the expense a title.");
  if (!(input.amount > 0)) throw new ServiceError("Enter an amount greater than zero.");
  if (!input.splits.length) throw new ServiceError("Choose who to split this with.");
  const memberIds = membersOf(db, householdId).map((m) => m.user.id);
  if (!memberIds.includes(input.paidBy)) throw new ServiceError("The payer must be a household member.");
  if (input.splits.some((s) => !memberIds.includes(s.userId))) throw new ServiceError("Everyone in a split must belong to this household.");
  if (!validateSplitTotal(input.amount, input.splits)) throw new ServiceError("Split amounts must add up to the total.");
}

function buildReceipt(db: Db, expense: Expense, householdName: string): Receipt {
  const nameOf = (id: string) => db.users.find((u) => u.id === id)?.name ?? "Unknown";
  return {
    receiptNumber: receiptNumber(), date: nowIso(), household: householdName.toUpperCase(), description: expense.title,
    amount: expense.amount, paidBy: nameOf(expense.paidBy), status: "ADDED", expenseId: expense.id,
    splitDetails: expense.splits.map((s) => ({ name: nameOf(s.userId), amount: s.amount })),
  };
}

export const localExpenseService: ExpenseService = {
  create(input) {
    return mutate(({ db, user, household }) => {
      validate(db, household.id, input);
      const expense: Expense = {
        id: uid(), householdId: household.id, title: input.title.trim(), amount: input.amount, category: input.category,
        date: input.date, paidBy: input.paidBy, splits: input.splits, splitMode: input.splitMode, notes: input.notes?.trim() || undefined,
        receiptImage: input.receiptImage, createdBy: user.id, createdAt: nowIso(),
      };
      db.expenses.unshift(expense);
      const receipt = saveReceipt(db, expense.id, buildReceipt(db, expense, household.name));
      const involved = expense.splits.map((s) => s.userId).filter((id) => id !== user.id);
      notify(db, household.id, involved, "expense_split", "New split expense", `${user.name} added ${expense.title} — ${money(expense.amount)}`);
      notify(db, household.id, otherMemberIds(db, household.id, user.id).filter((id) => !involved.includes(id)), "expense_added", "Expense added", `${expense.title} — ${money(expense.amount)}`);
      return { expense, receipt };
    });
  },

  update(id, input) {
    return mutate(({ db, user, household }) => {
      const expense = db.expenses.find((e) => e.id === id && e.householdId === household.id);
      if (!expense) throw new ServiceError("Expense not found.");
      assert(canEditExpense(db, user, expense), "You can only edit expenses you created or paid for.");
      validate(db, household.id, input);
      Object.assign(expense, {
        title: input.title.trim(), amount: input.amount, category: input.category, date: input.date, paidBy: input.paidBy,
        splits: input.splits, splitMode: input.splitMode, notes: input.notes?.trim() || undefined, receiptImage: input.receiptImage,
      });
      saveReceipt(db, expense.id, { ...buildReceipt(db, expense, household.name), receiptNumber: db.receipts[expense.id]?.receiptNumber ?? receiptNumber() });
      return expense;
    });
  },

  remove(id) {
    mutate(({ db, user, household }) => {
      const expense = db.expenses.find((e) => e.id === id && e.householdId === household.id);
      if (!expense) throw new ServiceError("Expense not found.");
      assert(canEditExpense(db, user, expense), "You can only delete expenses you created or paid for.");
      db.expenses = db.expenses.filter((e) => e.id !== id);
      delete db.receipts[id];
    });
  },
};
