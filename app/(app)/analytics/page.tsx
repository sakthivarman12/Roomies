"use client";

import { BarChart3 } from "lucide-react";
import { BarChart, Donut, HBars } from "@/components/ui/Charts";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { AnimatedNumber } from "@/components/ui/Progress";
import { useApp } from "@/hooks/useApp";
import { CATEGORIES, CATEGORY_COLOR } from "@/lib/constants";
import { isSameMonth, money, monthLabel } from "@/lib/format";
import { contributions, householdExpenses, monthChange, monthlySeries, monthTotal, netBalance } from "@/lib/selectors";
import { sum } from "@/lib/utils";

export default function AnalyticsPage() {
  const app = useApp();
  if (!app) return null;
  const { db, household } = app;
  const month = householdExpenses(db, household.id).filter((e) => isSameMonth(e.date));
  const total = monthTotal(db, household.id);
  const slices = CATEGORIES.map((c) => ({ label: c, value: sum(month.filter((e) => e.category === c).map((e) => e.amount)), color: CATEGORY_COLOR[c] })).filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
  const series = monthlySeries(db, household.id, 6);
  const people = contributions(db, household.id);
  const maxPaid = Math.max(...people.map((p) => p.paid), 1);
  const outstanding = app.members.map(({ user }) => ({ user, net: netBalance(db, household.id, user.id) })).filter((x) => Math.abs(x.net) >= 0.01);
  const change = monthChange(db, household.id);

  return (
    <div>
      <PageHeader title="Analytics" back subtitle={monthLabel(new Date())} />
      <div className="space-y-4 px-4 pt-2 pb-6">
        {householdExpenses(db, household.id).length === 0 ? (
          <EmptyState icon={<BarChart3 className="h-7 w-7" />} title="No data yet" description="Add expenses to see where the money goes." />
        ) : (
          <>
            <Card>
              <h2 className="mb-4 text-sm font-extrabold">Category breakdown</h2>
              {slices.length === 0 ? <p className="text-sm text-muted">No spending this month.</p> : (
                <div className="flex flex-col items-center gap-5 sm:flex-row">
                  <Donut slices={slices} center={<><span className="text-[11px] font-bold text-muted">This month</span><span className="text-xl font-black"><AnimatedNumber value={total} /></span></>} />
                  <ul className="w-full flex-1 space-y-2">{slices.slice(0, 6).map((s) => (
                    <li key={s.label} className="flex items-center gap-2.5 text-sm"><span className="h-3 w-3 rounded-full" style={{ background: s.color }} /><span className="flex-1 font-semibold">{s.label}</span><span className="tnum font-bold">{money(s.value)}</span><span className="w-10 text-right text-xs text-muted">{Math.round((s.value / total) * 100)}%</span></li>
                  ))}</ul>
                </div>
              )}
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-extrabold">Monthly spending</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${change >= 0 ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}>{change >= 0 ? "↑" : "↓"} {Math.abs(change)}% vs last month</span></div>
              <BarChart data={series.map((s) => ({ label: s.label, value: s.total }))} />
            </Card>

            <Card>
              <h2 className="mb-4 text-sm font-extrabold">Who paid what</h2>
              <HBars items={people.map((p) => ({ label: p.name, value: p.paid, color: p.color }))} />
              <p className="mt-3 text-xs text-muted">Highest contributor paid {money(maxPaid)} across all expenses.</p>
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
    </div>
  );
}
