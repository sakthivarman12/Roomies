import { money } from "@/lib/format";
import { assert, canManageHousehold, isMember } from "@/lib/permissions";
import { membersOf, pairBalance } from "@/lib/selectors";
import { equalSplit } from "@/lib/split";
import { nowIso, uid } from "@/lib/utils";
import type { Expense, Payment, Receipt } from "@/types";
import { mutate, notify, receiptNumber, saveReceipt, ServiceError } from "./context";
import type { BillInput, BillService, PaymentService } from "./types";

export const localPaymentService: PaymentService = {
  settle({ toUserId, amount, method, note }) {
    return mutate(({ db, user, household }) => {
      if (!(amount > 0)) throw new ServiceError("Enter an amount greater than zero.");
      if (toUserId === user.id) throw new ServiceError("You can't pay yourself.");
      if (!membersOf(db, household.id).some((m) => m.user.id === toUserId)) throw new ServiceError("Recipient isn't in this household.");
      const owed = -pairBalance(db, household.id, user.id, toUserId);
      if (amount > owed + 0.001) throw new ServiceError(`You only owe ${money(Math.max(owed, 0))} to this roommate.`);
      const payment: Payment = {
        id: uid(), householdId: household.id, fromUserId: user.id, toUserId, amount, method, note: note?.trim() || undefined, createdAt: nowIso(),
      };
      db.payments.push(payment);
      const to = db.users.find((u) => u.id === toUserId)!;
      const receipt: Receipt = {
        receiptNumber: receiptNumber(), date: payment.createdAt, household: household.name.toUpperCase(),
        description: `Settlement to ${to.name} (${method})`, amount, paidBy: user.name,
        splitDetails: [{ name: to.name, amount }], status: "SETTLED",
      };
      saveReceipt(db, payment.id, receipt);
      notify(db, household.id, [toUserId], "payment_received", "Payment received", `${user.name} paid you ${money(amount)} via ${method}`);
      return { receipt };
    });
  },

  request(fromUserId, amount) {
    mutate(({ db, user, household }) => {
      assert(isMember(db, user, household.id));
      if (!(amount > 0)) throw new ServiceError("Nothing to request.");
      notify(db, household.id, [fromUserId], "payment_requested", "Payment requested", `${user.name} requested ${money(amount)}`);
    });
  },

  payBill(billId, method) {
    return mutate(({ db, user, household }) => {
      const bill = db.bills.find((b) => b.id === billId && b.householdId === household.id);
      if (!bill) throw new ServiceError("Bill not found.");
      if (bill.paid) throw new ServiceError("This bill is already paid.");
      const participants = bill.assignedTo.length ? bill.assignedTo : membersOf(db, household.id).map((m) => m.user.id);
      const expense: Expense = {
        id: uid(), householdId: household.id, title: `${bill.title} bill`, amount: bill.amount, category: bill.category,
        date: nowIso(), paidBy: user.id, splits: equalSplit(bill.amount, participants), splitMode: "equal",
        notes: `Paid via ${method}`, createdBy: user.id, createdAt: nowIso(),
      };
      db.expenses.unshift(expense);
      bill.paid = true;
      bill.paidBy = user.id;
      if (bill.recurring) {
        const next = new Date(bill.dueDate);
        next.setMonth(next.getMonth() + 1);
        db.bills.push({ ...bill, id: uid(), dueDate: next.toISOString(), paid: false, paidBy: undefined, createdAt: nowIso() });
      }
      const receipt = saveReceipt(db, expense.id, {
        receiptNumber: receiptNumber(), date: expense.date, household: household.name.toUpperCase(),
        description: `${bill.title} Bill`, amount: bill.amount, paidBy: user.name, status: "PAID", expenseId: expense.id,
        splitDetails: expense.splits.map((s) => ({ name: db.users.find((u) => u.id === s.userId)?.name ?? "", amount: s.amount })),
      });
      notify(
        db, household.id, participants.filter((id) => id !== user.id), "expense_split", "Bill paid",
        `${user.name} paid ${bill.title} — your share is ${money(expense.splits.find((s) => s.userId === participants[0])?.amount ?? 0)}`,
      );
      return { receipt };
    });
  },
};

export const localBillService: BillService = {
  create(input: BillInput) {
    return mutate(({ db, user, household }) => {
      assert(canManageHousehold(db, user, household.id), "Only owners and admins can create bills.");
      if (input.title.trim().length < 2) throw new ServiceError("Give the bill a name.");
      if (!(input.amount > 0)) throw new ServiceError("Enter an amount greater than zero.");
      if (!input.assignedTo.length) throw new ServiceError("Assign the bill to at least one roommate.");
      const bill = {
        id: uid(), householdId: household.id, title: input.title.trim(), category: input.category, amount: input.amount,
        dueDate: input.dueDate, recurring: input.recurring, paid: false, assignedTo: input.assignedTo, createdAt: nowIso(),
      };
      db.bills.push(bill);
      notify(db, household.id, input.assignedTo.filter((id) => id !== user.id), "bill_reminder", "New bill", `${bill.title} — ${money(bill.amount)}`);
      return bill;
    });
  },

  remove(id) {
    mutate(({ db, user, household }) => {
      assert(canManageHousehold(db, user, household.id), "Only owners and admins can delete bills.");
      db.bills = db.bills.filter((b) => !(b.id === id && b.householdId === household.id));
    });
  },
};
