"use client";

import { ImagePlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useOnOpen } from "@/hooks/useOnOpen";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { PersonChips } from "@/components/ui/Chips";
import { AmountInput, DatePicker, Input, Select, Textarea } from "@/components/ui/Fields";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useReceiptOverlay } from "@/components/expenses/ReceiptOverlay";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { CATEGORIES } from "@/lib/constants";
import { fromInputDate, money, toInputDate } from "@/lib/format";
import { expenseService } from "@/lib/services";
import { computeSplits } from "@/lib/split";
import { round2 } from "@/lib/utils";
import type { Expense, ExpenseCategory, SplitMode } from "@/types";

async function fileToDataUrl(file: File, maxSide = 900): Promise<string> {
  const raw = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("Couldn't read that image."));
    r.readAsDataURL(file);
  });
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale; canvas.height = img.height * scale;
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      res(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => res(raw);
    img.src = raw;
  });
}

export function ExpenseSheet({ open, onClose, expense }: { open: boolean; onClose: () => void; expense?: Expense | null }) {
  const app = useApp();
  const toast = useToast();
  const router = useRouter();
  const receipts = useReceiptOverlay();
  const editing = Boolean(expense);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Groceries");
  const [date, setDate] = useState(toInputDate(new Date()));
  const [paidBy, setPaidBy] = useState("");
  const [mode, setMode] = useState<SplitMode>("equal");
  const [people, setPeople] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [error, setError] = useState("");

  useOnOpen(open, () => {
    if (!app) return;
    if (expense) {
      setTitle(expense.title); setAmount(String(expense.amount)); setCategory(expense.category); setDate(toInputDate(expense.date));
      setPaidBy(expense.paidBy); setMode(expense.splitMode); setPeople(expense.splits.map((s) => s.userId));
      setValues(Object.fromEntries(expense.splits.map((s) => [s.userId, String(expense.splitMode === "percentage" ? round2((s.amount / expense.amount) * 100) : s.amount)])));
      setNotes(expense.notes ?? ""); setImage(expense.receiptImage);
    } else {
      setTitle(""); setAmount(""); setCategory("Groceries"); setDate(toInputDate(new Date())); setPaidBy(app.user.id);
      setMode("equal"); setPeople(app.members.map((m) => m.user.id)); setValues({}); setNotes(""); setImage(undefined);
    }
    setError("");
  });

  const total = Number(amount) || 0;
  const numeric = useMemo(() => Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v) || 0])), [values]);
  const result = useMemo(() => computeSplits({ mode, amount: total, participants: people, values: numeric }), [mode, total, people, numeric]);
  const allocated = people.reduce((a, id) => a + (numeric[id] ?? 0), 0);

  if (!app) return null;

  const toggle = (id: string) => setPeople((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = () => {
    setError("");
    if (!(total > 0)) return setError("Enter an amount greater than zero.");
    if (result.error) return setError(result.error);
    try {
      const input = {
        title, amount: total, category, date: fromInputDate(date), paidBy, splitMode: mode, splits: result.splits, notes, receiptImage: image,
      };
      if (expense) {
        expenseService.update(expense.id, input);
        toast.show("Expense updated");
        onClose();
      } else {
        const { expense: created, receipt } = expenseService.create(input);
        onClose();
        receipts.show({ receipt, heading: "EXPENSE ADDED", onView: () => router.push(`/expenses/${created.id}`) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save expense.");
    }
  };

  const people_ = app.members.map((m) => m.user);
  const unit = mode === "percentage" ? "%" : "₹";
  const remaining = mode === "percentage" ? round2(100 - allocated) : round2(total - allocated);

  return (
    <BottomSheet
      open={open} onClose={onClose} title={editing ? "Edit expense" : "Add expense"} description={`Shared with ${app.household.name}`}
      footer={<Button size="lg" block onClick={submit}>{editing ? "Save changes" : "Add expense"}</Button>}
    >
      <div className="space-y-4 pb-2 pt-2">
        <AmountInput value={amount} onChange={setAmount} autoFocus={!editing} />
        <Input label="What was it for?" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Electricity bill, groceries, …" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <DatePicker label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Select label="Paid by" value={paidBy} onChange={(e) => setPaidBy(e.target.value)} options={people_.map((u) => ({ value: u.id, label: u.id === app.user.id ? `${u.name} (you)` : u.name }))} />

        <div className="space-y-2.5">
          <p className="px-1 text-[13px] font-semibold text-muted">Split between</p>
          <PersonChips label="Split between" people={people_} selected={people} onToggle={toggle} meId={app.user.id} />
          <SegmentedControl<SplitMode> label="Split type" value={mode} onChange={setMode} options={[{ value: "equal", label: "Equal" }, { value: "percentage", label: "Percentage" }, { value: "custom", label: "Custom" }]} />
        </div>

        {mode === "equal" && people.length > 0 && total > 0 && (
          <p className="rounded-2xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
            {money(total)} ÷ {people.length} = <b>{money(round2(total / people.length))}</b> each
          </p>
        )}
        {mode !== "equal" && (
          <div className="space-y-2 rounded-3xl bg-surface2/60 p-3">
            {people.map((id) => {
              const u = people_.find((p) => p.id === id)!;
              return (
                <div key={id} className="flex items-center gap-3">
                  <span className="w-20 truncate text-sm font-semibold">{id === app.user.id ? "You" : u.name}</span>
                  <div className="flex flex-1 items-center rounded-xl border border-line bg-surface px-3">
                    {unit === "₹" && <span className="text-muted">₹</span>}
                    <input aria-label={`${u.name} ${mode === "percentage" ? "percentage" : "amount"}`} inputMode="decimal" value={values[id] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [id]: e.target.value.replace(/[^0-9.]/g, "") }))} placeholder="0" className="tnum min-h-[44px] w-full bg-transparent px-2 text-right font-bold focus:outline-none" />
                    {unit === "%" && <span className="text-muted">%</span>}
                  </div>
                </div>
              );
            })}
            <p className={`px-1 pt-1 text-xs font-bold ${remaining === 0 ? "text-success" : "text-warning"}`}>
              {remaining === 0 ? "✓ Fully allocated" : remaining > 0 ? `${mode === "percentage" ? `${remaining}%` : money(remaining)} left to allocate` : `Over by ${mode === "percentage" ? `${-remaining}%` : money(-remaining)}`}
            </p>
          </div>
        )}

        <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything roommates should know" />

        <div>
          <p className="mb-1.5 px-1 text-[13px] font-semibold text-muted">Receipt photo (optional)</p>
          {image ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Receipt preview" className="h-28 rounded-2xl border border-line object-cover" />
              <button type="button" aria-label="Remove photo" onClick={() => setImage(undefined)} className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-bg"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <label className="flex min-h-[56px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-sm font-semibold text-muted hover:border-primary hover:text-primary">
              <ImagePlus className="h-5 w-5" /> Attach photo
              <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImage(await fileToDataUrl(f)); }} />
            </label>
          )}
        </div>

        {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
      </div>
    </BottomSheet>
  );
}
