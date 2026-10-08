"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";
interface ToastItem { id: number; message: string; tone: ToastTone }
interface ToastApi { show: (message: string, tone?: ToastTone) => void }

const ToastContext = createContext<ToastApi>({ show: () => undefined });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const show = useCallback((message: string, tone: ToastTone = "success") => {
    const id = nextId.current++;
    setItems((prev) => [...prev.slice(-2), { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[70] flex flex-col items-center gap-2 px-4">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={cn(
                "pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold shadow-[var(--shadow-lg)]",
                t.tone === "error" ? "bg-danger text-white" : "bg-ink text-bg",
              )}
            >
              {t.tone === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden /> : t.tone === "error" ? <AlertCircle className="h-5 w-5 shrink-0" aria-hidden /> : <Info className="h-5 w-5 shrink-0" aria-hidden />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  return useContext(ToastContext);
}
