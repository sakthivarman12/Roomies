"use client";

import { Copy, FileText, MapPin, Pencil, Plus, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useActions } from "@/components/AppActions";
import { BillCard } from "@/components/dashboard/BillCard";
import { InviteQR } from "@/components/room/InviteQR";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/BottomSheet";
import { Input } from "@/components/ui/Fields";
import { useAction } from "@/hooks/useAction";
import { useApp } from "@/hooks/useApp";
import { money, shortDate } from "@/lib/format";
import { houseService, roomService } from "@/lib/services";
import { useToast } from "@/components/ui/Toast";

export function HouseOverview() {
  const app = useApp();
  const actions = useActions();
  const run = useAction();
  const toast = useToast();
  const [rule, setRule] = useState("");
  const [docOpen, setDocOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docNote, setDocNote] = useState("");
  if (!app) return null;
  const { household } = app;
  const bills = app.db.bills.filter((b) => b.householdId === household.id && !b.paid).sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate)).slice(0, 3);
  const docs = app.db.documents.filter((d) => d.householdId === household.id);

  const copy = async () => {
    try { await navigator.clipboard.writeText(household.inviteCode); toast.show("Invite code copied"); } catch { toast.show(household.inviteCode, "info"); }
  };

  return (
    <div className="space-y-7">
      <Card>
        <div className="flex items-start justify-between">
          <div className="min-w-0"><h2 className="text-lg font-extrabold">{household.name}</h2>
            <p className="mt-1 flex items-start gap-1.5 text-sm text-muted"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{household.address || "No address added"}</p></div>
          {app.canManage && <Button size="sm" variant="secondary" onClick={actions.editHousehold}><Pencil className="h-4 w-4" />Edit</Button>}
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[["Rent", money(household.monthlyRent)], ["Due on", `${household.rentDueDay}th`], ["Rooms", String(household.rooms)]].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-surface2 p-3"><dt className="text-[11px] font-semibold text-muted">{k}</dt><dd className="tnum mt-0.5 text-[15px] font-extrabold">{v}</dd></div>
          ))}
        </dl>
        <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-primary-soft p-3.5">
          <div><p className="text-[11px] font-bold uppercase tracking-wider text-muted">Invite code</p><p className="text-xl font-black tracking-[0.12em] text-primary">{household.inviteCode}</p></div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={copy} aria-label="Copy invite code"><Copy className="h-4 w-4" /></Button>
            {app.canManage && <Button size="sm" variant="secondary" aria-label="Generate new invite code" onClick={() => run(() => roomService.regenerateInvite(household.id), "New invite code generated")}><RefreshCw className="h-4 w-4" /></Button>}
          </div>
        </div>
        <details className="mt-3 rounded-2xl bg-surface2 p-3.5">
          <summary className="cursor-pointer text-sm font-bold text-primary">Show QR code</summary>
          <p className="mt-2 text-xs text-muted">Roommates scan this with Roomies to join {household.name}.</p>
          <div className="mt-3 flex justify-center"><InviteQR code={household.inviteCode} /></div>
        </details>
      </Card>

      <section><SectionHeader title="Bills" action="All bills" href="/bills" />
        {bills.length === 0 ? <Card className="text-center text-sm text-muted">No upcoming bills.</Card> : <div className="space-y-2.5">{bills.map((b) => <BillCard key={b.id} bill={b} onPay={actions.payBill} compact />)}</div>}
      </section>

      <section><SectionHeader title="House rules" />
        <Card padded={false} className="divide-y divide-line">
          {household.rules.length === 0 && <p className="p-4 text-sm text-muted">No rules yet.</p>}
          {household.rules.map((r, i) => (
            <div key={`${r}-${i}`} className="flex items-center gap-3 p-3.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-black text-primary">{i + 1}</span>
              <p className="flex-1 text-sm font-medium">{r}</p>
              {app.canManage && <button onClick={() => run(() => houseService.removeRule(i))} aria-label={`Remove rule ${i + 1}`} className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"><X className="h-4 w-4" /></button>}</div>
          ))}
          {app.canManage && (
            <form className="flex gap-2 p-3" onSubmit={(e) => { e.preventDefault(); if (run(() => houseService.addRule(rule), "Rule added") !== undefined || rule.trim()) setRule(""); }}>
              <input aria-label="New rule" value={rule} onChange={(e) => setRule(e.target.value)} placeholder="Add a house rule…" className="min-h-[44px] flex-1 rounded-xl border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none" />
              <Button type="submit" size="sm" aria-label="Add rule"><Plus className="h-4 w-4" /></Button>
            </form>
          )}
        </Card>
      </section>

      <section><SectionHeader title="Important documents" action="Add" onAction={() => setDocOpen(true)} />
        <Card padded={false} className="divide-y divide-line">
          {docs.length === 0 && <p className="p-4 text-sm text-muted">No documents saved.</p>}
          {docs.map((d) => (
            <div key={d.id} className="flex items-center gap-3 p-3.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-soft text-info"><FileText className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{d.name}</p><p className="truncate text-xs text-muted">{d.note || "No note"} · {shortDate(d.createdAt)}</p></div>
              {app.canManage && <button onClick={() => run(() => houseService.removeDocument(d.id), "Document removed")} aria-label={`Remove ${d.name}`} className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"><X className="h-4 w-4" /></button>}</div>
          ))}
        </Card>
      </section>
      <p className="px-1 text-xs text-muted">Document files aren&apos;t uploaded in the local prototype — names and notes are stored. Supabase Storage will hold the files.</p>

      <Modal open={docOpen} onClose={() => setDocOpen(false)} title="Add document" description="Save the name and a note for now"
        footer={<Button block size="lg" onClick={() => { if (run(() => { houseService.addDocument(docName, docNote); return true; }, "Document saved")) { setDocOpen(false); setDocName(""); setDocNote(""); } }}>Save document</Button>}>
        <div className="space-y-4 pb-2"><Input label="Name" value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Rental agreement" /><Input label="Note" value={docNote} onChange={(e) => setDocNote(e.target.value)} placeholder="Where it's kept, expiry, etc." /></div>
      </Modal>
      <Link href="/analytics" className="block text-center text-sm font-bold text-primary">View household analytics →</Link>
    </div>
  );
}
