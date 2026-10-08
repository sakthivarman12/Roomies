"use client";

import { Bell, ChevronDown, ClipboardPlus, HandCoins, Plus, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { useActions } from "@/components/AppActions";
import { AddMenu } from "@/components/AddMenu";
import { StoriesStrip } from "@/components/map/StoriesStrip";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { BillCard } from "@/components/dashboard/BillCard";
import { HeroCard } from "@/components/dashboard/HeroCard";
import { ChoreCard } from "@/components/chores/ChoreCard";
import { ExpenseCard } from "@/components/expenses/ExpenseCard";
import { RoommateCard } from "@/components/room/RoommateCard";
import { ShoppingList } from "@/components/room/ShoppingList";
import { Avatar } from "@/components/ui/Avatar";
import { Card, Reveal, SectionHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { Button, IconButton } from "@/components/ui/Button";
import { useAction } from "@/hooks/useAction";
import { useApp } from "@/hooks/useApp";
import { activityFeed } from "@/lib/activity";
import { daysFromNow, greeting, relativeTime } from "@/lib/format";
import { householdExpenses, nextInRotation, pairBalance } from "@/lib/selectors";
import { choreService, paymentService } from "@/lib/services";
import { Receipt, Sparkles } from "lucide-react";

export default function HomePage() {
  const app = useApp();
  const actions = useActions();
  const run = useAction();
  if (!app) return null;
  const { db, household, user } = app;

  const unread = db.notifications.filter((n) => n.userId === user.id && n.householdId === household.id && !n.read).length;
  const bills = db.bills.filter((b) => b.householdId === household.id && !b.paid).sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
  const dueThisWeek = bills.filter((b) => daysFromNow(b.dueDate) <= 7).length;
  const expenses = householdExpenses(db, household.id).slice(0, 4);
  const myChores = db.chores.filter((c) => c.householdId === household.id && !c.completed && c.assignedTo === user.id).sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
  const todayChore = myChores.find((c) => daysFromNow(c.dueDate) <= 0);
  const others = app.members.filter((m) => m.user.id !== user.id);
  const feed = activityFeed(db, household.id, 5);

  const tagline = todayChore ? `${todayChore.title} duty is yours today.` : dueThisWeek > 0 ? `${dueThisWeek} bill${dueThisWeek > 1 ? "s" : ""} due this week.` : "Household looking good.";

  return (
    <div className="space-y-7 px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3">
        <Link href="/profile" aria-label="Open profile"><Avatar user={user} size="md" /></Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-extrabold leading-tight">{greeting()}, {user.name}</p>
          <button onClick={actions.switchHousehold} aria-label={`Household: ${household.name}. Switch household`} className="-ml-1 flex min-h-[44px] items-center gap-1 rounded-lg px-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted">
            {household.name} <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <AddMenu />
        <Link href="/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative">
          <IconButton label="Notifications" tone="filled" tabIndex={-1}><Bell className="h-5 w-5" /></IconButton>
          {unread > 0 && <span key={unread} className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 animate-[pop_0.4s_ease-out] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-black text-white">{unread}</span>}
        </Link>
      </header>
      <p className="-mt-4 px-1 text-sm text-muted">{tagline}</p>

      <StoriesStrip />
      <HeroCard />
      <Reveal delay={0.08}><BalanceCard /></Reveal>

      <nav aria-label="Quick actions" className="-mx-4 flex gap-2.5 overflow-x-auto px-4 no-scrollbar">
        {[
          { label: "Add expense", icon: Plus, onClick: () => actions.addExpense(), primary: true },
          { label: "Settle up", icon: HandCoins, onClick: () => actions.settle() },
          { label: "Add chore", icon: ClipboardPlus, onClick: () => actions.addChore() },
          { label: "Shopping", icon: ShoppingBasket, onClick: () => document.getElementById("shopping")?.scrollIntoView({ behavior: "smooth" }) },
        ].map((a) => (
          <Button key={a.label} variant={a.primary ? "primary" : "secondary"} size="sm" className="shrink-0" onClick={a.onClick}><a.icon className="h-4 w-4" />{a.label}</Button>
        ))}
      </nav>

      <section aria-label="Upcoming bills">
        <SectionHeader title="Upcoming bills" action="All bills" href="/bills" />
        {bills.length === 0 ? (
          <Card className="text-center text-sm text-muted">No bills due. You&apos;re all caught up. 🎉</Card>
        ) : (
          <div className="space-y-2.5">{bills.slice(0, 2).map((b) => <BillCard key={b.id} bill={b} onPay={actions.payBill} compact />)}</div>
        )}
      </section>

      <section aria-label="Roommate balances">
        <SectionHeader title="Roommates" action="See all" href="/house" />
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {others.length === 0 ? (
            <EmptyState className="w-full" icon={<Sparkles className="h-7 w-7" />} title="It's just you here" description="Invite roommates with your household code." actionLabel="Add roommate" onAction={actions.addMember} />
          ) : others.map(({ user: u }, i) => {
            const bal = pairBalance(db, household.id, user.id, u.id);
            return (
              <RoommateCard key={u.id} user={u} balance={bal} index={i} onPay={() => actions.settle(u.id)}
                onRequest={() => run(() => paymentService.request(u.id, bal), `Requested ${u.name}`)} />
            );
          })}
        </div>
      </section>

      <section aria-label="Recent expenses">
        <SectionHeader title="Recent expenses" action="View all" href="/expenses" />
        {expenses.length === 0 ? (
          <EmptyState icon={<Receipt className="h-7 w-7" />} title="No shared expenses yet" description="Add your first household expense." actionLabel="Add expense" onAction={() => actions.addExpense()} />
        ) : (
          <div className="space-y-2.5">{expenses.map((e, i) => <ExpenseCard key={e.id} expense={e} myId={user.id} payerName={app.nameOf(e.paidBy)} index={i} />)}</div>
        )}
      </section>

      <section aria-label="My chores">
        <SectionHeader title="Your chores" action="Chore board" href="/chores" />
        {myChores.length === 0 ? (
          <Card className="text-center text-sm text-muted">Your chore board is clear. ✨</Card>
        ) : (
          <div className="space-y-2.5">
            {myChores.slice(0, 2).map((c) => {
              const nextId = nextInRotation(c.rotation, c.assignedTo);
              return (
                <ChoreCard key={c.id} chore={c} assignee={app.userById(c.assignedTo)} nextUp={nextId !== c.assignedTo ? app.userById(nextId) : undefined}
                  canEdit={false} onComplete={() => run(() => choreService.complete(c.id), "Chore completed — nice work!")} onReopen={() => run(() => choreService.reopen(c.id))}
                  onProgress={() => run(() => choreService.setInProgress(c.id))} onEdit={() => actions.addChore(c)} onDelete={() => undefined} />
              );
            })}
          </div>
        )}
      </section>

      <section id="shopping" aria-label="Shopping list" className="scroll-mt-20">
        <SectionHeader title="Shopping list" action="Open" href="/house" />
        <ShoppingList limit={4} />
      </section>

      <section aria-label="Recent activity">
        <SectionHeader title="Recent activity" />
        {feed.length === 0 ? (
          <Card className="text-center text-sm text-muted">Nothing yet — activity from your household will show up here.</Card>
        ) : (
        <Card padded={false} className="divide-y divide-line">
          {feed.map((a) => {
            const u = app.userById(a.actorId);
            return (
              <div key={a.id} className="flex items-center gap-3 p-3.5">
                {u && <Avatar user={u} size="sm" />}
                <div className="min-w-0 flex-1"><p className="text-[13px] font-medium leading-snug">{a.text}</p><p className="text-[11px] text-muted">{relativeTime(a.date)}</p></div>
              </div>
            );
          })}
        </Card>
        )}
      </section>
    </div>
  );
}
