"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_COLOR } from "@/lib/constants";
import { money, shortDate } from "@/lib/format";
import { CATEGORY_ICON } from "@/lib/icons";
import type { Expense, ExpenseCategory } from "@/types";

export function CategoryBubble({ category, size = 44 }: { category: ExpenseCategory; size?: number }) {
  const Icon = CATEGORY_ICON[category];
  return (
    <span aria-hidden className="flex shrink-0 items-center justify-center rounded-2xl" style={{ width: size, height: size, background: `color-mix(in srgb, ${CATEGORY_COLOR[category]} 16%, transparent)`, color: CATEGORY_COLOR[category] }}>
      <Icon style={{ width: size * 0.48, height: size * 0.48 }} />
    </span>
  );
}

export function ExpenseCard({ expense, myId, payerName, index = 0 }: { expense: Expense; myId: string; payerName: string; index?: number }) {
  const myShare = expense.splits.find((s) => s.userId === myId)?.amount ?? 0;
  const paidByMe = expense.paidBy === myId;
  const net = paidByMe ? expense.amount - myShare : -myShare;
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 28, delay: Math.min(index, 8) * 0.03 }}>
      <Link href={`/expenses/${expense.id}`} className="flex min-h-[72px] items-center gap-3.5 rounded-3xl border border-line bg-surface p-3.5 shadow-card transition-all hover:shadow-float active:scale-[0.99]">
        <CategoryBubble category={expense.category} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold">{expense.title}</p>
          <p className="truncate text-xs text-muted">{paidByMe ? "You" : payerName} paid · {shortDate(expense.date)} · {expense.splits.length} {expense.splits.length === 1 ? "person" : "people"}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="tnum text-[15px] font-extrabold">{money(expense.amount)}</p>
          {net > 0 ? <Badge tone="success" className="mt-1">+{money(net)}</Badge>
            : net < 0 ? <Badge tone="danger" className="mt-1">You owe {money(-net)}</Badge>
            : <Badge tone="neutral" className="mt-1">Not involved</Badge>}
        </div>
      </Link>
    </motion.div>
  );
}
