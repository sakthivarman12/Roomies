"use client";

import { Bell, ChevronRight, Globe, IndianRupee, KeyRound, LogOut, Moon, RotateCcw, ShieldCheck, UserRound, DoorOpen, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useActions } from "@/components/AppActions";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/BottomSheet";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventsPanel } from "@/components/profile/EventsPanel";
import { GalleryPanel } from "@/components/profile/GalleryPanel";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { Toggle } from "@/components/ui/Toggle";
import { useAction } from "@/hooks/useAction";
import { useApp } from "@/hooks/useApp";
import { authService, devService, roomService } from "@/lib/services";

function Row({ icon, title, hint, children, onClick }: { icon: React.ReactNode; title: string; hint?: string; children?: React.ReactNode; onClick?: () => void }) {
  const inner = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface2 text-ink">{icon}</span>
      <span className="min-w-0 flex-1 text-left"><span className="block text-[15px] font-bold">{title}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</span>
      {children ?? (onClick ? <ChevronRight className="h-5 w-5 text-muted" /> : null)}
    </>
  );
  return onClick ? <button onClick={onClick} className="flex min-h-[64px] w-full items-center gap-3.5 px-4 py-2.5">{inner}</button> : <div className="flex min-h-[64px] items-center gap-3.5 px-4 py-2.5">{inner}</div>;
}

type ProfileTab = "settings" | "events" | "gallery";

