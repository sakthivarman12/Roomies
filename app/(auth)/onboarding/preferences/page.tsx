"use client";

import { Bell, IndianRupee, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { PermissionsList } from "@/components/profile/NotifySheets";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { useApp } from "@/hooks/useApp";
import { useGuard } from "@/hooks/useGuard";
import { authService } from "@/lib/services";

export default function PreferencesStep() {
  const ok = useGuard("needs-household");
  const app = useApp();
  const router = useRouter();
  if (!ok || !app) return null;
  const { prefs } = app;

  return (
    <AuthShell title="Make it yours" subtitle="You can change these any time in your profile." step={3}>
      <Card padded={false} className="divide-y divide-line">
        <div className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-soft text-violet"><Moon className="h-5 w-5" /></span>
          <div className="flex-1"><p className="font-bold">Dark mode</p><p className="text-xs text-muted">Easier on the eyes at night</p></div>
          <Toggle label="Dark mode" checked={app.theme.mode === "dark"} onChange={(v) => authService.updateTheme({ mode: v ? "dark" : "light" })} />
        </div>
        <div className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warning-soft text-warning"><Bell className="h-5 w-5" /></span>
          <div className="flex-1"><p className="font-bold">Notifications</p><p className="text-xs text-muted">Bills, payments and chore reminders</p></div>
          <Toggle label="Notifications" checked={prefs.notifications} onChange={(v) => authService.updatePrefs({ notifications: v })} />
        </div>
        <div className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success-soft text-success"><IndianRupee className="h-5 w-5" /></span>
          <div className="flex-1"><p className="font-bold">Currency</p><p className="text-xs text-muted">Indian Rupee (₹)</p></div>
        </div>
      </Card>
      <h2 className="mb-3 mt-8 px-1 text-sm font-extrabold">Permissions</h2>
      <PermissionsList />
      <Button size="lg" block className="mt-8" onClick={() => router.replace("/home")}>Go to my dashboard</Button>
    </AuthShell>
  );
}
