"use client";

import { BellRing, Camera, Check, MapPin, Smartphone, Vibrate } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/Tabs";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/hooks/useApp";
import { DEFAULT_NOTIFY } from "@/lib/notifyPrefs";
import { permissionState, requestPermission, type PermissionKey, type PermState } from "@/lib/notify";
import { authService, notificationService } from "@/lib/services";
import { playTone, TONES, vibrate } from "@/lib/tones";
import { cn } from "@/lib/utils";
import type { NotifyPrefs, PopupStyle } from "@/types";

interface SheetProps { open: boolean; onClose: () => void }

const PERMS: { key: PermissionKey; label: string; why: string; icon: typeof BellRing }[] = [
  { key: "notifications", label: "Notifications", why: "Bills, payments, chores and house updates in your phone's notification panel.", icon: BellRing },
  { key: "location", label: "Location", why: "Show where roommates are on the Map (only when you choose to share).", icon: MapPin },
  { key: "camera", label: "Camera & microphone", why: "Capture photos and videos for stories and updates.", icon: Camera },
];

const STATE_LABEL: Record<PermState, { text: string; tone: "success" | "danger" | "warning" | "neutral" }> = {
  granted: { text: "Allowed", tone: "success" }, denied: { text: "Blocked", tone: "danger" },
  prompt: { text: "Not asked", tone: "warning" }, unsupported: { text: "Unsupported", tone: "neutral" },
};

export function usePermissionStates() {
  const [states, setStates] = useState<Record<PermissionKey, PermState>>({ notifications: "prompt", location: "prompt", camera: "prompt" });
  const refresh = useCallback(async () => {
    const [notifications, location, camera] = await Promise.all(PERMS.map((p) => permissionState(p.key)));
    setStates({ notifications, location, camera });
  }, []);
  useEffect(() => {
    let alive = true;
    Promise.all(PERMS.map((p) => permissionState(p.key))).then(([notifications, location, camera]) => {
      if (alive) setStates({ notifications, location, camera });
    });
    return () => { alive = false; };
  }, []);
  return { states, refresh };
}

export function PermissionsList({ onChanged }: { onChanged?: () => void }) {
  const toast = useToast();
  const { states, refresh } = usePermissionStates();

  const ask = async (key: PermissionKey) => {
    const res = await requestPermission(key);
    await refresh();
    onChanged?.();
    if (res === "denied") toast.show("Blocked — enable it in your browser or phone settings for this site.", "error");
  };
  const allowAll = async () => {
    for (const p of PERMS) if (states[p.key] !== "granted" && states[p.key] !== "unsupported") await ask(p.key);
  };

  return (
    <div className="space-y-3">
      <ul className="space-y-2.5">
        {PERMS.map((p) => {
          const st = STATE_LABEL[states[p.key]];
          return (
            <li key={p.key} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary"><p.icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-bold">{p.label}<Badge tone={st.tone}>{st.text}</Badge></p>
                <p className="mt-0.5 text-xs text-muted">{p.why}</p>
              </div>
              {states[p.key] !== "granted" && states[p.key] !== "unsupported" && <Button size="sm" variant="soft" onClick={() => void ask(p.key)}>Allow</Button>}
            </li>
          );
        })}
      </ul>
      <Button block onClick={() => void allowAll()}>Allow all</Button>
      <p className="flex items-start gap-2 px-1 text-xs text-muted"><Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
        Photos &amp; videos: browsers never give blanket access to your library — you pick exactly what to share each time, and Roomies keeps it in its own storage, never your camera roll. Drawing over other apps isn&apos;t possible on the web; install Roomies to your home screen so alerts reach your notification panel.</p>
    </div>
  );
}

export function PermissionsSheet({ open, onClose }: SheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Permissions" description="Allow what Roomies needs to work fully">
      <div className="pb-3 pt-2"><PermissionsList /></div>
    </BottomSheet>
  );
}

const POPUPS: { value: PopupStyle; label: string }[] = [
  { value: "balloon", label: "Balloon" }, { value: "blast", label: "Blast" }, { value: "banner", label: "Banner" }, { value: "off", label: "Off" },
];

