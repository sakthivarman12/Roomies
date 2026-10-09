"use client";

import { ArrowDownLeft, ArrowUpRight, Lock, PiggyBank, Plus } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { AmountInput, Input, Select } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnimatedNumber } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/hooks/useApp";
import { useOnOpen } from "@/hooks/useOnOpen";
import { fundBalance, fundEntries, restrictionsOf } from "@/lib/access";
import { PAYMENT_METHODS } from "@/lib/constants";
import { money, relativeTime } from "@/lib/format";
import { fundService } from "@/lib/services";
import { sum } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

function ContributeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  useOnOpen(open, () => { setAmount(""); setMethod("UPI"); setNote(""); setError(""); });

  const submit = () => {
    try { fundService.contribute({ amount: Number(amount), method, note }); toast.show(`${money(Number(amount))} added to the room fund`); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't add to the fund."); }
  };
  return (
    <BottomSheet open={open} onClose={onClose} title="Add to room fund" description="Money everyone pools for shared costs"
      footer={<Button size="lg" variant="success" block onClick={submit}>Add {Number(amount) > 0 ? money(Number(amount)) : "to fund"}</Button>}>
      <div className="space-y-4 pb-3 pt-2">
        <AmountInput value={amount} onChange={setAmount} autoFocus />
        <Select label="How did you pay?" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))} />
        <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. October share" />
        {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
      </div>
    </BottomSheet>
  );
}

export default function FundPage() {
  const app = useApp();
  const [open, setOpen] = useState(false);
  if (!app) return null;

  if (!restrictionsOf(app.db, app.user.id, app.household.id).seeFund) {
    return (
      <div><PageHeader title="Room fund" back="/profile" />
        <div className="px-4 pt-4"><EmptyState icon={<Lock className="h-7 w-7" />} title="Fund is private" description="The owner hasn't given you access to the room fund." /></div></div>
    );
  }

  const entries = fundEntries(app.db, app.household.id);
  const balance = fundBalance(app.db, app.household.id);
  const contributed = sum(entries.filter((e) => e.kind === "contribution").map((e) => e.amount));
  const spent = sum(entries.filter((e) => e.kind === "spend").map((e) => e.amount));
  const byPerson = app.members.map(({ user }) => ({ user, paid: sum(entries.filter((e) => e.kind === "contribution" && e.userId === user.id).map((e) => e.amount)) })).sort((a, b) => b.paid - a.paid);

  return (
    <div>
      <PageHeader title="Room fund" back="/profile" subtitle="Common pot for rent, Wi-Fi, water & more"
        right={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add</Button>} />
      <div className="space-y-6 px-4 pt-2 pb-6">
        <Card className="bg-gradient-to-br from-success-soft to-surface">
          <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success text-white"><PiggyBank className="h-6 w-6" /></span>
            <div><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted">Available</p><p className={`text-[34px] font-black leading-none ${balance < 0 ? "text-danger" : ""}`}><AnimatedNumber value={balance} /></p></div></div>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl bg-surface2 p-3"><dt className="text-[11px] font-semibold text-muted">Put in</dt><dd className="tnum text-[15px] font-extrabold text-success">{money(contributed)}</dd></div>
            <div className="rounded-2xl bg-surface2 p-3"><dt className="text-[11px] font-semibold text-muted">Spent</dt><dd className="tnum text-[15px] font-extrabold">{money(spent)}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-muted">Pay an expense or bill from the fund when you add it — nobody then owes anybody.</p>
        </Card>

        <section aria-label="Contributions by person">
          <SectionHeader title="Who put in what" />
          <Card padded={false} className="divide-y divide-line">
            {byPerson.map(({ user, paid }) => (
              <div key={user.id} className="flex items-center gap-3 p-3.5"><Avatar user={user} size="sm" />
                <span className="flex-1 text-sm font-semibold">{app.nameOf(user.id)}</span>
                <span className={`tnum text-sm font-extrabold ${paid ? "text-success" : "text-muted"}`}>{paid ? money(paid) : "—"}</span></div>
            ))}
          </Card>
        </section>

        <section aria-label="Fund history">
          <SectionHeader title="History" />
          {entries.length === 0 ? <EmptyState icon={<PiggyBank className="h-7 w-7" />} title="Fund is empty" description="Everyone can add a little each month." actionLabel="Add to fund" onAction={() => setOpen(true)} /> : (
            <Card padded={false} className="px-4 pb-1">
              {entries.map((e) => (
                <div key={e.id} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${e.kind === "contribution" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{e.kind === "contribution" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{e.kind === "contribution" ? `${app.nameOf(e.userId)} added` : e.note ?? "Spent"}</p>
                    <p className="truncate text-xs text-muted">{relativeTime(e.createdAt)}{e.kind === "contribution" && e.note ? ` · ${e.note}` : ""}{e.kind === "spend" ? ` · by ${app.nameOf(e.userId)}` : e.method ? ` · ${e.method}` : ""}</p></div>
                  <span className={`tnum text-sm font-extrabold ${e.kind === "contribution" ? "text-success" : ""}`}>{e.kind === "contribution" ? "+" : "−"}{money(e.amount)}</span>
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>
      <ContributeSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