export default function ProfilePage() {
  const app = useApp();
  const actions = useActions();
  const router = useRouter();
  const run = useAction();
  const [confirm, setConfirm] = useState<"logout" | "leave" | "reset" | null>(null);
  const [soon, setSoon] = useState<string | null>(null);
  const [tab, setTab] = useState<ProfileTab>("settings");
  const toast = useToast();
  const taps = useRef<number[]>([]);
  if (!app) return null;

  /** Triple-tapping the Gallery tab toggles the private hidden folder. */
  const onTab = (next: ProfileTab) => {
    setTab(next);
    if (next !== "gallery") { taps.current = []; return; }
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 800), now];
    if (taps.current.length >= 3) {
      taps.current = [];
      const unlock = !app.prefs.hiddenUnlocked;
      authService.updatePrefs({ hiddenUnlocked: unlock });
      toast.show(unlock ? "Hidden folder unlocked" : "Hidden folder locked", "info");
    }
  };
  const { user, prefs, household } = app;

  return (
    <div>
      <PageHeader title="Profile" />
      <div className="px-4 pb-1 pt-1">
        <Tabs<ProfileTab> label="Profile sections" value={tab} onChange={onTab} options={[
          { value: "settings", label: "Settings" }, { value: "events", label: "Events" }, { value: "gallery", label: "Gallery" },
        ]} />
      </div>
      {tab === "events" && <div className="px-4 pb-6 pt-3"><EventsPanel /></div>}
      {tab === "gallery" && <div className="px-4 pb-6 pt-3"><GalleryPanel /></div>}
      {tab === "settings" && (
      <div className="space-y-5 px-4 pt-2 pb-6">
        <Card className="flex items-center gap-4">
          <Avatar user={user} size="xl" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-extrabold">{user.name}</h2>
            <p className="truncate text-sm text-muted">{user.email}</p>
            {user.phone && <p className="text-sm text-muted">{user.phone}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5"><Badge tone={app.isOwner ? "violet" : app.canManage ? "info" : "neutral"}>{app.role}</Badge><Badge tone="info">{household.name}</Badge></div>
          </div>
        </Card>
        <Button variant="secondary" block onClick={actions.editProfile}><UserRound className="h-4 w-4" />Edit profile</Button>

        {app.canManage && (
          <Card padded={false} className="divide-y divide-line">
            <p className="px-4 pt-3.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted">{app.isOwner ? "Owner" : "Admin"} controls</p>
            <Row icon={<Users className="h-5 w-5" />} title="Manage members" hint="Add, remove, change roles" onClick={() => router.push("/house")} />
            <Row icon={<IndianRupee className="h-5 w-5" />} title="Edit household" hint="Rent, due date, address" onClick={actions.editHousehold} />
            <Row icon={<KeyRound className="h-5 w-5" />} title="Invite code" hint={household.inviteCode} onClick={() => run(() => roomService.regenerateInvite(household.id), "New invite code generated")} />
          </Card>
        )}

        <Card padded={false} className="divide-y divide-line">
          <Row icon={<Users className="h-5 w-5" />} title="Households" hint={`${app.households.length} · ${household.name} active`} onClick={actions.switchHousehold} />
          <Row icon={<Moon className="h-5 w-5" />} title="Dark mode"><Toggle label="Dark mode" checked={prefs.darkMode} onChange={(v) => authService.updatePrefs({ darkMode: v })} /></Row>
          <Row icon={<Bell className="h-5 w-5" />} title="Notifications" hint="Bills, payments, chores"><Toggle label="Notifications" checked={prefs.notifications} onChange={(v) => authService.updatePrefs({ notifications: v })} /></Row>
          <Row icon={<IndianRupee className="h-5 w-5" />} title="Currency" hint="Indian Rupee (₹)" />
          <Row icon={<Globe className="h-5 w-5" />} title="Language" hint="English" onClick={() => setSoon("More languages are coming soon.")} />
          <Row icon={<ShieldCheck className="h-5 w-5" />} title="Privacy" hint="Your data stays on this device" onClick={() => setSoon("In this local prototype all data lives only in this browser. Household data is isolated per household.")} />
          <Row icon={<KeyRound className="h-5 w-5" />} title="Security" hint="Change password" onClick={actions.changePassword} />
        </Card>

        <Card padded={false} className="divide-y divide-line">
          <p className="px-4 pt-3.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted">Developer</p>
          <Row icon={<RotateCcw className="h-5 w-5" />} title="Reset demo data" hint="Restore Green Villa sample data" onClick={() => setConfirm("reset")} />
        </Card>

        <div className="space-y-2.5">
          <Button variant="secondary" block onClick={() => setConfirm("logout")}><LogOut className="h-4 w-4" />Log out</Button>
          <Button variant="ghost" block className="text-danger" onClick={() => setConfirm("leave")}><DoorOpen className="h-4 w-4" />Leave household</Button>
        </div>
        <p className="text-center text-xs text-muted">Roomies · Live together. Split smarter. · v0.1 local</p>
        <Link href="/analytics" className="block text-center text-sm font-bold text-primary">Household analytics →</Link>
      </div>
      )}

      <Modal open={confirm !== null} onClose={() => setConfirm(null)}
        title={confirm === "logout" ? "Log out?" : confirm === "leave" ? `Leave ${household.name}?` : "Reset demo data?"}
        description={confirm === "reset" ? "This replaces everything in this browser with the original sample data." : confirm === "leave" ? "You'll lose access to this household's data." : "You can log back in any time."}
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant={confirm === "logout" ? "primary" : "danger"} onClick={() => {
            const which = confirm; setConfirm(null);
            if (which === "logout") { authService.logout(); router.replace("/welcome"); }
            if (which === "reset") { devService.resetDemoData(); router.replace("/welcome"); }
            if (which === "leave") { const ok = run(() => { roomService.leaveHousehold(household.id); return true; }, "You left the household"); if (ok) router.replace("/household"); }
          }}>{confirm === "logout" ? "Log out" : confirm === "leave" ? "Leave" : "Reset"}</Button></div>}>
        <span />
      </Modal>
      <Modal open={soon !== null} onClose={() => setSoon(null)} title="Info" footer={<Button block onClick={() => setSoon(null)}>Got it</Button>}><p className="pb-2 text-sm text-muted">{soon}</p></Modal>
    </div>
  );
}
