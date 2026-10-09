"use client";

import { Mail, Phone } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useActions } from "@/components/AppActions";
import { ExpenseCard } from "@/components/expenses/ExpenseCard";
import { TransactionRow } from "@/components/expenses/TransactionRow";
import { Avatar } from "@/components/ui/Avatar";
import { ContactButtons } from "@/components/room/ContactButtons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { useAction } from "@/hooks/useAction";
import { useApp } from "@/hooks/useApp";
import { dueLabel, money, shortDate } from "@/lib/format";
import { householdExpenses, pairBalance, transactionsFor } from "@/lib/selectors";
import { paymentService } from "@/lib/services";
import { Users } from "lucide-react";

export default function RoommatePage() {
  const { id } = useParams<{ id: string }>();
  const app = useApp();
  const actions = useActions();
  const run = useAction();
  const router = useRouter();
  if (!app) return null;

  const view = app.members.find((m) => m.user.id === id);
  if (!view) {
    return (<div><PageHeader title="Roommate" back="/house" /><div className="px-4 pt-4"><EmptyState icon={<Users className="h-7 w-7" />} title="Roommate not found" description="They may have left the household." actionLabel="Back to house" onAction={() => router.push("/house")} /></div></div>);
  }
  const { user, member } = view;
  const isMe = user.id === app.user.id;
  const bal = isMe ? 0 : pairBalance(app.db, app.household.id, app.user.id, user.id);
  const together = householdExpenses(app.db, app.household.id).filter((e) => (e.paidBy === user.id || e.splits.some((s) => s.userId === user.id)) && (isMe || e.paidBy === app.user.id || e.splits.some((s) => s.userId === app.user.id)));
  const chores = app.db.chores.filter((c) => c.householdId === app.household.id && c.assignedTo === user.id && !c.completed);
  const txs = transactionsFor(app.db, app.household.id, app.user.id).filter((t) => t.involved.includes(user.id)).slice(0, 6);

  return (
    <div>
      <PageHeader title={isMe ? "My profile" : user.name} back="/house" />
      <div className="space-y-6 px-4 pt-2 pb-6">
        <Card className="text-center">
          <div className="mx-auto w-fit"><Avatar user={user} size="xl" /></div>
          <h2 className="mt-3 text-xl font-extrabold">{user.name}</h2>
          <div className="mt-1"><Badge tone={member.role === "OWNER" ? "violet" : member.role === "ADMIN" ? "info" : "neutral"}>{member.role}</Badge>{member.kind === "guest" && <Badge tone="warning" className="ml-1.5">Friend{member.stayUntil ? ` · until ${shortDate(member.stayUntil)}` : ""}</Badge>}</div>
          <div className="mt-3 flex flex-col items-center gap-1 text-sm text-muted">
            <span className="flex items-center gap-2"><Mail className="h-4 w-4" />{user.email}</span>
            {user.phone && <span className="flex items-center gap-2"><Phone className="h-4 w-4" />{user.phone}</span>}
          </div>
          {app.canManage && !isMe && member.role !== "OWNER" && <Button size="sm" variant="secondary" className="mt-3" onClick={() => actions.reviewAccess({ userId: user.id })}>Access &amp; restrictions</Button>}
          {!isMe && <ContactButtons name={user.name} phone={user.phone} className="mt-4" />}
          {!isMe && (
            <div className="mt-5 rounded-3xl bg-surface2 p-4">
              {Math.abs(bal) < 0.01 ? <p className="font-extrabold text-success">✓ You&apos;re all settled</p> : bal < 0 ? (
                <><p className="text-xs font-semibold text-muted">You owe {user.name}</p><p className="tnum text-3xl font-black text-danger">{money(-bal)}</p>
                  <Button className="mt-3" block onClick={() => actions.settle(user.id)}>Settle up</Button></>
              ) : (
                <><p className="text-xs font-semibold text-muted">{user.name} owes you</p><p className="tnum text-3xl font-black text-success">{money(bal)}</p>
                  <Button className="mt-3" variant="soft" block onClick={() => run(() => paymentService.request(user.id, bal), `Requested ${user.name}`)}>Send reminder</Button></>
              )}
            </div>
          )}
        </Card>

        <section><SectionHeader title="Chores" />
          {chores.length === 0 ? <Card className="text-center text-sm text-muted">No open chores. 🙌</Card> : (
            <Card padded={false} className="divide-y divide-line">{chores.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3.5"><span className="text-sm font-bold">{c.title}</span><span className="text-xs text-muted">{dueLabel(c.dueDate)}</span></div>
            ))}</Card>
          )}
        </section>

        <section><SectionHeader title={isMe ? "My expenses" : "Expenses together"} />
          {together.length === 0 ? <Card className="text-center text-sm text-muted">No shared expenses yet.</Card> : (
            <div className="space-y-2.5">{together.slice(0, 5).map((e, i) => <ExpenseCard key={e.id} expense={e} myId={app.user.id} payerName={app.nameOf(e.paidBy)} index={i} />)}</div>
          )}
        </section>

        {!isMe && txs.length > 0 && (
          <section><SectionHeader title="Transactions" />
            <Card padded={false} className="px-4 pb-1">{txs.map((t) => <TransactionRow key={t.id} tx={t} myId={app.user.id} payerName={app.nameOf(t.paidBy)} />)}</Card></section>
        )}
      </div>
    </div>
  );
}