export function NotificationSheet({ open, onClose }: SheetProps) {
  const app = useApp();
  const toast = useToast();
  const { states, refresh } = usePermissionStates();
  if (!app) return null;
  const n: NotifyPrefs = { ...DEFAULT_NOTIFY, ...app.prefs.notify };
  const set = (patch: Partial<NotifyPrefs>) => authService.updatePrefs({ notify: { ...app.prefs.notify, ...patch } });

  const test = async () => {
    if (states.notifications === "prompt") { await requestPermission("notifications"); await refresh(); }
    notificationService.sendTest();
    toast.show("Test sent — you'll hear and see it now", "info");
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Notifications" description="Tone, popup style and phone alerts"
      footer={<Button block size="lg" onClick={() => void test()}><BellRing className="h-4 w-4" />Send test notification</Button>}>
      <div className="space-y-6 pb-3 pt-2">
        <div className="flex items-center gap-3 rounded-2xl bg-surface2 p-3.5">
          <div className="flex-1"><p className="text-sm font-bold">Notifications</p><p className="text-xs text-muted">Master switch for all alerts</p></div>
          <Toggle label="Notifications" checked={app.prefs.notifications} onChange={(v) => authService.updatePrefs({ notifications: v })} />
        </div>

        <section className="space-y-2.5">
          <h3 className="px-1 text-sm font-extrabold">Tone</h3>
          <div role="radiogroup" aria-label="Notification tone" className="grid grid-cols-2 gap-2">
            {TONES.map((t) => (
              <button key={t.id} role="radio" aria-checked={n.tone === t.id} onClick={() => { set({ tone: t.id }); playTone(t.id, n.volume); }}
                className={cn("flex min-h-[48px] items-center justify-between rounded-2xl border px-4 text-sm font-semibold transition-colors", n.tone === t.id ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface")}>
                {t.label}{n.tone === t.id && <Check className="h-4 w-4" strokeWidth={3} />}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 px-1 text-xs font-semibold text-muted">Volume
            <input type="range" min={0} max={1} step={0.05} value={n.volume} aria-label="Volume" className="h-11 flex-1 accent-[var(--primary)]"
              onChange={(e) => set({ volume: Number(e.target.value) })} onPointerUp={() => playTone(n.tone, n.volume)} />
          </label>
          <div className="flex items-center gap-3 rounded-2xl bg-surface2 p-3.5">
            <Vibrate className="h-5 w-5 text-muted" /><div className="flex-1"><p className="text-sm font-bold">Vibrate</p><p className="text-xs text-muted">Phones only</p></div>
            <Toggle label="Vibrate" checked={n.vibrate} onChange={(v) => { set({ vibrate: v }); if (v) vibrate(); }} />
          </div>
        </section>

        <section className="space-y-2.5">
          <div className="px-1"><h3 className="text-sm font-extrabold">On-screen popup</h3><p className="text-xs text-muted">Shown when the app is open: a balloon floats up and pops, a confetti blast, or a simple banner.</p></div>
          <SegmentedControl<PopupStyle> label="Popup style" value={n.popup} onChange={(popup) => set({ popup })} options={POPUPS} />
        </section>

        <section className="space-y-2.5">
          <h3 className="px-1 text-sm font-extrabold">Phone notification panel</h3>
          <div className="flex items-center gap-3 rounded-2xl bg-surface2 p-3.5">
            <div className="flex-1"><p className="text-sm font-bold">Show in notification panel</p><p className="text-xs text-muted">When the app is in the background · {STATE_LABEL[states.notifications].text}</p></div>
            <Toggle label="Show in notification panel" checked={n.system} onChange={async (v) => { set({ system: v }); if (v && states.notifications !== "granted") { await requestPermission("notifications"); await refresh(); } }} />
          </div>
          <p className="px-1 text-xs text-muted">Prototype note: alerts are generated on this device while Roomies is open or installed. Alerts from roommates&apos; own devices need the Supabase + Web Push step.</p>
        </section>

        <section className="space-y-2.5"><h3 className="px-1 text-sm font-extrabold">Permissions</h3><PermissionsList onChanged={() => void refresh()} /></section>
      </div>
    </BottomSheet>
  );
}
