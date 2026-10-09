"use client";

import { useState } from "react";
import { useOnOpen } from "@/hooks/useOnOpen";
import { useReceiptOverlay } from "@/components/expenses/ReceiptOverlay";
import { Avatar } from "@/components/ui/Avatar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { AmountInput, Input } from "@/components/ui/Fields";
import { Copy, Smartphone } from "lucide-react";
import { isUpiApp, upiLink } from "@/lib/upi";
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
  const payee = app.members.find((m) => m.user.id === to)?.user;

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
          <p className="mb-2 px-1 text-[13px] font-semibold text-muted">Pay with</p>
          <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => setMethod(m)}
                className={cn("min-h-[48px] rounded-2xl border px-2 text-[13px] font-bold transition-colors", method === m ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface")}>{m}</button>
            ))}
          </div>
          {isUpiApp(method) && payee && (
            <div className="mt-3 space-y-2 rounded-2xl bg-surface2 p-3.5">
              {payee.upiId ? (
                <>
                  <p className="text-xs text-muted">Pay to <b className="text-ink">{payee.upiId}</b></p>
                  <div className="grid grid-cols-2 gap-2">
                    <a href={upiLink(method, { upiId: payee.upiId, name: payee.name, amount: Number(amount) || 0, note }) ?? undefined} onClick={(e) => { if (!(Number(amount) > 0)) e.preventDefault(); }}
                      className="inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-primary text-sm font-bold text-primary-ink"><Smartphone className="h-4 w-4" />Open {method === "UPI" ? "UPI app" : method}</a>
                    <Button type="button" variant="secondary" onClick={() => { void navigator.clipboard?.writeText(payee.upiId!); }}><Copy className="h-4 w-4" />Copy ID</Button>
                  </div>
                  <p className="text-[11px] text-muted">Complete the payment in the app, come back, then tap “Mark as paid”. Roomies can&apos;t confirm the payment itself.</p>
                </>
              ) : <p className="text-xs text-warning">{payee.name} hasn&apos;t added a UPI ID yet. Ask them to add it in Edit profile, or pay by cash.</p>}
            </div>
          )}
        </div>
        <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. September rent share" />
        {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
      </div>
    </BottomSheet>
  );
}
