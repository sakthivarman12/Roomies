"use client";

import { Camera, Check, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOnOpen } from "@/hooks/useOnOpen";
import { Avatar } from "@/components/ui/Avatar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Fields";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/hooks/useApp";
import type { MemberKind } from "@/types";
import { authService, houseService, roomService } from "@/lib/services";
import { cn } from "@/lib/utils";

interface SheetProps { open: boolean; onClose: () => void }

function ErrorLine({ error }: { error: string }) {
  return error ? <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p> : null;
}

export function AnnouncementSheet({ open, onClose }: SheetProps) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  useOnOpen(open, () => { setTitle(""); setBody(""); setError(""); });
  const submit = () => {
    try { houseService.createAnnouncement(title, body); toast.show("Announcement posted"); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't post."); }
  };
  return (
    <BottomSheet open={open} onClose={onClose} title="New announcement" description="Everyone in the house will be notified"
      footer={<Button size="lg" block onClick={submit}>Post announcement</Button>}>
      <div className="space-y-4 pb-2 pt-2">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Water maintenance tomorrow" />
        <Textarea label="Message" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add the details…" />
        <ErrorLine error={error} />
      </div>
    </BottomSheet>
  );
}

export function MemberSheet({ open, onClose }: SheetProps) {
  const app = useApp();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<MemberKind>("resident");
  const [error, setError] = useState("");
  useOnOpen(open, () => { setName(""); setEmail(""); setKind("resident"); setError(""); });
  if (!app) return null;
  const submit = () => {
    try { roomService.addMember(app.household.id, { name, email, kind }); toast.show(`${name || (kind === "guest" ? "Friend" : "Roommate")} added`); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't add member."); }
  };
  return (
    <BottomSheet open={open} onClose={onClose} title="Add roommate" description={`Join ${app.household.name} directly, or share the code ${app.household.inviteCode}`}
      footer={<Button size="lg" block onClick={submit}>Add roommate</Button>}>
      <div className="space-y-4 pb-2 pt-2">
        <SegmentedControl<MemberKind> label="Is this a roommate or a friend?" value={kind} onChange={setKind} options={[{ value: "resident", label: "Roommate" }, { value: "guest", label: "Friend (visiting)" }]} />
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya" />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="priya@mail.com" />
        <p className="px-1 text-xs text-muted">Prototype: new accounts start with the password <b>roomies123</b>.</p>
        <ErrorLine error={error} />
      </div>
    </BottomSheet>
  );
}

async function resizePhoto(file: File): Promise<string> {
  const url = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); });
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const s = 256 / Math.min(img.width, img.height);
      const c = document.createElement("canvas"); c.width = 256; c.height = 256;
      const w = img.width * s, h = img.height * s;
      c.getContext("2d")?.drawImage(img, (256 - w) / 2, (256 - h) / 2, w, h);
      res(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => res(url);
    img.src = url;
  });
}

export function ProfileSheet({ open, onClose }: SheetProps) {
  const app = useApp();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", upiId: "" });
  const [photo, setPhoto] = useState<string | undefined>();
  const [error, setError] = useState("");
  useOnOpen(open, () => {
    if (app) { setForm({ name: app.user.name, email: app.user.email, phone: app.user.phone, upiId: app.user.upiId ?? "" }); setPhoto(app.user.photo); setError(""); }
  });
  if (!app) return null;
  const submit = () => {
    try { authService.updateProfile({ ...form, photo }); toast.show("Profile updated"); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't update profile."); }
  };
  return (
    <BottomSheet open={open} onClose={onClose} title="Edit profile" footer={<Button size="lg" block onClick={submit}>Save profile</Button>}>
      <div className="space-y-4 pb-2 pt-2">
        <div className="flex items-center gap-4">
          <Avatar user={{ ...app.user, name: form.name || app.user.name, photo }} size="xl" />
          <div className="space-y-2">
            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-2xl bg-primary-soft px-4 text-sm font-bold text-primary">
              <Camera className="h-4 w-4" /> Change photo
              <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await resizePhoto(f)); }} />
            </label>
            {photo && <button type="button" onClick={() => setPhoto(undefined)} className="block min-h-[44px] px-1 text-sm font-semibold text-muted">Remove photo</button>}
          </div>
        </div>
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} hint="Roommates use this to call or WhatsApp you." />
        <Input label="UPI ID" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value.trim() })} placeholder="name@okaxis" hint="Roommates pay you back to this ID via GPay, PhonePe, Paytm…" />
        <ErrorLine error={error} />
      </div>
    </BottomSheet>
  );
}

