"use client";

import { Crown, MoreVertical, ShieldCheck, UserMinus, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useActions } from "@/components/AppActions";
import { ContactButtons } from "@/components/room/ContactButtons";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/BottomSheet";
import { Card } from "@/components/ui/Card";
import { useAction } from "@/hooks/useAction";
import { useApp } from "@/hooks/useApp";
import { money, relativeTime } from "@/lib/format";
import { netBalance } from "@/lib/selectors";
import { roomService, transferOwnership } from "@/lib/services";
import { roleLabel } from "@/lib/roleLabel";
import { PROTECTED_EMAIL } from "@/lib/constants";
import type { Role } from "@/types";

const ROLE_TONE = { OWNER: "violet", ADMIN: "info", MEMBER: "neutral" } as const;

export function RoommatesPanel() {
  const app = useApp();
  const actions = useActions();
  const run = useAction();
  const [manage, setManage] = useState<string | null>(null);
  if (!app) return null;
  const target = manage ? app.members.find((m) => m.user.id === manage) : null;

  const lastActivity = (userId: string): string => {
    const dates = [
      ...app.db.expenses.filter((e) => e.householdId === app.household.id && e.paidBy === userId).map((e) => e.createdAt),
      ...app.db.payments.filter((p) => p.householdId === app.household.id && p.fromUserId === userId).map((p) => p.createdAt),
    ].sort().reverse();
    return dates[0] ? relativeTime(dates[0]) : "No activity yet";
  };

  return (
    <div className="space-y-3">
      {app.canManage && <Button variant="soft" block onClick={actions.addMember}><UserPlus className="h-4 w-4" />Add roommate</Button>}
      {app.members.map(({ user, member }) => {
        const net = netBalance(app.db, app.household.id, user.id);
        const chores = app.db.chores.filter((c) => c.householdId === app.household.id && c.assignedTo === user.id && !c.completed).length;
        return (
          <Card key={user.id} className="flex items-center gap-3 !p-3.5">
            <Link href={`/roommates/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3.5" aria-label={`Open ${user.name}'s profile`}>
              <Avatar user={user} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-[15px] font-extrabold">{user.name}{user.id === app.user.id && <span className="text-xs font-semibold text-muted">(you)</span>}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {member.kind === "guest" && <Badge tone="warning">Friend</Badge>}
                  <Badge tone={ROLE_TONE[member.role]} icon={member.role === "OWNER" ? <Crown className="h-3 w-3" /> : member.role === "ADMIN" ? <ShieldCheck className="h-3 w-3" /> : undefined}>{roleLabel(member.role)}</Badge>
                  <span className={`tnum text-xs font-bold ${Math.abs(net) < 0.01 ? "text-success" : net > 0 ? "text-success" : "text-danger"}`}>{Math.abs(net) < 0.01 ? "Settled" : net > 0 ? `Owed ${money(net)}` : `Owes ${money(-net)}`}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted">{chores} chore{chores === 1 ? "" : "s"} · Last active {lastActivity(user.id)}</p>
              </div>
            </Link>
            {user.id !== app.user.id && <ContactButtons name={user.name} phone={user.phone} size="sm" className="shrink-0" />}
            {app.canManage && user.id !== app.user.id && user.email.toLowerCase() !== PROTECTED_EMAIL && (
              <button onClick={() => setManage(user.id)} aria-label={`Manage ${user.name}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface2"><MoreVertical className="h-5 w-5" /></button>
            )}
          </Card>
        );
      })}

      <Modal open={Boolean(target)} onClose={() => setManage(null)} title={target ? `Manage ${target.user.name}` : ""} description={target ? `${target.user.email} · ${target.member.role}` : ""}>
        {target && (
          <div className="space-y-2.5 pb-3">
            {app.isOwner && (
              <>
                {(["MEMBER", "ADMIN", "OWNER"] as Role[]).map((r) => (
                  <Button key={r} variant={target.member.role === r ? "soft" : "secondary"} block disabled={target.member.role === r}
                    onClick={() => { run(() => roomService.changeRole(app.household.id, target.user.id, r), `${target.user.name} is now ${r === "OWNER" ? "RM" : r === "ADMIN" ? "an admin" : "a member"}`); setManage(null); }}>
                    {target.member.role === r ? `Currently ${roleLabel(r)}` : `Make ${r === "OWNER" ? "RM" : r === "ADMIN" ? "admin" : "member"}`}
                  </Button>
                ))}
                <Button variant="secondary" block onClick={() => { run(() => transferOwnership(app.household.id, target.user.id), `${target.user.name} is the new owner`); setManage(null); }}><Crown className="h-4 w-4" />Transfer ownership</Button>
              </>
            )}
            <Button variant="secondary" block onClick={() => { actions.reviewAccess({ userId: target.user.id }); setManage(null); }}><ShieldCheck className="h-4 w-4" />Access &amp; restrictions</Button>
            <Button variant="danger" block onClick={() => { run(() => roomService.removeMember(app.household.id, target.user.id), `${target.user.name} removed`); setManage(null); }}><UserMinus className="h-4 w-4" />Remove from household</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
