"use client";

import { Check, Copy, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Fields";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useAction } from "@/hooks/useAction";
import { useApp } from "@/hooks/useApp";
import { useGuard } from "@/hooks/useGuard";
import type { MemberKind } from "@/types";
import { roomService } from "@/lib/services";

export default function RoommatesStep() {
  const ok = useGuard("needs-household");
  const app = useApp();
  const router = useRouter();
  const run = useAction();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<MemberKind>("resident");
  const [copied, setCopied] = useState(false);
  if (!ok || !app) return null;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const res = run(() => roomService.addMember(app.household.id, { name, email, kind }), `${name || (kind === "guest" ? "Friend" : "Roommate")} added`);
    if (res) { setName(""); setEmail(""); setKind("resident"); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(app.household.inviteCode); } catch { /* clipboard unavailable */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <AuthShell title="Invite your roommates" subtitle="Share the code, or add people directly. Everyone logs in separately." step={2} wide>
      <Card className="bg-gradient-to-br from-primary-soft to-surface">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Invite code</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-3xl font-black tracking-[0.12em] text-primary">{app.household.inviteCode}</p>
          <Button variant="secondary" size="sm" onClick={copy}>{copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy"}</Button>
        </div>
      </Card>

      <form onSubmit={add} className="mt-5 space-y-3" noValidate>
        <SegmentedControl<MemberKind> label="Is this a roommate or a friend?" value={kind} onChange={setKind} options={[{ value: "resident", label: "Roommate" }, { value: "guest", label: "Friend (visiting)" }]} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Devi" />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="devi@mail.com" />
        </div>
        <Button type="submit" variant="soft" block><UserPlus className="h-4 w-4" />Add roommate</Button>
        <p className="px-1 text-xs text-muted">Prototype note: new roommates start with the password <b>roomies123</b>.</p>
      </form>

      <section className="mt-6" aria-label="Current members">
        <h2 className="mb-2 px-1 text-sm font-bold">In {app.household.name}</h2>
        <ul className="space-y-2">
          {app.members.map(({ user, member }) => (
            <li key={user.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
              <Avatar user={user} size="sm" />
              <div className="flex-1"><p className="text-sm font-bold">{user.name}{user.id === app.user.id && " (you)"}</p><p className="text-xs text-muted">{user.email}</p></div>
              <span className="text-[11px] font-bold text-muted">{member.role}</span>
            </li>
          ))}
        </ul>
      </section>
      <Button size="lg" block className="mt-6" onClick={() => router.push("/onboarding/preferences")}>Continue</Button>
    </AuthShell>
  );
}
