"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogoMark } from "@/components/ui/Logo";
import { TAGLINE } from "@/lib/constants";
import { useSession } from "@/hooks/useApp";

export default function Splash() {
  const router = useRouter();
  const { ready, user, household } = useSession();

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => router.replace(user ? (household ? "/home" : "/household") : "/welcome"), 1500);
    return () => clearTimeout(t);
  }, [ready, user, household, router]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] text-white">
      <div aria-hidden className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      <motion.div initial={{ scale: 0.4, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
        <LogoMark className="h-24 w-24 drop-shadow-2xl" />
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-5 text-4xl font-black tracking-tight">Roomies</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: 0.5 }} className="mt-2 text-[15px] font-medium">{TAGLINE}</motion.p>
      <motion.div initial={{ width: 0 }} animate={{ width: 96 }} transition={{ delay: 0.3, duration: 1.1 }} className="absolute bottom-16 h-1 rounded-full bg-white/70" />
    </main>
  );
}
