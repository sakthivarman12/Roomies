"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { dateTime, money } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";
import type { Receipt as ReceiptData } from "@/types";

export type ReceiptProps = Pick<ReceiptData, "receiptNumber" | "date" | "household" | "description" | "amount" | "paidBy" | "splitDetails" | "status"> & {
  animated?: boolean;
  /** seconds to wait before the line-by-line reveal starts (after the paper slides out) */
  startDelay?: number;
};

const BARS = Array.from({ length: 46 }, (_, i) => ({ w: [1, 2, 1, 3, 1, 2, 2][i % 7], gap: [2, 1, 3, 1, 2][i % 5] }));

function Row({ children, index, animated, delay }: { children: React.ReactNode; index: number; animated: boolean; delay: number }) {
  if (!animated) return <div>{children}</div>;
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: delay + index * 0.09, duration: 0.3 }}>
      {children}
    </motion.div>
  );
}

const DASH = <div className="my-3 border-t-2 border-dashed border-neutral-300" aria-hidden />;

/** Thermal-style household receipt. Paper stays light in dark mode for realism. */
export function Receipt({ receiptNumber, date, household, description, amount, paidBy, splitDetails, status, animated = false, startDelay = 1.0 }: ReceiptProps) {
  const reduce = useReducedMotion();
  const anim = animated && !reduce;
  let i = 0;
  const next = () => i++;
  const stampDelay = startDelay + 0.09 * (6 + splitDetails.length) + 0.25;
  const stampTone = status === "SETTLED" ? "text-sky-600 border-sky-600" : "text-emerald-600 border-emerald-600";

  return (
    <div id="printable-receipt" className="receipt-edge relative w-full bg-[#fdfcf8] px-6 pb-9 pt-6 font-mono text-[12.5px] leading-relaxed text-neutral-800 shadow-[var(--shadow-lg)]">
      <Row index={next()} animated={anim} delay={startDelay}>
        <div className="text-center">
          <p className="text-2xl font-black tracking-[0.25em]">ROOMIES</p>
          <p className="mt-0.5 text-[10px] font-bold tracking-[0.2em] text-neutral-500">HOUSEHOLD EXPENSE RECEIPT</p>
        </div>
      </Row>
      {DASH}
      <Row index={next()} animated={anim} delay={startDelay}>
        <dl className="space-y-0.5">
          <div className="flex justify-between"><dt className="text-neutral-500">Transaction</dt><dd className="font-bold">{receiptNumber}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-500">Date</dt><dd>{dateTime(date)}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-500">Household</dt><dd className="font-bold">{household}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-500">Paid by</dt><dd className="font-bold">{paidBy}</dd></div>
        </dl>
      </Row>
      {DASH}
      <Row index={next()} animated={anim} delay={startDelay}>
        <div className="flex items-start justify-between gap-3">
          <span className="font-bold uppercase">{description}</span>
          <span className="tnum font-bold">{money(amount)}</span>
        </div>
      </Row>
      <Row index={next()} animated={anim} delay={startDelay}>
        <p className="mt-2 text-[10px] font-bold tracking-widest text-neutral-500">SPLIT</p>
      </Row>
      {splitDetails.map((s) => (
        <Row key={s.name + s.amount} index={next()} animated={anim} delay={startDelay}>
          <div className="flex justify-between"><span>{s.name}</span><span className="tnum">{money(s.amount)}</span></div>
        </Row>
      ))}
      {DASH}
      <Row index={next()} animated={anim} delay={startDelay}>
        <div className="flex items-end justify-between">
          <span className="text-sm font-black tracking-widest">TOTAL</span>
          <span className="tnum text-2xl font-black">
            {anim ? <AnimatedNumber value={amount} /> : money(amount)}
          </span>
        </div>
      </Row>
      <div className="relative mt-4 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest text-neutral-500">STATUS</span>
        <motion.span
          initial={anim ? { scale: 2.6, opacity: 0, rotate: -24 } : false}
          animate={{ scale: 1, opacity: 1, rotate: -8 }}
          transition={{ delay: anim ? stampDelay : 0, type: "spring", stiffness: 420, damping: 16 }}
          className={cn("inline-block rounded-md border-[3px] px-3 py-0.5 text-lg font-black tracking-[0.2em]", stampTone)}
        >
          {status}
        </motion.span>
      </div>
      {DASH}
      <motion.div
        aria-hidden
        className="flex h-12 items-stretch justify-center"
        initial={anim ? "hidden" : "show"}
        animate="show"
        transition={{ staggerChildren: 0.012, delayChildren: anim ? stampDelay + 0.2 : 0 }}
      >
        {BARS.map((b, idx) => (
          <motion.span
            key={idx}
            variants={{ hidden: { scaleY: 0, opacity: 0 }, show: { scaleY: 1, opacity: 1 } }}
            style={{ width: b.w, marginRight: b.gap, originY: 1 }}
            className="bg-neutral-900"
          />
        ))}
      </motion.div>
      <p className="mt-1 text-center text-[10px] tracking-[0.3em] text-neutral-500">{receiptNumber}</p>
      <p className="mt-3 text-center text-[10px] text-neutral-500">Live together. Split smarter.</p>
    </div>
  );
}
