"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Fields";
import { useToast } from "@/components/ui/Toast";
import { authService } from "@/lib/services";
import { selectedHouseholdPath } from "@/lib/nav";
import { useGuard } from "@/hooks/useGuard";

export default function LoginPage() {
  const ok = useGuard("guest-only");
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ok) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    setTimeout(() => {
      try {
        const user = authService.login(email, password);
        toast.show(`Welcome back, ${user.name}`);
        router.replace(selectedHouseholdPath());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't log in.");
        setBusy(false);
      }
    }, 350);
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to see how your household is doing." back="/welcome">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        <div className="relative">
          <Input label="Password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" error={error} required />
          <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)} className="absolute right-3 top-[34px] flex h-11 w-11 items-center justify-center text-muted">
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <div className="flex justify-end"><Link href="/forgot" className="text-sm font-semibold text-primary">Forgot password?</Link></div>
        <Button type="submit" size="lg" block loading={busy}>Log in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">New to Roomies? <Link href="/signup" className="font-bold text-primary">Create an account</Link></p>

    </AuthShell>
  );
}
