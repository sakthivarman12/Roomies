"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "./Button";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** "sheet" slides from the bottom on mobile and centres on desktop; "modal" is always centred. */
  variant?: "sheet" | "modal";
}

export function BottomSheet({ open, onClose, title, description, children, footer, variant = "sheet" }: SheetProps) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>("input,select,textarea")?.focus({ preventScroll: true }), 350);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className={cn("fixed inset-0 z-50 flex justify-center", variant === "modal" ? "items-center p-4" : "items-end md:items-center md:p-6")}>
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "relative flex max-h-[92dvh] w-full flex-col bg-surface shadow-[var(--shadow-lg)]",
              variant === "modal" ? "max-w-md rounded-[28px]" : "max-w-xl rounded-t-[32px] md:rounded-[32px]",
            )}
            initial={reduce ? { opacity: 0 } : { y: "100%", opacity: 0.6 }}
            animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: "100%", opacity: 0.6 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            drag={reduce || variant === "modal" ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            dragListener={false}
            onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose(); }}
          >
            <div className="flex justify-center pt-2.5 md:hidden" aria-hidden>
              <span className="h-1.5 w-10 rounded-full bg-line" />
            </div>
            <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-3 md:px-6 md:pt-5">
              <div>
                <h2 id={titleId} className="text-xl font-extrabold tracking-tight">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
              </div>
              <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1"><X className="h-5 w-5" /></IconButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 md:px-6">{children}</div>
            {footer && (
              <div className="border-t border-line bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:rounded-b-[32px] md:px-6">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Modal(props: Omit<SheetProps, "variant">) {
  return <BottomSheet {...props} variant="modal" />;
}
