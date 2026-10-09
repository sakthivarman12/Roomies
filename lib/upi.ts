import type { PaymentMethod } from "@/types";

const SCHEME: Partial<Record<PaymentMethod, string>> = {
  GPay: "tez://upi/pay", PhonePe: "phonepe://pay", Paytm: "paytmmp://pay", UPI: "upi://pay",
};

export function isUpiApp(method: PaymentMethod): boolean {
  return method in SCHEME;
}

/** Deep link that opens the chosen payment app with the payee and amount pre-filled (works on phones with the app installed). */
export function upiLink(method: PaymentMethod, p: { upiId: string; name: string; amount: number; note?: string }): string | null {
  const base = SCHEME[method];
  if (!base || !p.upiId) return null;
  const q = new URLSearchParams({ pa: p.upiId, pn: p.name, am: p.amount.toFixed(2), cu: "INR", tn: p.note || "Roomies settle up" });
  return `${base}?${q.toString()}`;
}
