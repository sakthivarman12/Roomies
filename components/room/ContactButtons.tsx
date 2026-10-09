"use client";

import { MessageCircle, Phone } from "lucide-react";
import { telHref, whatsappHref } from "@/lib/contact";
import { cn } from "@/lib/utils";

/** Call + WhatsApp shortcuts for a roommate. Renders nothing if they have no phone number. */
export function ContactButtons({ name, phone, className, size = "md" }: { name: string; phone?: string; className?: string; size?: "sm" | "md" }) {
  const tel = telHref(phone);
  const wa = whatsappHref(phone, `Hi ${name}, `);
  if (!tel && !wa) return null;
  const base = cn("inline-flex items-center justify-center gap-1.5 rounded-2xl font-bold transition-transform active:scale-95", size === "sm" ? "h-11 min-w-[44px] px-3 text-xs" : "h-12 flex-1 px-4 text-sm");
  return (
    <div className={cn("flex gap-2", className)}>
      {tel && <a href={tel} aria-label={`Call ${name}`} className={cn(base, "bg-info-soft text-info")}><Phone className="h-4 w-4" />{size === "md" && "Call"}</a>}
      {wa && <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${name}`} className={cn(base, "bg-success-soft text-success")}><MessageCircle className="h-4 w-4" />{size === "md" && "WhatsApp"}</a>}
    </div>
  );
}
