"use client";

import { ScrollText } from "lucide-react";
import { useMemo, useState } from "react";
import { TransactionRow } from "@/components/expenses/TransactionRow";
import { Card } from "@/components/ui/Card";
import { MiniSelect, SearchBox } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { useApp } from "@/hooks/useApp";
import { isSameMonth } from "@/lib/format";
import { transactionsFor } from "@/lib/selectors";

type Filter = "all" | "paid" | "owe" | "owed" | "settled";

export default function TransactionsPage() {
  const app = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [type, setType] = useState("all");
  const [person, setPerson] = useState("all");
  const [when, setWhen] = useState("all");

  const all = useMemo(() => (app ? transactionsFor(app.db, app.household.id, app.user.id) : []), [app]);
  const rows = useMemo(() => {
    if (!app) return [];
    return all.filter((t) => {
      const me = app.user.id;
      if (q && !`${t.title} ${t.category}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (type !== "all" && t.kind !== type) return false;
      if (person !== "all" && !t.involved.includes(person) && t.paidBy !== person) return false;
      if (when === "this" && !isSameMonth(t.date)) return false;
      if (filter === "paid") return t.paidBy === me;
      if (filter === "owe") return t.kind === "expense" && t.net < 0 && !t.settled;
      if (filter === "owed") return t.kind === "expense" && t.net > 0 && !t.settled;
      if (filter === "settled") return t.settled;
      return true;
    });
  }, [all, app, q, filter, type, person, when]);

  if (!app) return null;
  return (
    <div>
      <PageHeader title="Transactions" back="/expenses" subtitle="Everything that moved money" />
      <div className="space-y-4 px-4 pt-2">
        <SearchBox value={q} onChange={setQ} placeholder="Search transactions" />
        <Tabs<Filter> label="Filter transactions" value={filter} onChange={setFilter} options={[
          { value: "all", label: "All" }, { value: "paid", label: "You paid" }, { value: "owe", label: "You owe" }, { value: "owed", label: "You're owed" }, { value: "settled", label: "Settled" },
        ]} />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <MiniSelect label="Type" value={type} onChange={setType} options={[{ value: "all", label: "All types" }, { value: "expense", label: "Expenses" }, { value: "payment", label: "Settlements" }]} />
          <MiniSelect label="Person" value={person} onChange={setPerson} options={[{ value: "all", label: "Everyone" }, ...app.members.map((m) => ({ value: m.user.id, label: m.user.id === app.user.id ? "You" : m.user.name }))]} />
          <MiniSelect label="Date" value={when} onChange={setWhen} options={[{ value: "all", label: "All time" }, { value: "this", label: "This month" }]} />
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={<ScrollText className="h-7 w-7" />} title="No transactions" description="Nothing matches these filters yet." />
        ) : (
          <Card padded={false} className="px-4 pb-1">{rows.map((t) => <TransactionRow key={t.id} tx={t} myId={app.user.id} payerName={app.nameOf(t.paidBy)} />)}</Card>
        )}
      </div>
    </div>
  );
}
