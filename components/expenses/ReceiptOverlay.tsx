"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Download, Eye, Printer, Share2 } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { dateTime, money } from "@/lib/format";
import type { Receipt as ReceiptData } from "@/types";
import { Receipt } from "./Receipt";

export interface ReceiptRequest {
  receipt: ReceiptData;
  heading?: string;
  onView?: () => void;
}

interface ReceiptApi {
  show: (req: ReceiptRequest) => void;
}

const ReceiptContext = createContext<ReceiptApi>({ show: () => undefined });
export const useReceiptOverlay = () => useContext(ReceiptContext);

export function receiptText(r: ReceiptData): string {
  const lines = [
    "ROOMIES — HOUSEHOLD EXPENSE RECEIPT", "-----------------------------------",
    `Transaction: ${r.receiptNumber}`, `Date: ${dateTime(r.date)}`, `Household: ${r.household}`, `Paid by: ${r.paidBy}`,
    `Description: ${r.description}`, "", "Split:", ...r.splitDetails.map((s) => `  ${s.name}: ${money(s.amount)}`),
    "", `TOTAL: ${money(r.amount)}`, `Status: ${r.status}`,
  ];
  return lines.join("\n");
}

export function ReceiptActions({ receipt, onNotify }: { receipt: ReceiptData; onNotify: (m: string) => void }) {
  const download = () => {
    const blob = new Blob([receiptText(receipt)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `roomies-receipt-${receipt.receiptNumber}.txt`; a.click();
    URL.revokeObjectURL(url);
    onNotify("Receipt downloaded");
  };
  const share = async () => {
    const text = receiptText(receipt);
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: `Roomies receipt ${receipt.receiptNumber}`, text }); return; } catch { return; }
    }
    try { await navigator.clipboard.writeText(text); onNotify("Receipt copied to clipboard"); } catch { onNotify("Sharing isn't supported on this device"); }
  };
  return (
    <div className="grid grid-cols-3 gap-2">
      <Button variant="secondary" size="sm" onClick={download}><Download className="h-4 w-4" />Save</Button>
      <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</Button>
      <Button variant="secondary" size="sm" onClick={share}><Share2 className="h-4 w-4" />Share</Button>
    </div>
  );
}

export function ReceiptProvider({ children }: { children: React.ReactNode }) {
  const [req, setReq] = useState<ReceiptRequest | null>(null);
  const toast = useToast();
  const reduce = useReducedMotion();
  const show = useCallback((r: ReceiptRequest) => setReq(r), []);
  const api = useMemo(() => ({ show }), [show]);
  const close = () => setReq(null);

  return (
    <ReceiptContext.Provider value={api}>
      {children}
      <AnimatePresence>
        {req && (
          <motion.div
            key={req.receipt.receiptNumber}
            className="fixed inset-0 z-[60] flex flex-col items-center overflow-y-auto bg-[#0f1024]/95 px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))] backdrop-blur"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="dialog" aria-modal="true" aria-label="Receipt"
          >
            <div className="flex w-full max-w-sm flex-1 flex-col items-center">
              <motion.div
                initial={reduce ? false : { scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.1 }}
                className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40"
              >
                <Check className="h-8 w-8" strokeWidth={3} />
              </motion.div>
              <motion.h2 initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-center text-xl font-black tracking-[0.12em] text-white">
                {req.heading ?? "ALL DONE"}
              </motion.h2>
              <motion.p initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mb-5 mt-1 text-sm text-white/60">
                {req.receipt.household} · {req.receipt.description}
              </motion.p>

              {/* printer */}
              <motion.div
                initial={reduce ? false : { opacity: 0, scaleX: 0.7 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 24 }}
                className="relative z-10 h-5 w-[calc(100%+24px)] rounded-full bg-gradient-to-b from-[#3b3d66] to-[#24264a] shadow-[0_8px_24px_rgb(0_0_0/0.5)]"
              >
                <span className="absolute inset-x-5 bottom-1 h-1.5 rounded-full bg-black/60" />
              </motion.div>
              {/* paper slot: clip so receipt appears to be fed out from under the printer */}
              <div className="-mt-1 w-full overflow-hidden px-0 pb-4">
                <motion.div
                  initial={reduce ? false : { y: "-100%" }} animate={{ y: 0 }}
                  transition={{ delay: 0.7, duration: 1.05, ease: [0.22, 0.8, 0.3, 1] }}
                >
                  <Receipt {...req.receipt} animated startDelay={1.1} />
                </motion.div>
              </div>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 3.1 }}
                className="mt-2 w-full space-y-3"
              >
                <ReceiptActions receipt={req.receipt} onNotify={(m) => toast.show(m, "info")} />
                <div className="grid grid-cols-2 gap-2">
                  {req.onView ? (
                    <Button variant="soft" onClick={() => { const v = req.onView; close(); v?.(); }}><Eye className="h-4 w-4" />View expense</Button>
                  ) : <span />}
                  <Button className={req.onView ? "" : "col-span-2"} onClick={close}>Done</Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ReceiptContext.Provider>
  );
}
