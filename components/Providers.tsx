"use client";

import { MotionConfig } from "framer-motion";
import { useEffect } from "react";
import { ReceiptProvider } from "@/components/expenses/ReceiptOverlay";
import { ToastProvider } from "@/components/ui/Toast";
import { useApp } from "@/hooks/useApp";
import { applyTheme, themeStore, useTheme } from "@/lib/theme";

/** Mirrors the signed-in user's saved theme into the live theme store and <html> attributes. */
function ThemeSync() {
  const app = useApp();
  const saved = app?.theme;
  const theme = useTheme();

  useEffect(() => {
    if (saved) themeStore.set(saved);
  }, [saved]);

  useEffect(() => {
    applyTheme(theme);
    if (theme.mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(theme);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { motion } = useTheme();
  return (
    <MotionConfig reducedMotion={motion === "full" ? "user" : "always"} transition={motion === "off" ? { duration: 0 } : undefined}>
      <ToastProvider>
        <ReceiptProvider>
          <ThemeSync />
          {children}
        </ReceiptProvider>
      </ToastProvider>
    </MotionConfig>
  );
}
