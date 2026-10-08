"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useActions } from "@/components/AppActions";
import { CategoryBubble } from "@/components/expenses/ExpenseCard";
import { useReceiptOverlay } from "@/components/expenses/ReceiptOverlay";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/BottomSheet";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { useAction } from "@/hooks/useAction";
import { useApp } from "@/hooks/useApp";
import { longDate, money } from "@/lib/format";
import { canEditExpense } from "@/lib/permissions";
import { expenseService } from "@/lib/services";
import { Receipt } from "lucide-react";

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const app = useApp();
  const actions = useActions();
  const receipts = useReceiptOverlay();
  const router = useRouter();
  const run = useAction();
  const [confirm, setConfirm] = useState(false);
  if (!app) return null;

  const expense = app.db.expenses.find((e) => e.id === id && e.householdId === app.household.id);
  if (!expense) {
    return (
      <div><PageHeader title="Expense" back="/expenses" />
        <div className="px-4 pt-4"><EmptyState icon={<Receipt className="h-7 w-7" />} title="Expense not found" description="It may have been deleted." actionLabel="Back to expenses" onAction={() => router.push("/expenses")} /></div></div>
    );
  }
  const editable = canEditExpense(app.db, app.user, expense);
  const receipt = app.db.receipts[expense.id];
  const payer = app.userById(expense.paidBy);

  return (
    <div>
      <PageHeader title="Expense" back="/expenses" />
      <div className="space-y-4 px-4 pt-2 pb-6">
        <Card className="text-center">
          <div className="mx-auto w-fit"><CategoryBubble category={expense.category} size={64} /></div>
          <h2 className="mt-3 text-lg font-extrabold">{expense.title}</h2>
          <p className="tnum mt-1 text-[40px] font-black leading-none">{money(expense.amount)}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2"><Badge tone="info">{expense.category}</Badge><Badge tone="neutral">{longDate(expense.date)}</Badge><Badge tone="violet">{expense.splitMode} split</Badge></div>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">{payer && <Avatar user={payer} size="xs" />}<span className="text-muted">Paid by</span><b>{app.nameOf(expense.paidBy)}</b></div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-extrabold">Split between {expense.splits.length}</h3>
          <ul className="space-y-3">
            {expense.splits.map((s) => {
              const u = app.userById(s.userId);
              return (
                <li key={s.userId} className="flex items-center gap-3">
                  {u && <Avatar user={u} size="sm" />}
                  <span className="flex-1 text-sm font-semibold">{app.nameOf(s.userId)}{s.userId === expense.paidBy && <span className="ml-2 text-xs text-muted">paid</span>}</span>
                  <span className="tnum text-sm font-extrabold">{money(s.amount)}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        {expense.notes && <Card><h3 className="mb-1 text-sm font-extrabold">Notes</h3><p className="text-sm text-muted">{expense.notes}</p></Card>}
        {expense.receiptImage && (
          <Card><h3 className="mb-2 text-sm font-extrabold">Receipt photo</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={expense.receiptImage} alt={`Receipt for ${expense.title}`} className="max-h-72 w-full rounded-2xl object-cover" /></Card>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          {receipt && <Button variant="soft" className="col-span-2" onClick={() => receipts.show({ receipt, heading: "RECEIPT" })}><Eye className="h-4 w-4" />View receipt</Button>}
          {editable && <Button variant="secondary" onClick={() => actions.addExpense(expense)}><Pencil className="h-4 w-4" />Edit</Button>}
          {editable && <Button variant="secondary" className="text-danger" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" />Delete</Button>}
        </div>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Delete expense?" description="Balances will be recalculated. This can't be undone."
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => {
          const ok = run(() => { expenseService.remove(expense.id); return true; }, "Expense deleted");
          setConfirm(false);
          if (ok) router.replace("/expenses");
        }}>Delete</Button></div>}>
        <p className="pb-2 text-sm text-muted">&ldquo;{expense.title}&rdquo; · {money(expense.amount)}</p>
      </Modal>
    </div>
  );
}
