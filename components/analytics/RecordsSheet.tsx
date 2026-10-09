"use client";

import Link from "next/link";
import { useState } from "react";
import { CategoryBubble } from "@/components/expenses/ExpenseCard";
import { Avatar } from "@/components/ui/Avatar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { EmptyState } from "@/components/ui/States";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useApp } from "@/hooks/useApp";
import { useOnOpen } from "@/hooks/useOnOpen";
import { CATEGORY_COLOR } from "@/lib/constants";
import { isSameMonth, money, monthLabel, shortDate } from "@/lib/format";
import { round2, sum } from "@/lib/utils";
import { Receipt } from "lucide-react";
import type { Expense, ExpenseCategory } from "@/types";

export interface RecordsQuery {
  title: string;
  month: Date | null;
  category?: ExpenseCategory | null;
  personId?: string | null;
}

type Scope = "month" | "all";

/** Drill-down for analytics: every record behind a number, with totals by category and by person. */
export function RecordsSheet({ open, onClose, query, expenses }: { open: boolean; onClose: () => void; query: RecordsQuery | null; expenses: Expense[] }) {
  const app = useApp();
  const [scope, setScope] = useState<Scope>("month");
  useOnOpen(open, () => setScope(query?.month ? "month" : "all"));
  if (!app || !query) return null;

  const rows = expenses
    .filter((e) => (scope === "month" && query.month ? isSameMonth(e.date, query.month) : true))
    .filter((e) => (query.category ? e.category === query.category : true))
    .filter((e) => (query.personId ? e.paidBy === query.personId || e.splits.some((s) => s.userId === query.personId) : true))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const shareOf = (e: Expense, id: string) => e.splits.find((s) => s.userId === id)?.amount ?? 0;
  const headline = query.personId ? sum(rows.map((e) => shareOf(e, query.personId!))) : sum(rows.map((e) => e.amount));
  const byCategory = Object.entries(rows.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.category]: (acc[e.category] ?? 0) + (query.personId ? shareOf(e, query.personId) : e.amount) }), {})).sort((a, b) => b[1] - a[1]);
  const people = app.members.map(({ user }) => ({
    user, paid: round2(sum(rows.filter((e) => e.paidBy === user.id && !e.paidFromFund).map((e) => e.amount))), share: round2(sum(rows.map((e) => shareOf(e, user.id)))),
  })).filter((p) => p.paid || p.share);

  // group by month for the all-time history view
  const groups = rows.reduce<{ key: string; label: string; items: Expense[] }[]>((acc, e) => {
    const d = new Date(e.date); const key = `${d.getFullYear()}-${d.getMonth()}`;
    const g = acc.find((x) => x.key === key);
    if (g) g.items.push(e); else acc.push({ key, label: monthLabel(d), items: [e] });
    return acc;
  }, []);

  return (
    <BottomSheet open={open} onClose={onClose} title={query.title}
      description={`${scope === "month" && query.month ? monthLabel(query.month) : "All time"} · ${rows.length} record${rows.length === 1 ? "" : "s"}`}>
      <div className="space-y-5 pb-4 pt-2">
        {query.month && (
          <SegmentedControl<Scope> label="Range" value={scope} onChange={setScope} options={[{ value: "month", label: monthLabel(query.month) }, { value: "all", label: "All time history" }]} />
        )}
        <div className="rounded-3xl bg-surface2 p-4 text-center">
          <p className="text-xs font-semibold text-muted">{query.personId ? `${app.nameOf(query.personId)} consumed` : "Total spent"}</p>
          <p className="tnum text-[34px] font-black leading-tight">{money(headline)}</p>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={<Receipt className="h-7 w-7" />} title="No records" description="Nothing matches this selection yet." />
        ) : (
          <>
            {!query.category && byCategory.length > 0 && (
              <section aria-label="By category" className="space-y-2.5">
                <h3 className="px-1 text-sm font-extrabold">By category</h3>
                <ul className="space-y-2">
                  {byCategory.map(([cat, amt]) => (
                    <li key={cat}>
                      <div className="mb-1 flex justify-between text-[13px]"><span className="font-semibold">{cat}</span><span className="tnum font-bold">{money(amt)} <span className="font-medium text-muted">· {Math.round((amt / (headline || 1)) * 100)}%</span></span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface2"><div className="h-full rounded-full" style={{ width: `${(amt / (headline || 1)) * 100}%`, background: CATEGORY_COLOR[cat as ExpenseCategory] }} /></div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {!query.personId && people.length > 0 && (
              <section aria-label="By person" className="space-y-2.5">
                <h3 className="px-1 text-sm font-extrabold">By person</h3>
                <div className="overflow-hidden rounded-2xl border border-line">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 bg-surface2 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-muted"><span>Roommate</span><span className="text-right">Paid</span><span className="text-right">Share</span></div>
                  {people.map((p) => (
                    <div key={p.user.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-t border-line px-3.5 py-2.5 text-sm">
                      <span className="flex items-center gap-2 font-semibold"><Avatar user={p.user} size="xs" />{app.nameOf(p.user.id)}</span>
                      <span className="tnum text-right font-bold">{money(p.paid)}</span><span className="tnum text-right font-bold text-muted">{money(p.share)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section aria-label="Records" className="space-y-3">
              <h3 className="px-1 text-sm font-extrabold">{scope === "all" ? "History" : "Records"}</h3>
              {groups.map((g) => (
                <div key={g.key}>
                  {scope === "all" && <p className="mb-1 px-1 text-xs font-bold uppercase tracking-wider text-muted">{g.label} · {money(sum(g.items.map((e) => (query.personId ? shareOf(e, query.personId) : e.amount))))}</p>}
                  <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                    {g.items.map((e) => (
                      <li key={e.id}>
                        <Link href={`/expenses/${e.id}`} onClick={onClose} className="flex min-h-[60px] items-center gap-3 px-3 py-2.5">
                          <CategoryBubble category={e.category} size={38} />
                          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{e.title}</span>
                            <span className="block truncate text-xs text-muted">{shortDate(e.date)} · {e.paidFromFund ? "Room fund" : app.nameOf(e.paidBy)} paid · {e.splits.length} {e.splits.length === 1 ? "person" : "people"}</span></span>
                          <span className="text-right"><span className="tnum block text-sm font-extrabold">{money(e.amount)}</span>
                            {query.personId && <span className="tnum block text-[11px] font-semibold text-muted">share {money(shareOf(e, query.personId))}</span>}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