export function PasswordSheet({ open, onClose }: SheetProps) {
  const toast = useToast();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  useOnOpen(open, () => { setCur(""); setNext(""); setError(""); });
  const submit = () => {
    try { authService.changePassword(cur, next); toast.show("Password changed"); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't change password."); }
  };
  return (
    <BottomSheet open={open} onClose={onClose} title="Change password" footer={<Button size="lg" block onClick={submit}>Update password</Button>}>
      <div className="space-y-4 pb-2 pt-2">
        <Input label="Current password" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} />
        <Input label="New password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} hint="At least 6 characters" />
        <ErrorLine error={error} />
      </div>
    </BottomSheet>
  );
}

export function HouseholdSheet({ open, onClose }: SheetProps) {
  const app = useApp();
  const toast = useToast();
  const [f, setF] = useState({ name: "", address: "", rent: "", due: "", rooms: "" });
  const [error, setError] = useState("");
  useOnOpen(open, () => {
    if (app) {
      const h = app.household;
      setF({ name: h.name, address: h.address, rent: String(h.monthlyRent), due: String(h.rentDueDay), rooms: String(h.rooms) }); setError("");
    }
  });
  if (!app) return null;
  const submit = () => {
    try {
      roomService.updateHousehold(app.household.id, { name: f.name, address: f.address, monthlyRent: Number(f.rent) || 0, rentDueDay: Number(f.due) || 5, rooms: Number(f.rooms) || 1 });
      toast.show("Household updated"); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't update."); }
  };
  return (
    <BottomSheet open={open} onClose={onClose} title="Edit household" footer={<Button size="lg" block onClick={submit}>Save changes</Button>}>
      <div className="space-y-4 pb-2 pt-2">
        <Input label="Household name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input label="Address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Monthly rent (₹)" inputMode="numeric" value={f.rent} onChange={(e) => setF({ ...f, rent: e.target.value })} />
          <Input label="Rent due day" inputMode="numeric" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} />
        </div>
        <Input label="Rooms" inputMode="numeric" value={f.rooms} onChange={(e) => setF({ ...f, rooms: e.target.value })} />
        <ErrorLine error={error} />
      </div>
    </BottomSheet>
  );
}

export function SwitchHouseholdSheet({ open, onClose }: SheetProps) {
  const app = useApp();
  const router = useRouter();
  const toast = useToast();
  if (!app) return null;
  return (
    <BottomSheet open={open} onClose={onClose} title="Your households" description="Switch between the places you live">
      <ul className="space-y-2 pb-3 pt-2">
        {app.households.map((h) => {
          const active = h.id === app.household.id;
          return (
            <li key={h.id}>
              <button onClick={() => { roomService.switchHousehold(h.id); toast.show(`Switched to ${h.name}`, "info"); onClose(); }}
                className={cn("flex min-h-[64px] w-full items-center gap-3 rounded-2xl border p-3 text-left", active ? "border-primary bg-primary-soft" : "border-line bg-surface")}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-base font-black text-primary-ink">{h.name[0]}</span>
                <span className="min-w-0 flex-1"><span className="block truncate font-bold">{h.name}</span><span className="block truncate text-xs text-muted">{h.address || "No address"}</span></span>
                {active && <Check className="h-5 w-5 text-primary" strokeWidth={3} />}
              </button>
            </li>
          );
        })}
      </ul>
      <Button variant="secondary" block onClick={() => { onClose(); router.push("/household"); }}><Plus className="h-4 w-4" />Create or join another</Button>
    </BottomSheet>
  );
}
