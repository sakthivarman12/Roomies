"use client";

import { Check, Eye, MapPin, PiggyBank, ReceiptText } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/Fields";
import { SegmentedControl } from "@/components/ui/Tabs";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/hooks/useApp";
import { useOnOpen } from "@/hooks/useOnOpen";
import { restrictionsOf } from "@/lib/access";
import { fromInputDate, toInputDate } from "@/lib/format";
import { roomService } from "@/lib/services";
import { FULL_ACCESS, GUEST_ACCESS, type MemberKind, type Restrictions, type User } from "@/types";

export interface AccessTarget {
  /** Pending join request being reviewed, or an existing member being edited. */
  requestId?: string;
  userId: string;
}

const OPTIONS: { key: keyof Restrictions; label: string; hint: string; icon: typeof Eye }[] = [
  { key: "seeFund", label: "Can see the room fund", hint: "Balance, contributions and spending from the common pot", icon: PiggyBank },
  { key: "seeAllExpenses", label: "Can see all expenses", hint: "Off = only expenses they're part of", icon: Eye },
  { key: "addExpenses", label: "Can add expenses", hint: "Add, split and pay bills", icon: ReceiptText },
  { key: "seeLocations", label: "Can see roommates' locations", hint: "The Map tab", icon: MapPin },
];

export function AccessSheet({ open, onClose, target }: { open: boolean; onClose: () => void; target: AccessTarget | null }) {
  const app = useApp();
  const toast = useToast();
  const [kind, setKind] = useState<MemberKind>("resident");
  const [access, setAccess] = useState<Restrictions>(FULL_ACCESS);
  const [until, setUntil] = useState("");
  const [error, setError] = useState("");

  const reviewing = Boolean(target?.requestId);
  const user: User | undefined = target ? app?.db.users.find((u) => u.id === target.userId) : undefined;

  useOnOpen(open, () => {
    if (!app || !target) return;
    const member = app.db.members.find((m) => m.userId === target.userId && m.householdId === app.household.id);
    const k = member?.kind ?? (target.requestId ? "guest" : "resident");
    setKind(k);
    setAccess(member ? restrictionsOf(app.db, target.userId, app.household.id) : k === "guest" ? GUEST_ACCESS : FULL_ACCESS);
    setUntil(member?.stayUntil ? toInputDate(member.stayUntil) : "");
    setError("");
  });

  if (!app || !target || !user) return null;

  const pickKind = (k: MemberKind) => { setKind(k); setAccess(k === "guest" ? GUEST_ACCESS : FULL_ACCESS); };
  const input = { kind, restrictions: access, stayUntil: kind === "guest" && until ? fromInputDate(until) : undefined };

  const save = () => {
    try {
      if (target.requestId) { roomService.approveRequest(target.requestId, input); toast.show(`${user.name} approved`); }
      else { roomService.updateMemberAccess(app.household.id, target.userId, input); toast.show("Access updated"); }
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't save."); }
  };
  const decline = () => {
    try { if (target.requestId) roomService.rejectRequest(target.requestId); toast.show(`${user.name}'s request declined`, "info"); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't decline."); }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={reviewing ? "New roommate request" : "Access & restrictions"} description={reviewing ? "Choose who they are and what they can see" : `What ${user.name} can see and do`}
      footer={reviewing ? (
        <div className="grid grid-cols-2 gap-2.5"><Button variant="secondary" onClick={decline}>Decline</Button><Button onClick={save}><Check className="h-4 w-4" />Approve</Button></div>
      ) : <Button size="lg" block onClick={save}>Save access</Button>}>
      <div className="space-y-5 pb-3 pt-2">
        <div className="flex items-center gap-3 rounded-2xl bg-surface2 p-3.5">
          <Avatar user={user} size="md" />
          <div className="min-w-0"><p className="truncate text-[15px] font-extrabold">{user.name}</p><p className="truncate text-xs text-muted">{user.email}{user.phone ? ` · ${user.phone}` : ""}</p></div>
        </div>
        <div className="space-y-2">
          <p className="px-1 text-[13px] font-semibold text-muted">They are a…</p>
          <SegmentedControl<MemberKind> label="Member type" value={kind} onChange={pickKind} options={[{ value: "resident", label: "Roommate" }, { value: "guest", label: "Friend (visiting)" }]} />
          <p className="px-1 text-xs text-muted">{kind === "guest" ? "Friends can chip in to the room fund and share chosen costs, but aren't charged for the monthly bills." : "Roommates share rent, Wi-Fi, water and the other recurring bills."}</p>
        </div>
        {kind === "guest" && <DatePicker label="Staying until (optional)" value={until} onChange={(e) => setUntil(e.target.value)} />}
        <ul className="space-y-2">
          {OPTIONS.map((o) => (
            <li key={o.key} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><o.icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-bold">{o.label}</p><p className="text-xs text-muted">{o.hint}</p></div>
              <Toggle label={o.label} checked={access[o.key]} onChange={(v) => setAccess((a) => ({ ...a, [o.key]: v }))} />
            </li>
          ))}
        </ul>
        {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
      </div>
    </BottomSheet>
  );
}
