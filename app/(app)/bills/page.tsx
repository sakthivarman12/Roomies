"use client";

import { AnimatePresence } from "framer-motion";
import { CalendarClock, Plus } from "lucide-react";
import { useActions } from "@/components/AppActions";
import { BillCard } from "@/components/dashboard/BillCard";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { useAction } from "@/hooks/useAction";
import { useApp } from "@/hooks/useApp";
import { money } from "@/lib/format";
import { billService } from "@/lib/services";
import { sum } from "@/lib/utils";

export default function BillsPage() {
  const app = useApp();
  const actions = useActions();
  const run = useAction();
  if (!app) return null;

  const bills = app.db.bills.filter((b) => b.householdId === app.household.id);
  const unpaid = bills.filter((b) => !b.paid).sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
  const paid = bills.filter((b) => b.paid).sort((a, b) => +new Date(b.dueDate) - +new Date(a.dueDate));

  return (
    <div>
      <PageHeader title="Bills" back="/expenses" subtitle={`${money(sum(unpaid.map((b) => b.amount)))} upcoming`}
        right={app.canManage ? <Button size="sm" onClick={actions.addBill}><Plus className="h-4 w-4" />Add</Button> : undefined} />
      <div className="space-y-6 px-4 pt-2 pb-6">
        <section aria-label="Upcoming bills">
          <h2 className="mb-2.5 px-1 text-[15px] font-bold">Upcoming</h2>
          {unpaid.length === 0 ? (
            <EmptyState icon={<CalendarClock className="h-7 w-7" />} title="No bills due" description={app.canManage ? "Add rent, electricity, internet and more." : "The owner or an admin can add household bills."} actionLabel={app.canManage ? "Add bill" : undefined} onAction={actions.addBill} />
          ) : (
            <div className="space-y-2.5"><AnimatePresence initial={false}>{unpaid.map((b) => <BillCard key={b.id} bill={b} onPay={actions.payBill} onDelete={app.canManage ? (x) => run(() => billService.remove(x.id), "Bill removed") : undefined} />)}</AnimatePresence></div>
          )}
        </section>
        {paid.length > 0 && (
          <section aria-label="Paid bills">
            <h2 className="mb-2.5 px-1 text-[15px] font-bold">Paid</h2>
            <div className="space-y-2.5">{paid.map((b) => <BillCard key={b.id} bill={b} compact />)}</div>
          </section>
        )}
      </div>
    </div>
  );
}
