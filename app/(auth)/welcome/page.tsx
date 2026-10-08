"use client";

import { motion } from "framer-motion";
import { Receipt, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
import { TAGLINE } from "@/lib/constants";
import { useGuard } from "@/hooks/useGuard";

const POINTS = [
  { icon: Receipt, title: "Split anything", text: "Rent, bills and groceries — equal, percentage or custom." },
  { icon: Users, title: "Everyone has a login", text: "Each roommate sees their own balance, privately and clearly." },
  { icon: Sparkles, title: "Settle in a tap", text: "Pay back with UPI, cash or bank transfer and get a receipt." },
];

export default function WelcomePage() {
  const ok = useGuard("guest-only");
  if (!ok) return null;
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
        <LogoMark className="h-16 w-16 shadow-float" />
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8 text-[40px] font-black leading-[1.05] tracking-tight">
        Live together.<br /><span className="text-primary">Split smarter.</span>
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-3 text-[15px] text-muted">
        {TAGLINE} Rent, bills, chores and shared spending for your household — all in one place.
      </motion.p>
      <ul className="mt-9 space-y-3">
        {POINTS.map((p, i) => (
          <motion.li key={p.title} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-start gap-3.5 rounded-3xl border border-line bg-surface p-4 shadow-card">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary"><p.icon className="h-5 w-5" /></span>
            <div><p className="font-bold">{p.title}</p><p className="text-sm text-muted">{p.text}</p></div>
          </motion.li>
        ))}
      </ul>
      <div className="mt-auto space-y-3 pt-10">
        <Link href="/signup" className="block"><Button size="lg" block>Create account</Button></Link>
        <Link href="/login" className="block"><Button size="lg" variant="secondary" block>I already have an account</Button></Link>
      </div>
    </main>
  );
}
