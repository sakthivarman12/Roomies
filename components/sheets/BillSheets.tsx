"use client";

import { useState } from "react";
import { useOnOpen } from "@/hooks/useOnOpen";
import { useReceiptOverlay } from "@/components/expenses/ReceiptOverlay";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { PersonChips } from "@/components/ui/Chips";
import { AmountInput, DatePicker, Input, Select } from "@/components/ui/Fields";
import { PiggyBank } from "lucide-react";
import { SegmentedControl } from "@/components/ui/Tabs";
import { Toggle } from "@/components/ui/Toggle";
import { fundBalance, restrictionsOf } from "@/lib/access";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/hooks/useApp";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { dueLabel, fromInputDate, money, toInputDate } from "@/lib/format";
import { billService, paymentService } from "@/lib/services";
import type { Bill, ExpenseCategory, PaymentMethod } from "@/types";

export function BillSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const app = useApp();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Electricity");
  const [due, setDue] = useState(toInputDate(new Date()));
  const [recurring, setRecurring] = useState<"yes" | "no">("yes");
  const [assigned, setAssigned] = useState<string[]>([]);
  const [error, setError] = useState("");

  useOnOpen(open, () => {
    if (!app) return;
    const d = new Date(); d.setDate(d.getDate() + 7);
    setTitle(""); setAmount(""); setCategory("Electricity"); setDue(toInputDate(d)); setRecurring("yes");
    setAssigned(app.members.map((m) => m.user.id)); setError("");
  });

  if (!app) return null;
  const submit = () => {
    try {
      billService.create({ title, category, amount: Number(amount), dueDate: fromInputDate(due), recurring: recurring === "yes", assignedTo: assigned });
      toast.show("Bill created");
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't create bill."); }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Add bill" description="Track a recurring or one-time household bill"
      footer={<Button size="lg" block onClick={submit}>Create bill</Button>}>
      <div className="space-y-4 pb-2 pt-2">
        <AmountInput value={amount} onChange={setAmount} />
        <Input label="Bill name" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Electricity" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <DatePicker label="Due date" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <div><p className="mb-2 px-1 text-[13px] font-semibold text-muted">Repeats monthly?</p>
          <SegmentedControl<"yes" | "no"> label="Recurring" value={recurring} onChange={setRecurring} options={[{ value: "yes", label: "Every month" }, { value: "no", label: "One-time" }]} /></div>
        <div><p className="mb-2 px-1 text-[13px] font-semibold text-muted">Split between</p>
          <PersonChips label="Assigned roommates" people={app.members.map((m) => m.user)} selected={assigned} meId={app.user.id}
            onToggle={(id) => setAssigned((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))} /></div>
        {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
      </div>
    </BottomSheet>
  );
}

export function PayBillSheet({ open, onClose, bill }: { open: boolean; onClose: () => void; bill: Bill | null }) {
  const receipts = useReceiptOverlay();
  const app = useApp();
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [fromFund, setFromFund] = useState(false);
  const [error, setError] = useState("");
  useOnOpen(open, () => { setMethod("UPI"); setFromFund(false); setError(""); });
  if (!bill) return null;

  const pay = () => {
    try {
      const { receipt } = paymentService.payBill(bill.id, method, fromFund);
      onClose();
      receipts.show({ receipt, heading: "PAYMENT SUCCESSFUL" });
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't pay bill."); }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={`Pay ${bill.title}`} description={dueLabel(bill.dueDate)}
      footer={<Button size="lg" variant="success" block onClick={pay}>Pay {money(bill.amount)}</Button>}>
      <div className="space-y-4 pb-2 pt-2">
        <div className="rounded-3xl bg-surface2 p-5 text-center">
          <p className="text-sm text-muted">You&apos;ll pay the full bill and roommates owe you their share.</p>
          <p className="tnum mt-2 text-4xl font-black">{money(bill.amount)}</p>
        </div>
        {app && restrictionsOf(app.db, app.user.id, app.household.id).seeFund && (
          <div className="flex items-center gap-3 rounded-2xl bg-surface2 p-3.5">
            <PiggyBank className="h-5 w-5 text-success" /><div className="flex-1"><p className="text-sm font-bold">Pay from room fund</p><p className="text-xs text-muted">{money(fundBalance(app.db, app.household.id))} available</p></div>
            <Toggle label="Pay from room fund" checked={fromFund} onChange={setFromFund} />
          </div>
        )}
        {!fromFund && <Select label="Paid with" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))} />}
        {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
      </div>
    </BottomSheet>
  );
}
