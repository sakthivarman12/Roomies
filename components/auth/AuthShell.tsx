"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { StepDots } from "@/components/ui/Progress";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  back?: boolean | string;
  step?: number;
  wide?: boolean;
}

export function AuthShell({ title, subtitle, children, back, step, wide }: AuthShellProps) {
  const router = useRouter();
  return (
    <main className="relative mx-auto flex min-h-dvh w-full flex-col overflow-hidden px-5 pb-8 pt-[max(1rem,env(safe-area-inset-top))] md:items-center md:justify-center md:py-10">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-success/10 blur-3xl" />
      <div className={`relative z-10 mx-auto w-full ${wide ? "max-w-lg" : "max-w-md"}`}>
        <div className="mb-6 flex h-11 items-center justify-between">
          {back ? (
            <IconButton label="Go back" tone="filled" onClick={() => (typeof back === "string" ? router.push(back) : router.back())}>
              <ArrowLeft className="h-5 w-5" />
            </IconButton>
          ) : <Logo />}
          {step !== undefined && <StepDots total={4} current={step} />}
        </div>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 240, damping: 26 }}>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[15px] text-muted">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </motion.div>
      </div>
    </main>
  );
}
