"use client";

import { MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Fields";
import { useToast } from "@/components/ui/Toast";
import { authService } from "@/lib/services";
import { useGuard } from "@/hooks/useGuard";

export default function ForgotPage() {
  const ok = useGuard("guest-only");
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  if (!ok) return null;

  const request = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      authService.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const reset = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      authService.resetPassword(email, password);
      toast.show("Password updated — log in with your new password");
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <AuthShell title={sent ? "Check your inbox" : "Forgot password?"} subtitle={sent ? undefined : "Enter your email and we'll help you reset it."} back="/login">
      {!sent ? (
        <form onSubmit={request} className="space-y-4" noValidate>
          <Input label="Email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" error={error} required />
          <Button type="submit" size="lg" block>Send reset link</Button>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-4" noValidate>
          <div className="flex items-start gap-3 rounded-3xl bg-success-soft p-4 text-success">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p className="text-sm font-medium">We sent a reset link to <b>{email}</b>. Since this is the local prototype, set your new password right here.</p>
          </div>
          <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} placeholder="At least 6 characters" required />
          <Button type="submit" size="lg" block>Update password</Button>
        </form>
      )}
    </AuthShell>
  );
}
