"use client";

import { motion } from "framer-motion";
import { Hourglass, ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/hooks/useApp";
import { useGuard } from "@/hooks/useGuard";
import { authService } from "@/lib/services";

export default function PendingPage() {
  const ok = useGuard("auth-only");
  const router = useRouter();
  const { db, user, household } = useSession();

  useEffect(() => { if (household) router.replace("/home"); }, [household, router]);

  if (!ok || !db || !user) return null;
  const mine = db.joinRequests.filter((r) => r.userId === user.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
  const rejected = mine?.status === "rejected";
  const h = mine ? db.households.find((x) => x.id === mine.householdId) : null;

  return (
    <AuthShell
      title={rejected ? "Request declined" : "Waiting for approval"}
      subtitle={h ? (rejected ? `The owner of ${h.name} didn't approve this request.` : `The owner of ${h.name} has been notified. You'll get in as soon as they approve you.`) : "Join a household with an invite code."}
    >
      <div className="flex flex-col items-center rounded-[28px] border border-line bg-surface p-8 text-center">
        <motion.div
          animate={rejected ? undefined : { rotate: [0, 180, 180, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={`flex h-20 w-20 items-center justify-center rounded-full ${rejected ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary"}`}
        >
          {rejected ? <ShieldX className="h-9 w-9" /> : <Hourglass className="h-9 w-9" />}
        </motion.div>
        <p className="mt-5 text-sm text-muted">{rejected ? "You can ask for a fresh invite code and try again." : "This page updates by itself once you're approved."}</p>
      </div>
      <div className="mt-6 space-y-3">
        <Button size="lg" variant="secondary" block onClick={() => router.replace("/household")}>{rejected ? "Try another invite code" : "Use a different code"}</Button>
        <Button size="lg" variant="ghost" block onClick={() => { authService.logout(); router.replace("/welcome"); }}>Log out</Button>
      </div>
    </AuthShell>
  );
}
