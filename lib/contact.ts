/** Digits only, defaulting to India (+91) for 10-digit numbers. */
export function normalizePhone(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  if (digits.length === 10) return `91${digits}`;
  return digits.replace(/^0+/, "");
}

export function telHref(raw: string | undefined): string | null {
  const n = normalizePhone(raw);
  return n ? `tel:+${n}` : null;
}

export function whatsappHref(raw: string | undefined, text?: string): string | null {
  const n = normalizePhone(raw);
  return n ? `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}` : null;
}
