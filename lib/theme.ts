import { useSyncExternalStore } from "react";

export type ThemeMode = "dark" | "light" | "system";
export type Accent = "indigo" | "emerald" | "rose" | "amber" | "sky" | "violet";
export type GlassLevel = "off" | "low" | "medium" | "high";
export type MotionLevel = "full" | "subtle" | "off";
export type NavStyle = "floating" | "docked" | "icons";
export type IconStyle = "thin" | "regular" | "bold";
export type AppIconId = "home" | "wallet" | "sparkle" | "users" | "heart" | "leaf";

export interface ThemePrefs {
  mode: ThemeMode;
  accent: Accent;
  glass: GlassLevel;
  motion: MotionLevel;
  navStyle: NavStyle;
  iconStyle: IconStyle;
  appIcon: AppIconId;
}

export const DEFAULT_THEME: ThemePrefs = {
  mode: "dark", accent: "indigo", glass: "medium", motion: "full", navStyle: "floating", iconStyle: "regular", appIcon: "home",
};

export const ACCENTS: { id: Accent; label: string; color: string }[] = [
  { id: "indigo", label: "Indigo", color: "#4f46e5" },
  { id: "emerald", label: "Emerald", color: "#10b981" },
  { id: "rose", label: "Rose", color: "#e11d48" },
  { id: "amber", label: "Amber", color: "#d97706" },
  { id: "sky", label: "Sky", color: "#0284c7" },
  { id: "violet", label: "Violet", color: "#7c3aed" },
];

/** Simple 24x24 glyphs (white fill) used by the logo, app-icon picker and favicon. */
export const APP_ICONS: { id: AppIconId; label: string; svg: string }[] = [
  { id: "home", label: "Home", svg: '<path d="M4 11.5 12 4.5l8 7V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" fill="#fff"/><path d="M10 20.5V14h4v6.5" fill="rgba(0,0,0,.28)"/>' },
  { id: "wallet", label: "Wallet", svg: '<rect x="3.5" y="6.5" width="17" height="12" rx="3" fill="#fff"/><path d="M3.5 9.5V8a2.5 2.5 0 0 1 2.5-2.5h10" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="16.5" cy="12.5" r="1.7" fill="rgba(0,0,0,.3)"/>' },
  { id: "sparkle", label: "Sparkle", svg: '<path d="M12 3.5c.8 4.2 2.3 5.7 6.5 6.5-4.2.8-5.7 2.3-6.5 6.5-.8-4.2-2.3-5.7-6.5-6.5 4.2-.8 5.7-2.3 6.5-6.5z" fill="#fff"/><path d="M18.5 15.5c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5z" fill="#fff"/>' },
  { id: "users", label: "Roomies", svg: '<circle cx="9" cy="9" r="3.4" fill="#fff"/><path d="M2.8 19.5c.4-3.3 3-5.2 6.2-5.2s5.8 1.9 6.2 5.2z" fill="#fff"/><circle cx="16.8" cy="9.8" r="2.7" fill="#fff" opacity=".8"/><path d="M16.8 14.4c2.5.1 4.1 1.7 4.4 4.3h-4.1" fill="#fff" opacity=".8"/>' },
  { id: "heart", label: "Heart", svg: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" fill="#fff"/>' },
  { id: "leaf", label: "Leaf", svg: '<path d="M5 19c0-8 5-13.5 14-14 .5 9-4.5 14.5-12.5 14z" fill="#fff"/><path d="M5 19c3-4 6-7 9.5-9" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="1.4" stroke-linecap="round"/>' },
];

export function appIconSvg(id: AppIconId): string {
  return (APP_ICONS.find((i) => i.id === id) ?? APP_ICONS[0]).svg;
}

export function faviconHref(theme: ThemePrefs): string {
  const color = ACCENTS.find((a) => a.id === theme.accent)?.color ?? "#4f46e5";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6.5" fill="${color}"/>${appIconSvg(theme.appIcon)}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const THEME_STORAGE_KEY = "roomies.theme2";

export function resolveMode(mode: ThemeMode): "dark" | "light" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Writes the theme to <html> data attributes, localStorage (for first paint) and the favicon. */
export function applyTheme(theme: ThemePrefs): void {
  const el = document.documentElement;
  el.setAttribute("data-theme", resolveMode(theme.mode));
  el.setAttribute("data-accent", theme.accent);
  el.setAttribute("data-glass", theme.glass);
  el.setAttribute("data-motion", theme.motion);
  el.setAttribute("data-icons", theme.iconStyle);
  try { localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme)); } catch { /* storage unavailable */ }
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-roomies]');
  if (!link) {
    document.querySelectorAll('link[rel~="icon"]').forEach((l) => l.remove());
    link = document.createElement("link");
    link.rel = "icon";
    link.setAttribute("data-roomies", "1");
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = faviconHref(theme);
}

function readStored(): ThemePrefs {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) return { ...DEFAULT_THEME, ...(JSON.parse(raw) as Partial<ThemePrefs>) };
  } catch { /* ignore */ }
  return DEFAULT_THEME;
}

let current: ThemePrefs | null = null;
const listeners = new Set<() => void>();

export const themeStore = {
  get(): ThemePrefs {
    if (!current) current = typeof window === "undefined" ? DEFAULT_THEME : readStored();
    return current;
  },
  set(next: ThemePrefs) {
    const prev = themeStore.get();
    if (JSON.stringify(prev) === JSON.stringify(next)) return;
    current = next;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
};

/** Live theme preferences (works on logged-out screens too via localStorage). */
export function useTheme(): ThemePrefs {
  return useSyncExternalStore(themeStore.subscribe, themeStore.get, () => DEFAULT_THEME);
}
