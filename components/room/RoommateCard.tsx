"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { money } from "@/lib/format";
import type { User } from "@/types";

interface Props {
  user: User;
  /** positive => they owe me, negative => I owe them */
  balance: number;
  onPay: () => void;
  onRequest: () => void;
  index?: number;
}

export function RoommateCard({ user, balance, onPay, onRequest, index = 0 }: Props) {
  const settled = Math.abs(balance) < 0.01;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26, delay: index * 0.05 }}
      className="w-[190px] shrink-0 rounded-[24px] border border-line bg-surface p-4 shadow-card"
    >
      <Link href={`/roommates/${user.id}`} className="flex items-center gap-3" aria-label={`View ${user.name}'s details`}>
        <Avatar user={user} size="md" />
        <p className="truncate text-[15px] font-extrabold">{user.name}</p>
      </Link>
      <div className="mt-4 min-h-[56px]">
        {settled ? (
          <><p className="text-xs font-semibold text-muted">Balance</p><Badge tone="success" className="mt-1.5">✓ Settled</Badge></>
        ) : balance < 0 ? (
          <><p className="text-xs font-semibold text-muted">You owe {user.name}</p><p className="tnum text-xl font-black text-danger">{money(-balance)}</p></>
        ) : (
          <><p className="text-xs font-semibold text-muted">{user.name} owes you</p><p className="tnum text-xl font-black text-success">{money(balance)}</p></>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        {settled ? (
          <Link href={`/roommates/${user.id}`} className="flex min-h-[40px] flex-1 items-center justify-center rounded-xl bg-surface2 text-[13px] font-bold">View details</Link>
        ) : balance < 0 ? (
          <Button size="sm" className="flex-1" onClick={onPay}>Pay</Button>
        ) : (
          <Button size="sm" variant="soft" className="flex-1" onClick={onRequest}>Request</Button>
        )}
      </div>
    </motion.div>
  );
}
