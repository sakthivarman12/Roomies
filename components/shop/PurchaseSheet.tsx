"use client";

import { PiggyBank } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useReceiptOverlay } from "@/components/expenses/ReceiptOverlay";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { PersonChips } from "@/components/ui/Chips";
import { AmountInput, Select } from "@/components/ui/Fields";
import { Toggle } from "@/components/ui/Toggle";
import { useApp } from "@/hooks/useApp";
import { useOnOpen } from "@/hooks/useOnOpen";
import { fundBalance, restrictionsOf } from "@/lib/access";
import { fromInputDate, money, toInputDate } from "@/lib/format";
import { expenseService } from "@/lib/services";
import { categoryFor, type CatalogItem, type Provider } from "@/lib/shopCatalog";
import { equalSplit } from "@/lib/split";

interface Props {
  open: boolean;
  onClose: () => void;
  provider: Provider;
  lines: { item: CatalogItem; qty: number; price: number }[];
  total: number;
  onDone: () => void;
}

/** Records an order made in a delivery app as a shared expense (who paid, who splits, or the room fund). */
export function PurchaseSheet({ open, onClose, provider, lines, total, onDone }: Props) {
  const app = useApp();
  const receipts = useReceiptOverlay();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [people, setPeople] = useState<string[]>([]);
  const [fromFund, setFromFund] = useState(false);
  const [error, setError] = useState("");

  useOnOpen(open, () => {
    if (!app) return;
    setAmount(String(total)); setPaidBy(app.user.id); setFromFund(false); setError("");
    setPeople(app.members.filter((m) => m.member.kind !== "guest").map((m) => m.user.id));
  });
  if (!app) return null;

  const canFund = restrictionsOf(app.db, app.user.id, app.household.id).seeFund && fundBalance(app.db, app.household.id) > 0;
  const total_ = Number(amount) || 0;
  const group = lines[0]?.item.group ?? "Groceries";
  const title = `${provider.name} order`;
  const summary = lines.map((l) => `${l.qty}× ${l.item.name}`).join(", ");

  const submit = () => {
    setError("");
    if (!people.length) return setError("Choose who to split this with.");
    try {
      const { expense, receipt } = expenseService.create({
        title, amount: total_, category: categoryFor(group), date: fromInputDate(toInputDate(new Date())), paidBy, splitMode: "equal",
        splits: equalSplit(total_, people), notes: summary, paidFromFund: fromFund, source: provider.name,
      });
      onClose(); onDone();
      receipts.show({ receipt, heading: "ORDER RECORDED", onView: () => router.push(`/expenses/${expense.id}`) });
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't record the order."); }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Record & split order" description={`${provider.name} · ${summary}`}
      footer={<Button size="lg" block onClick={submit}>Split {money(total_)}{people.length ? ` · ${money(total_ / people.length)} each` : ""}</Button>}>
      <div className="space-y-4 pb-3 pt-2">
        <AmountInput label="Final amount you paid" value={amount} onChange={setAmount} />
        {canFund && (
          <div className="flex items-center gap-3 rounded-2xl bg-surface2 p-3.5">
            <PiggyBank className="h-5 w-5 text-success" /><div className="flex-1"><p className="text-sm font-bold">Paid from room fund</p><p className="text-xs text-muted">{money(fundBalance(app.db, app.household.id))} available</p></div>
            <Toggle label="Paid from room fund" checked={fromFund} onChange={setFromFund} />
          </div>
        )}
        {!fromFund && (
          <Select label="Who paid?" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}
            hint="Everyone else repays them via GPay, PhonePe, Paytm or UPI from Settle up."
            options={app.members.map((m) => ({ value: m.user.id, label: m.user.id === app.user.id ? `${m.user.name} (you)` : m.user.name }))} />
        )}
        <div>
          <p className="mb-2 px-1 text-[13px] font-semibold text-muted">Split between</p>
          <PersonChips label="Split between" people={app.members.map((m) => m.user)} selected={people} meId={app.user.id}
            onToggle={(id) => setPeople((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))} />
        </div>
        {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
      </div>
    </BottomSheet>
  );
}
