"use client";

import { useState } from "react";
import { useOnOpen } from "@/hooks/useOnOpen";
import { useReceiptOverlay } from "@/components/expenses/ReceiptOverlay";
import { Avatar } from "@/components/ui/Avatar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { AmountInput, Input } from "@/components/ui/Fields";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useApp } from "@/hooks/useApp";
import { PAYMENT_METHODS } from "@/lib/constants";
import { money } from "@/lib/format";
import { pairBalance } from "@/lib/selectors";
import { paymentService } from "@/lib/services";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

export function SettleSheet({ open, onClose, toUserId }: { open: boolean; onClose: () => void; toUserId?: string }) {
  const app = useApp();
  const receipts = useReceiptOverlay();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const owedTo = (id: string) => (app ? Math.max(0, -pairBalance(app.db, app.household.id, app.user.id, id)) : 0);

  useOnOpen(open, () => {
    if (!app) return;
    const others = app.members.filter((m) => m.user.id !== app.user.id);
    const target = toUserId ?? others.sort((a, b) => owedTo(b.user.id) - owedTo(a.user.id))[0]?.user.id ?? "";
    setTo(target);
    setAmount(owedTo(target) ? String(owedTo(target)) : "");
    setMethod("UPI"); setNote(""); setError("");
  });

  if (!app) return null;
  const others = app.members.filter((m) => m.user.id !== app.user.id);
  const owed = owedTo(to);

  const submit = () => {
    setError("");
    try {
      const { receipt } = paymentService.settle({ toUserId: to, amount: Number(amount), method, note });
      onClose();
      receipts.show({ receipt, heading: "PAYMENT SUCCESSFUL" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Settle up" description="Record a payment to a roommate"
      footer={<Button size="lg" variant="success" block onClick={submit} disabled={!to}>{Number(amount) > 0 ? `Mark ${money(Number(amount))} as paid` : "Mark as paid"}</Button>}>
      <div className="space-y-4 pb-2 pt-2">
        <div>
          <p className="mb-2 px-1 text-[13px] font-semibold text-muted">Paying</p>
          <div className="grid grid-cols-2 gap-2">
            {others.map(({ user }) => {
              const o = owedTo(user.id);
              const on = to === user.id;
              return (
                <button key={user.id} type="button" aria-pressed={on} onClick={() => { setTo(user.id); setAmount(o ? String(o) : ""); }}
                  className={cn("flex min-h-[64px] items-center gap-3 rounded-2xl border p-3 text-left transition-all", on ? "border-primary bg-primary-soft" : "border-line bg-surface")}>
                  <Avatar user={user} size="sm" />
                  <span className="min-w-0"><span className="block truncate text-sm font-bold">{user.name}</span>
                    <span className={cn("block text-[11px] font-semibold", o ? "text-danger" : "text-success")}>{o ? `You owe ${money(o)}` : "Settled"}</span></span>
                </button>
              );
            })}
          </div>
        </div>
        <AmountInput value={amount} onChange={setAmount} error={Number(amount) > owed + 0.001 && owed >= 0 ? `You only owe ${money(owed)}` : undefined} />
        <div>
          <p className="mb-2 px-1 text-[13px] font-semibold text-muted">Payment method</p>
          <SegmentedControl<PaymentMethod> label="Payment method" value={method} onChange={setMethod} options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))} />
          <p className="mt-2 px-1 text-xs text-muted">Prototype: payments are recorded, not processed. Razorpay/UPI can plug in here later.</p>
        </div>
        <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. September rent share" />
        {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
      </div>
    </BottomSheet>
  );
}
