"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Fields";
import { useToast } from "@/components/ui/Toast";
import { authService } from "@/lib/services";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { remoteSignUp } from "@/lib/supabase/auth";
import { useGuard } from "@/hooks/useGuard";

export default function SignupPage() {
  const ok = useGuard("guest-only");
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!ok) return null;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    if (isSupabaseConfigured()) {
      try {
        await remoteSignUp(form);
        window.location.assign("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't create your account.");
        setBusy(false);
      }
      return;
    }
    setTimeout(() => {
      try {
        const user = authService.signup(form);
        toast.show(`Account created — hi ${user.name}!`);
        router.replace("/household");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't create your account.");
        setBusy(false);
      }
    }, 350);
  };

  return (
    <AuthShell title="Create your account" subtitle="One login per roommate — no shared passwords." back="/welcome" step={0}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Full name" autoComplete="name" value={form.name} onChange={set("name")} placeholder="Sakthi" required />
        <Input label="Email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
        <Input label="Phone" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set("phone")} placeholder="98765 43210" />
        <Input label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} placeholder="At least 6 characters" hint="Use something you don't use anywhere else." error={error} required />
        <Button type="submit" size="lg" block loading={busy}>Continue</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-bold text-primary">Log in</Link></p>
    </AuthShell>
  );
}
