"use client";

import { Plus, Receipt, Repeat2, ScrollText } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useActions } from "@/components/AppActions";
import { ExpenseCard } from "@/components/expenses/ExpenseCard";
import { Button } from "@/components/ui/Button";
import { MiniSelect, SearchBox } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { useApp } from "@/hooks/useApp";
import { CATEGORIES } from "@/lib/constants";
import { isSameMonth, money } from "@/lib/format";
import { visibleExpenses } from "@/lib/access";
import { monthTotal, pairBalance } from "@/lib/selectors";
import { sum } from "@/lib/utils";

type Status = "all" | "paid" | "owe" | "owed" | "settled";
type When = "all" | "this" | "last";

export default function ExpensesPage() {
  const app = useApp();
  const actions = useActions();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [category, setCategory] = useState("all");
  const [person, setPerson] = useState("all");
  const [when, setWhen] = useState<When>("all");

  const all = useMemo(() => (app ? visibleExpenses(app.db, app.household.id, app.user.id) : []), [app]);

  const filtered = useMemo(() => {
    if (!app) return [];
    const me = app.user.id;
    const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    return all.filter((e) => {
      if (q && !`${e.title} ${e.category} ${e.notes ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (category !== "all" && e.category !== category) return false;
      if (person !== "all" && e.paidBy !== person && !e.splits.some((s) => s.userId === person)) return false;
      if (when === "this" && !isSameMonth(e.date)) return false;
      if (when === "last" && !isSameMonth(e.date, lastMonth)) return false;
      const share = e.splits.find((s) => s.userId === me)?.amount ?? 0;
      if (status === "paid") return e.paidBy === me;
      if (status === "owe") return e.paidBy !== me && share > 0;
      if (status === "owed") return e.paidBy === me && e.splits.some((s) => s.userId !== me);
      if (status === "settled") {
        const other = e.paidBy === me ? e.splits.filter((s) => s.userId !== me).map((s) => s.userId) : [e.paidBy];
        return other.length > 0 && other.every((o) => Math.abs(pairBalance(app.db, app.household.id, me, o)) < 0.01);
      }
      return true;
    });
  }, [all, app, q, status, category, person, when]);

  if (!app) return null;
  const filtering = q || status !== "all" || category !== "all" || person !== "all" || when !== "all";

  return (
    <div>
      <PageHeader title="Expenses" subtitle={`${money(monthTotal(app.db, app.household.id))} this month`}
        right={<Button size="sm" onClick={() => actions.addExpense()}><Plus className="h-4 w-4" />Add</Button>} />
      <div className="space-y-4 px-4 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <Link href="/transactions" className="flex min-h-[52px] items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 text-sm font-bold shadow-card"><ScrollText className="h-5 w-5 text-primary" />Transactions</Link>
          <Link href="/bills" className="flex min-h-[52px] items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 text-sm font-bold shadow-card"><Repeat2 className="h-5 w-5 text-primary" />Bills</Link>
        </div>
        <SearchBox value={q} onChange={setQ} placeholder="Search expenses" />
        <Tabs<Status> label="Filter expenses" value={status} onChange={setStatus} options={[
          { value: "all", label: "All" }, { value: "paid", label: "You paid" }, { value: "owe", label: "You owe" }, { value: "owed", label: "You're owed" }, { value: "settled", label: "Settled" },
        ]} />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <MiniSelect label="Category" value={category} onChange={setCategory} options={[{ value: "all", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />
          <MiniSelect label="Person" value={person} onChange={setPerson} options={[{ value: "all", label: "Everyone" }, ...app.members.map((m) => ({ value: m.user.id, label: m.user.id === app.user.id ? "You" : m.user.name }))]} />
          <MiniSelect label="Date" value={when} onChange={(v) => setWhen(v as When)} options={[{ value: "all", label: "All time" }, { value: "this", label: "This month" }, { value: "last", label: "Last month" }]} />
        </div>
        {filtering && <p className="px-1 text-xs font-semibold text-muted">{filtered.length} result{filtered.length === 1 ? "" : "s"} · {money(sum(filtered.map((e) => e.amount)))}</p>}

        {all.length === 0 ? (
          <EmptyState icon={<Receipt className="h-7 w-7" />} title="No shared expenses yet" description={"No shared expenses this month.\nAdd your first household expense."} actionLabel="Add expense" onAction={() => actions.addExpense()} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Receipt className="h-7 w-7" />} title="Nothing matches" description="Try clearing a filter or searching for something else." actionLabel="Clear filters" onAction={() => { setQ(""); setStatus("all"); setCategory("all"); setPerson("all"); setWhen("all"); }} />
        ) : (
          <div className="space-y-2.5 pb-4">{filtered.map((e, i) => <ExpenseCard key={e.id} expense={e} myId={app.user.id} payerName={app.nameOf(e.paidBy)} index={i} />)}</div>
        )}
      </div>
    </div>
  );
}
