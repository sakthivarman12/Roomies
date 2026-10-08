"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Repeat } from "lucide-react";
import { CategoryBubble } from "@/components/expenses/ExpenseCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { daysFromNow, dueLabel, money, shortDate } from "@/lib/format";
import type { Bill } from "@/types";

export function BillCard({ bill, onPay, onDelete, compact }: { bill: Bill; onPay?: (b: Bill) => void; onDelete?: (b: Bill) => void; compact?: boolean }) {
  const days = daysFromNow(bill.dueDate);
  const overdue = !bill.paid && days < 0;
  const soon = !bill.paid && days >= 0 && days <= 5;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center gap-3.5 rounded-3xl border bg-surface p-3.5 shadow-card ${overdue ? "border-danger/40" : "border-line"}`}>
      <CategoryBubble category={bill.category} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-[15px] font-bold">{bill.title}{bill.recurring && <Repeat className="h-3.5 w-3.5 text-muted" aria-label="Recurring" />}</p>
        <p className={`truncate text-xs font-semibold ${overdue ? "text-danger" : soon ? "text-warning" : "text-muted"}`}>
          {bill.paid ? `Paid · due ${shortDate(bill.dueDate)}` : dueLabel(bill.dueDate)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="tnum text-[15px] font-extrabold">{money(bill.amount)}</p>
        {bill.paid ? (
          <Badge tone="success" className="mt-1" icon={<CheckCircle2 className="h-3 w-3" />}>Paid</Badge>
        ) : onPay ? (
          <Button size="sm" className="mt-1 h-8 min-h-[44px] px-3 sm:min-h-0" onClick={() => onPay(bill)}>Pay</Button>
        ) : (
          <Badge tone={overdue ? "danger" : "warning"} className="mt-1">{overdue ? "Overdue" : "Upcoming"}</Badge>
        )}
        {!compact && onDelete && <button onClick={() => onDelete(bill)} className="mt-1 block min-h-[44px] w-full text-[11px] font-semibold text-muted hover:text-danger">Remove</button>}
      </div>
    </motion.div>
  );
}
