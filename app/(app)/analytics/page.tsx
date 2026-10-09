"use client";

import { BarChart3, ChevronLeft, ChevronRight, ListTree } from "lucide-react";
import { useMemo, useState } from "react";
import { RecordsSheet, type RecordsQuery } from "@/components/analytics/RecordsSheet";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BarChart, Donut, HBars } from "@/components/ui/Charts";
import { PersonChips } from "@/components/ui/Chips";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnimatedNumber } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/States";
import { useApp } from "@/hooks/useApp";
import { visibleExpenses } from "@/lib/access";
import { inMonth, personMonthly } from "@/lib/analytics";
import { CATEGORIES, CATEGORY_COLOR } from "@/lib/constants";
import { money, monthLabel } from "@/lib/format";
import { netBalance } from "@/lib/selectors";
import { sum } from "@/lib/utils";
import type { ExpenseCategory } from "@/types";

const MONTHS = 6;

function monthAt(offsetFromNow: number): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth() - offsetFromNow, 1);
}

export default function AnalyticsPage() {
  const app = useApp();
  const [back, setBack] = useState(0); // months before the current one
  const [person, setPerson] = useState<string | null>(null);
  const [query, setQuery] = useState<RecordsQuery | null>(null);

  const expenses = useMemo(() => (app ? visibleExpenses(app.db, app.household.id, app.user.id) : []), [app]);
  const personId = person ?? app?.user.id ?? "";
  const ref = monthAt(back);
  const month = useMemo(() => inMonth(expenses, ref), [expenses, ref]);
  const total = sum(month.map((e) => e.amount));

  const series = useMemo(() => Array.from({ length: MONTHS }, (_, i) => {
    const r = monthAt(MONTHS - 1 - i);
    return { label: r.toLocaleDateString("en-IN", { month: "short" }), value: sum(inMonth(expenses, r).map((e) => e.amount)), back: MONTHS - 1 - i };
  }), [expenses]);
  const mine = useMemo(() => personMonthly(expenses, personId, MONTHS), [expenses, personId]);

  if (!app) return null;
  const slices = CATEGORIES.map((c) => ({ label: c, value: sum(month.filter((e) => e.category === c).map((e) => e.amount)), color: CATEGORY_COLOR[c] })).filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
  const contrib = app.members.map(({ user }) => ({ label: user.name, value: sum(month.filter((e) => e.paidBy === user.id && !e.paidFromFund).map((e) => e.amount)), color: user.avatarColor }));
  const outstanding = app.members.map(({ user }) => ({ user, net: netBalance(app.db, app.household.id, user.id) })).filter((x) => Math.abs(x.net) >= 0.01);
  const sel = mine.findIndex((m) => m.ref.getMonth() === ref.getMonth() && m.ref.getFullYear() === ref.getFullYear());
  const personName = app.nameOf(personId) === "You" ? "You" : app.nameOf(personId);

  const open = (q: RecordsQuery) => setQuery(q);

  return (
    <div>
      <PageHeader title="Analytics" back subtitle="Tap any chart to see the records behind it" />
      <div className="space-y-4 px-4 pt-2 pb-6">
        {expenses.length === 0 ? (
          <EmptyState icon={<BarChart3 className="h-7 w-7" />} title="No data yet" description="Add expenses to see where the money goes." />
        ) : (
          <>
            <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-1.5">
              <Button variant="ghost" size="sm" aria-label="Previous month" disabled={back >= 11} onClick={() => setBack((b) => b + 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <p className="text-sm font-extrabold">{monthLabel(ref)}</p>
              <Button variant="ghost" size="sm" aria-label="Next month" disabled={back === 0} onClick={() => setBack((b) => Math.max(0, b - 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>

            <Card>
              <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-extrabold">Category breakdown</h2>
                <button onClick={() => open({ title: "All records", month: ref })} className="inline-flex min-h-[44px] items-center gap-1 text-xs font-bold text-primary"><ListTree className="h-4 w-4" />All records</button></div>
              {slices.length === 0 ? <p className="text-sm text-muted">No spending in {monthLabel(ref)}.</p> : (
                <div className="flex flex-col items-center gap-5 sm:flex-row">
                  <Donut slices={slices} onSelect={(c) => open({ title: c, month: ref, category: c as ExpenseCategory })} onCenter={() => open({ title: "All records", month: ref })}
                    center={<><span className="text-[11px] font-bold text-muted">{ref.toLocaleDateString("en-IN", { month: "long" })}</span><span className="text-xl font-black"><AnimatedNumber value={total} /></span></>} />
                  <ul className="w-full flex-1 space-y-1">
                    {slices.map((s) => (
                      <li key={s.label}>
                        <button onClick={() => open({ title: s.label, month: ref, category: s.label as ExpenseCategory })} className="flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-2 text-sm hover:bg-surface2">
                          <span className="h-3 w-3 rounded-full" style={{ background: s.color }} /><span className="flex-1 text-left font-semibold">{s.label}</span>
                          <span className="tnum font-bold">{money(s.value)}</span><span className="w-10 text-right text-xs text-muted">{Math.round((s.value / total) * 100)}%</span><ChevronRight className="h-4 w-4 text-muted" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-1 text-sm font-extrabold">Monthly spending · whole room</h2>
              <p className="mb-3 text-xs text-muted">Tap a month to open its records.</p>
              <BarChart data={series} selected={MONTHS - 1 - back} onSelect={(i) => { setBack(MONTHS - 1 - i); open({ title: "Room spending", month: monthAt(MONTHS - 1 - i) }); }} />
            </Card>

            <Card>
              <h2 className="mb-1 text-sm font-extrabold">Monthly spending · individual</h2>
              <p className="mb-3 text-xs text-muted">What a person actually consumed (their share of every split).</p>
              <PersonChips single label="Choose person" people={app.members.map((m) => m.user)} selected={[personId]} onToggle={setPerson} meId={app.user.id} />
              <div className="mt-4"><BarChart data={mine.map((m) => ({ label: m.label, value: m.share }))} selected={sel} onSelect={(i) => { setBack(MONTHS - 1 - i); open({ title: `${personName === "You" ? "Your" : `${personName}'s`} spending`, month: mine[i].ref, personId }); }} /></div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-2xl bg-surface2 p-3"><dt className="text-[11px] font-semibold text-muted">Consumed in {ref.toLocaleDateString("en-IN", { month: "short" })}</dt><dd className="tnum text-[15px] font-extrabold">{money(mine[Math.max(sel, 0)]?.share ?? 0)}</dd></div>
                <div className="rounded-2xl bg-surface2 p-3"><dt className="text-[11px] font-semibold text-muted">Paid out in {ref.toLocaleDateString("en-IN", { month: "short" })}</dt><dd className="tnum text-[15px] font-extrabold">{money(mine[Math.max(sel, 0)]?.paid ?? 0)}</dd></div>
              </dl>
              <Button variant="soft" block className="mt-3" onClick={() => open({ title: `${personName === "You" ? "Your" : `${personName}'s`} spending`, month: ref, personId })}>View {personName === "You" ? "my" : `${personName}'s`} records &amp; history</Button>
            </Card>

            <Card>
              <h2 className="mb-1 text-sm font-extrabold">Who paid · {ref.toLocaleDateString("en-IN", { month: "long" })}</h2>
              <p className="mb-3 text-xs text-muted">Out-of-pocket payments only (room fund excluded).</p>
              <HBars items={contrib} />
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-extrabold">Outstanding balances</h2>
              {outstanding.length === 0 ? <p className="text-sm font-semibold text-success">✓ Everyone is settled up.</p> : (
                <ul className="space-y-3">{outstanding.map(({ user, net }) => (
                  <li key={user.id} className="flex items-center gap-3"><Avatar user={user} size="sm" /><span className="flex-1 text-sm font-semibold">{app.nameOf(user.id)}</span>
                    <span className={`tnum text-sm font-extrabold ${net > 0 ? "text-success" : "text-danger"}`}>{net > 0 ? `is owed ${money(net)}` : `owes ${money(-net)}`}</span></li>
                ))}</ul>
              )}
            </Card>
          </>
        )}
      </div>
      <RecordsSheet open={query !== null} onClose={() => setQuery(null)} query={query} expenses={expenses} />
    </div>
  );
}
