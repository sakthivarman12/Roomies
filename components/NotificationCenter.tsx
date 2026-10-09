"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useApp } from "@/hooks/useApp";
import { NOTIFICATION_ICON } from "@/lib/icons";
import { DEFAULT_NOTIFY } from "@/lib/notifyPrefs";
import { registerServiceWorker, showSystemNotification } from "@/lib/notify";
import { playTone, vibrate } from "@/lib/tones";
import { useTheme } from "@/lib/theme";
import { notificationService } from "@/lib/services";
import type { AppNotification, NotificationType, PopupStyle } from "@/types";

const ROUTES: Record<NotificationType, string> = {
  expense_added: "/expenses", expense_split: "/expenses", payment_received: "/transactions", payment_requested: "/home",
  chore_assigned: "/chores", chore_overdue: "/chores", bill_reminder: "/bills", announcement: "/house", join_request: "/profile", fund: "/fund",
};

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({ angle: (i / 16) * Math.PI * 2, dist: 60 + (i % 3) * 22, size: 6 + (i % 4) * 2, hue: i % 4 }));
const CONFETTI = ["var(--primary)", "var(--c-amber)", "var(--c-pink)", "var(--c-green)"];

function Balloon() {
  return (
    <svg width="64" height="96" viewBox="0 0 64 96" aria-hidden>
      <defs>
        <radialGradient id="bal" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity=".85" />
          <stop offset=".25" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--hero-from)" />
        </radialGradient>
      </defs>
      <path d="M32 90c-3-8 3-14 0-22" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".6" />
      <path d="M32 66l-5 7h10z" fill="var(--hero-from)" />
      <ellipse cx="32" cy="34" rx="26" ry="32" fill="url(#bal)" />
      <ellipse cx="22" cy="20" rx="6" ry="10" fill="#fff" opacity=".35" transform="rotate(-25 22 20)" />
    </svg>
  );
}

function Burst({ kind }: { kind: "pop" | "blast" }) {
  const scale = kind === "blast" ? 1.7 : 1;
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-16 h-0 w-0">
      <motion.span className="absolute -left-10 -top-10 h-20 w-20 rounded-full border-4 border-primary" initial={{ scale: 0.2, opacity: 0.9 }} animate={{ scale: 2.2 * scale, opacity: 0 }} transition={{ duration: 0.55 }} />
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, background: CONFETTI[p.hue], left: -p.size / 2, top: -p.size / 2 }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: Math.cos(p.angle) * p.dist * scale, y: Math.sin(p.angle) * p.dist * scale + 18, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function PopupCard({ n, style, onClose }: { n: AppNotification; style: PopupStyle; onClose: () => void }) {
  const app = useApp();
  const router = useRouter();
  const Icon = NOTIFICATION_ICON[n.type];
  const [phase, setPhase] = useState<"fly" | "card">(style === "balloon" ? "fly" : "card");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (style === "balloon") timers.push(setTimeout(() => setPhase("card"), 1250));
    timers.push(setTimeout(onClose, (style === "balloon" ? 1250 : 0) + 5200));
    return () => timers.forEach(clearTimeout);
  }, [style, onClose]);

  const sender = app?.members.find((m) => n.description.startsWith(m.user.name))?.user;

  const open = () => {
    void notificationService.markRead(n.id);
    onClose();
    router.push(ROUTES[n.type] ?? "/notifications");
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-dvh overflow-hidden">
      <AnimatePresence>
        {phase === "fly" && (
          <motion.div
            key="balloon" className="absolute left-1/2 top-0 -ml-8 text-ink"
            initial={{ y: "92vh", x: 0, opacity: 1, scale: 1 }}
            animate={{ y: 40, x: [0, -26, 22, -16, 0], scale: 1 }}
            exit={{ scale: 1.9, opacity: 0, transition: { duration: 0.16 } }}
            transition={{ y: { duration: 1.2, ease: [0.3, 0.6, 0.3, 1] }, x: { duration: 1.2, times: [0, 0.25, 0.55, 0.8, 1] } }}
          >
            <motion.div animate={{ rotate: [-6, 6, -4, 3, 0] }} transition={{ duration: 1.2 }}><Balloon /></motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {phase === "card" && style !== "banner" && <Burst kind={style === "blast" ? "blast" : "pop"} />}
      <AnimatePresence>
        {phase === "card" && (
          <motion.div
            key="card" role="alert"
            className="pointer-events-auto absolute inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] mx-auto w-[calc(100%-1.5rem)] max-w-md"
            initial={style === "banner" ? { y: -120, opacity: 0 } : { scale: 0.2, y: 20, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -140, opacity: 0, transition: { duration: 0.28 } }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            drag="y" dragConstraints={{ top: -200, bottom: 0 }} dragElastic={0.3}
            onDragEnd={(_, info) => { if (info.offset.y < -40) onClose(); }}
          >
            <button onClick={open} className="flex w-full items-center gap-3 rounded-3xl border border-line bg-strong/90 p-3.5 text-left shadow-[var(--shadow-lg)] backdrop-blur-xl">
              <span className="relative">
                {sender ? <Avatar user={sender} size="md" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary"><Icon className="h-5 w-5" /></span>}
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-ink ring-2 ring-[var(--surface-strong)]"><Icon className="h-3 w-3" /></span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-extrabold">{n.title}</span><span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-primary">Roomies · now</span></span>
                <span className="mt-0.5 line-clamp-2 block text-[13px] text-muted">{n.description}</span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Watches for new notifications: tone, vibration, in-app balloon/blast popup, and device notification panel. */
export function NotificationCenter() {
  const app = useApp();
  const theme = useTheme();
  const seen = useRef<Set<string> | null>(null);
  const [queue, setQueue] = useState<AppNotification[]>([]);
  const current = queue[0] ?? null;

  useEffect(() => { void registerServiceWorker(); }, []);

  const mine = app ? app.db.notifications.filter((n) => n.userId === app.user.id && n.householdId === app.household.id) : null;
  const enabled = app?.prefs.notifications ?? false;
  const notify = { ...DEFAULT_NOTIFY, ...app?.prefs.notify };
  const { tone, volume, vibrate: doVibrate, popup, system } = notify;
  const reduceStyle: PopupStyle = theme.motion === "full" ? popup : popup === "off" ? "off" : "banner";

  useEffect(() => {
    if (!mine) return;
    if (seen.current === null) { seen.current = new Set(mine.map((n) => n.id)); return; }
    const fresh = mine.filter((n) => !seen.current!.has(n.id));
    if (!fresh.length) return;
    fresh.forEach((n) => seen.current!.add(n.id));
    if (!enabled) return;
    const unread = fresh.filter((n) => !n.read).reverse();
    if (!unread.length) return;
    playTone(tone, volume);
    if (doVibrate) vibrate();
    const hidden = document.visibilityState !== "visible";
    if (system && hidden) {
      unread.forEach((n) => void showSystemNotification(n.title, n.description, ROUTES[n.type], n.id));
    }
    if (!hidden && reduceStyle !== "off") setQueue((q) => [...q, ...unread]);
  }, [mine, enabled, tone, volume, doVibrate, system, reduceStyle]);

  const close = useCallback(() => setQueue((q) => q.slice(1)), []);

  if (!current) return null;
  return <PopupCard key={current.id} n={current} style={reduceStyle === "off" ? "banner" : reduceStyle} onClose={close} />;
}
