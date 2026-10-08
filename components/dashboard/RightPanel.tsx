"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { useApp } from "@/hooks/useApp";
import { activityFeed } from "@/lib/activity";
import { money, relativeTime } from "@/lib/format";
import { netBalance } from "@/lib/selectors";
import { cn } from "@/lib/utils";

/** Desktop-only activity/summary rail (xl and up). */
export function RightPanel() {
  const app = useApp();
  if (!app) return null;
  const net = netBalance(app.db, app.household.id, app.user.id);
  const bills = app.db.bills.filter((b) => b.householdId === app.household.id && !b.paid).sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate)).slice(0, 3);
  const feed = activityFeed(app.db, app.household.id, 7);

  return (
    <aside aria-label="Household summary" className="sticky top-0 hidden h-dvh w-[320px] shrink-0 flex-col gap-4 overflow-y-auto py-8 xl:flex">
      <div className="rounded-[28px] border border-line bg-surface p-5 shadow-card">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted">My balance</p>
        <p className={cn("tnum mt-1 text-3xl font-black", Math.abs(net) < 0.01 ? "text-success" : net < 0 ? "text-danger" : "text-success")}>
          {Math.abs(net) < 0.01 ? "Settled" : money(Math.abs(net))}
        </p>
        <p className="text-xs text-muted">{Math.abs(net) < 0.01 ? "Nothing to pay or collect" : net < 0 ? "You owe in total" : "You are owed in total"}</p>
      </div>
      <div className="rounded-[28px] border border-line bg-surface p-5 shadow-card">
        <h2 className="mb-3 text-sm font-extrabold">Upcoming bills</h2>
        {bills.length === 0 ? <p className="text-sm text-muted">No bills due. 🎉</p> : (
          <ul className="space-y-3">{bills.map((b) => (
            <li key={b.id} className="flex items-center justify-between text-sm"><span className="font-semibold">{b.title}</span><span className="tnum font-extrabold">{money(b.amount)}</span></li>
          ))}</ul>
        )}
      </div>
      <div className="rounded-[28px] border border-line bg-surface p-5 shadow-card">
        <h2 className="mb-3 text-sm font-extrabold">Recent activity</h2>
        <ul className="space-y-3.5">
          {feed.map((a) => {
            const u = app.userById(a.actorId);
            const body = (
              <div className="flex items-start gap-2.5">
                {u && <Avatar user={u} size="xs" />}
                <div className="min-w-0"><p className="text-[13px] leading-snug">{a.text}</p><p className="text-[11px] text-muted">{relativeTime(a.date)}</p></div>
              </div>
            );
            return <li key={a.id}>{a.href ? <Link href={a.href}>{body}</Link> : body}</li>;
          })}
        </ul>
      </div>
    </aside>
  );
}
