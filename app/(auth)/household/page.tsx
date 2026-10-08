"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Fields";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { authService, roomService } from "@/lib/services";
import { useApp, useSession } from "@/hooks/useApp";
import { useGuard } from "@/hooks/useGuard";

type Mode = "create" | "join";

export default function HouseholdPage() {
  const ok = useGuard("auth-only");
  const router = useRouter();
  const toast = useToast();
  const { household } = useSession();
  const app = useApp();
  const [mode, setMode] = useState<Mode>("create");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [form, setForm] = useState({ name: "", address: "", rent: "", due: "5", rooms: "2", rules: "Clean up after cooking\nQuiet hours after 11 PM" });
  if (!ok) return null;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const adding = Boolean(household); // an existing member adding another household

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const h = roomService.createHousehold({
        name: form.name, address: form.address, monthlyRent: Number(form.rent) || 0, rentDueDay: Number(form.due) || 5,
        rooms: Number(form.rooms) || 1, rules: form.rules.split("\n").map((r) => r.trim()).filter(Boolean),
      });
      toast.show(`${h.name} created`);
      router.replace("/onboarding/roommates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create household.");
    }
  };

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const h = roomService.joinByCode(code);
      toast.show(`Welcome to ${h.name}!`);
      router.replace("/onboarding/preferences");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't join household.");
    }
  };

  return (
    <AuthShell
      title={adding ? "Add a household" : "Set up your household"}
      subtitle={`Hi ${app?.user.name ?? "there"} — create a new household or join one with an invite code.`}
      step={1} wide back={adding ? "/profile" : undefined}
    >
      <SegmentedControl<Mode> label="Create or join" value={mode} onChange={(m) => { setMode(m); setError(""); }} options={[{ value: "create", label: "Create household" }, { value: "join", label: "Join with code" }]} />
      <div className="mt-6">
        {mode === "create" ? (
          <form onSubmit={create} className="space-y-4" noValidate>
            <Input label="Household name" value={form.name} onChange={set("name")} placeholder="Green Villa" required />
            <Input label="Address" value={form.address} onChange={set("address")} placeholder="12, Lake View Road, Bengaluru" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Monthly rent (₹)" inputMode="numeric" value={form.rent} onChange={set("rent")} placeholder="24000" />
              <Input label="Rent due day" inputMode="numeric" value={form.due} onChange={set("due")} placeholder="5" />
            </div>
            <Input label="Number of rooms" inputMode="numeric" value={form.rooms} onChange={set("rooms")} />
            <Textarea label="House rules" hint="One per line." value={form.rules} onChange={set("rules")} />
            {error && <p role="alert" className="px-1 text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" size="lg" block>Create household</Button>
          </form>
        ) : (
          <form onSubmit={join} className="space-y-4" noValidate>
            <Input label="Invite code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="RM-7X92KP" autoCapitalize="characters" hint="Ask the household owner for their invite code." error={error} required />
            <Button type="submit" size="lg" block>Join household</Button>
          </form>
        )}
      </div>
      {!adding && (
        <button onClick={() => { authService.logout(); router.replace("/welcome"); }} className="mx-auto mt-6 block min-h-[44px] text-sm font-semibold text-muted">Log out</button>
      )}
    </AuthShell>
  );
}
