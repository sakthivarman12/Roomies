"use client";

import { useEffect } from "react";
import { ReceiptProvider } from "@/components/expenses/ReceiptOverlay";
import { ToastProvider } from "@/components/ui/Toast";
import { useApp } from "@/hooks/useApp";

/** Keeps <html data-theme> in sync with the signed-in user's preference. */
function ThemeSync() {
  const app = useApp();
  const dark = app?.prefs.darkMode;
  useEffect(() => {
    if (dark === undefined) return;
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try { localStorage.setItem("roomies.theme", dark ? "dark" : "light"); } catch { /* storage unavailable */ }
  }, [dark]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ReceiptProvider>
        <ThemeSync />
        {children}
      </ReceiptProvider>
    </ToastProvider>
  );
}
