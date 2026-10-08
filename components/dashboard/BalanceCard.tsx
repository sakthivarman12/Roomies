"use client";

import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AnimatedNumber } from "@/components/ui/Progress";
import { useApp } from "@/hooks/useApp";
import { useActions } from "@/components/AppActions";
import { netBalance } from "@/lib/selectors";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

export function BalanceCard() {
  const app = useApp();
  const actions = useActions();
  if (!app) return null;
  const net = netBalance(app.db, app.household.id, app.user.id);
  const settled = Math.abs(net) < 0.01;
  const owe = net < 0;

  return (
    <Card className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted">My balance</p>
        {settled ? (
          <p className="mt-1 text-2xl font-black text-success">You&apos;re all settled</p>
        ) : (
          <>
            <p className="mt-1 text-[13px] font-semibold text-muted">{owe ? "You owe" : "You are owed"}</p>
            <p className={cn("tnum text-[32px] font-black leading-tight", owe ? "text-danger" : "text-success")}><AnimatedNumber value={Math.abs(net)} /></p>
          </>
        )}
        <p className="mt-0.5 text-xs text-muted">{settled ? "Nothing to pay or collect. Nice." : owe ? "Across your roommates" : "Your roommates owe you"}</p>
      </div>
      {owe ? (
        <button onClick={() => actions.settle()} className="flex min-h-[48px] items-center gap-1.5 rounded-2xl bg-primary px-4 text-sm font-extrabold text-primary-ink shadow-float">
          Settle up <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <div aria-hidden className={cn("flex h-14 w-14 items-center justify-center rounded-3xl text-xl font-black", settled ? "bg-success-soft text-success" : "bg-success-soft text-success")}>{settled ? "✓" : "₹"}</div>
      )}
      <span className="sr-only">{money(Math.abs(net))}</span>
    </Card>
  );
}
