"use client";

import { motion } from "framer-motion";
import { Bell, ChartNoAxesColumn, Home, House, Receipt, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppActionsProvider, useActions } from "@/components/AppActions";
import { RightPanel } from "@/components/dashboard/RightPanel";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { ScreenSkeleton } from "@/components/ui/States";
import { useApp } from "@/hooks/useApp";
import { useGuard } from "@/hooks/useGuard";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/chores", label: "Chores", icon: Sparkles },
  { href: "/house", label: "House", icon: House },
  { href: "/profile", label: "Profile", icon: User },
];
const EXTRA = [
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesColumn },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

function isActive(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`) || (href === "/house" && path.startsWith("/roommates")) || (href === "/expenses" && (path.startsWith("/transactions") || path.startsWith("/bills")));
}

function BottomNav({ path }: { path: string }) {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <ul className="flex w-full max-w-md items-center justify-between rounded-[28px] border border-line bg-surface/90 p-1.5 shadow-[var(--shadow-lg)] backdrop-blur-xl">
        {NAV.map((n) => {
          const active = isActive(path, n.href);
          return (
            <li key={n.href} className="flex-1">
              <Link href={n.href} aria-current={active ? "page" : undefined} className="relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-[22px]">
                {active && <motion.span layoutId="bottom-nav-pill" className="absolute inset-0 rounded-[22px] bg-primary" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
                <n.icon className={cn("relative h-[22px] w-[22px]", active ? "text-primary-ink" : "text-muted")} strokeWidth={active ? 2.4 : 1.9} />
                <span className={cn("relative text-[10.5px] font-bold", active ? "text-primary-ink" : "text-muted")}>{n.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Sidebar({ path }: { path: string }) {
  const app = useApp();
  const actions = useActions();
  const unread = app ? app.db.notifications.filter((n) => n.userId === app.user.id && n.householdId === app.household.id && !n.read).length : 0;
  return (
    <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
      <Logo className="px-2" />
      <button onClick={actions.switchHousehold} className="mt-6 flex min-h-[56px] items-center gap-3 rounded-2xl bg-surface2 px-3 text-left transition-colors hover:bg-primary-soft">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-ink">{app?.household.name[0]}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold">{app?.household.name}</span><span className="block text-[11px] text-muted">{app?.members.length} roommates · switch</span></span>
      </button>
      <nav aria-label="Main" className="mt-6 flex-1 space-y-1">
        {[...NAV.slice(0, 4), ...EXTRA, NAV[4]].map((n) => {
          const active = isActive(path, n.href);
          return (
            <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cn("relative flex min-h-[48px] items-center gap-3 rounded-2xl px-3.5 text-sm font-bold transition-colors", active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface2 hover:text-ink")}>
              <n.icon className="h-5 w-5" />
              {n.label}
              {n.href === "/notifications" && unread > 0 && <span className="ml-auto rounded-full bg-danger px-2 py-0.5 text-[10px] font-black text-white">{unread}</span>}
            </Link>
          );
        })}
      </nav>
      <button onClick={() => actions.addExpense()} className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-extrabold text-primary-ink shadow-float transition-all hover:brightness-110">+ Add expense</button>
      {app && (
        <Link href="/profile" className="mt-4 flex items-center gap-3 rounded-2xl p-2 hover:bg-surface2">
          <Avatar user={app.user} size="sm" />
          <span className="min-w-0"><span className="block truncate text-sm font-bold">{app.user.name}</span><span className="block text-[11px] text-muted">{app.role}</span></span>
        </Link>
      )}
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const ok = useGuard("needs-household");
  const path = usePathname();
  if (!ok) return <ScreenSkeleton />;
  return (
    <AppActionsProvider>
      <div className="flex min-h-dvh">
        <Sidebar path={path} />
        <div className="min-w-0 flex-1">
          <div className="mx-auto flex w-full max-w-[1180px] justify-center gap-8 xl:px-8">
            <main className="w-full max-w-[640px] pb-[calc(var(--nav-h)+2.5rem)] lg:pb-16">{children}</main>
            <RightPanel />
          </div>
        </div>
      </div>
      <BottomNav path={path} />
    </AppActionsProvider>
  );
}
