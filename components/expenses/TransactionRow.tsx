"use client";

import { ArrowDownLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { CategoryBubble } from "@/components/expenses/ExpenseCard";
import { money, shortDate } from "@/lib/format";
import type { Transaction } from "@/types";

export function TransactionRow({ tx, payerName, myId }: { tx: Transaction; payerName: string; myId: string }) {
  const content = (
    <div className="flex min-h-[68px] items-center gap-3.5 border-b border-line py-3 last:border-0">
      {tx.kind === "expense" && tx.category !== "Settlement" ? (
        <CategoryBubble category={tx.category} size={42} />
      ) : (
        <span aria-hidden className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl bg-success-soft text-success">
          {tx.net >= 0 ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{tx.title}</p>
        <p className="truncate text-xs text-muted">{shortDate(tx.date)} · {tx.category} · Paid by {tx.paidBy === myId ? "you" : payerName}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="tnum text-sm font-extrabold">{money(tx.amount)}</p>
        {tx.kind === "payment" ? (
          <Badge tone="info" className="mt-1">{tx.net > 0 ? "Received" : tx.net < 0 ? "Sent" : "Paid"}</Badge>
        ) : tx.settled ? (
          <Badge tone="success" className="mt-1" icon={<CheckCircle2 className="h-3 w-3" />}>Settled</Badge>
        ) : tx.net > 0 ? (
          <Badge tone="warning" className="mt-1">You&apos;re owed {money(tx.net)}</Badge>
        ) : (
          <Badge tone="danger" className="mt-1">You owe {money(-tx.net)}</Badge>
        )}
      </div>
    </div>
  );
  return tx.kind === "expense" ? <Link href={`/expenses/${tx.refId}`} className="block">{content}</Link> : content;
}
