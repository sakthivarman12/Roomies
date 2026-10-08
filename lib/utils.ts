export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Mock-only password hash (NOT secure). Supabase Auth replaces this entirely. */
export function mockHash(input: string): string {
  let h = 5381;
  const salted = `roomies::${input}`;
  for (let i = 0; i < salted.length; i++) h = ((h << 5) + h + salted.charCodeAt(i)) | 0;
  return `mock$${(h >>> 0).toString(16)}`;
}

export function inviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "RM-";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
