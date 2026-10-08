"use client";

import { Check, MonitorSmartphone, Moon, RotateCcw, Sun } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { authService } from "@/lib/services";
import {
  ACCENTS, APP_ICONS, appIconSvg, DEFAULT_THEME, useTheme,
  type GlassLevel, type IconStyle, type MotionLevel, type NavStyle, type ThemeMode, type ThemePrefs,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="px-1"><h3 className="text-sm font-extrabold">{title}</h3>{hint && <p className="text-xs text-muted">{hint}</p>}</div>
      {children}
    </section>
  );
}

const NAV_OPTIONS: { value: NavStyle; label: string; hint: string }[] = [
  { value: "floating", label: "Floating", hint: "Pill with labels" },
  { value: "docked", label: "Docked", hint: "Full-width bar" },
  { value: "icons", label: "Icons", hint: "Compact, no labels" },
];

function NavPreview({ style, active }: { style: NavStyle; active: boolean }) {
  const dots = [0, 1, 2, 3];
  return (
    <div className={cn("flex h-14 items-end justify-center overflow-hidden rounded-xl bg-surface2 p-1.5", active && "ring-2 ring-primary")}>
      <div className={cn("flex w-full items-center justify-around bg-strong/80", style === "floating" && "mb-0.5 h-6 rounded-full px-2", style === "docked" && "-mb-1.5 h-7 rounded-none border-t border-line", style === "icons" && "mb-0.5 h-5 w-3/5 rounded-full px-1")}>
        {dots.map((d) => <span key={d} className={cn("rounded-full", d === 0 ? "bg-primary" : "bg-muted/50", style === "icons" ? "h-2 w-2" : "h-2 w-3")} />)}
      </div>
    </div>
  );
}

export function ThemeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useTheme();
  const toast = useToast();
  const set = (patch: Partial<ThemePrefs>) => authService.updateTheme(patch);

  return (
    <BottomSheet open={open} onClose={onClose} title="App theme" description="Changes apply instantly and are saved to your profile"
      footer={<Button variant="secondary" block onClick={() => { authService.updateTheme(DEFAULT_THEME); toast.show("Theme reset to defaults", "info"); }}><RotateCcw className="h-4 w-4" />Reset to defaults</Button>}>
      <div className="space-y-6 pb-3 pt-2">
        <Section title="Appearance">
          <SegmentedControl<ThemeMode> label="Appearance" value={theme.mode} onChange={(mode) => set({ mode })}
            options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }, { value: "system", label: "System" }]} />
          <p className="flex items-center gap-1.5 px-1 text-xs text-muted">
            {theme.mode === "dark" ? <Moon className="h-3.5 w-3.5" /> : theme.mode === "light" ? <Sun className="h-3.5 w-3.5" /> : <MonitorSmartphone className="h-3.5 w-3.5" />}
            {theme.mode === "system" ? "Follows your device setting." : `Always ${theme.mode}.`}
          </p>
        </Section>

        <Section title="Accent colour">
          <div role="radiogroup" aria-label="Accent colour" className="flex flex-wrap gap-3 px-1">
            {ACCENTS.map((a) => (
              <button key={a.id} role="radio" aria-checked={theme.accent === a.id} aria-label={a.label} onClick={() => set({ accent: a.id })}
                className={cn("flex h-11 w-11 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-[var(--surface-strong)] transition-transform active:scale-90", theme.accent === a.id && "ring-2 ring-primary")}
                style={{ background: a.color }}>
                {theme.accent === a.id && <Check className="h-5 w-5" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Glass effect" hint="How frosted cards and bars look">
          <SegmentedControl<GlassLevel> label="Glass effect" value={theme.glass} onChange={(glass) => set({ glass })}
            options={[{ value: "off", label: "Solid" }, { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} />
        </Section>

        <Section title="App icon" hint="Used for the logo and browser tab icon">
          <div role="radiogroup" aria-label="App icon" className="grid grid-cols-6 gap-2">
            {APP_ICONS.map((i) => (
              <button key={i.id} role="radio" aria-checked={theme.appIcon === i.id} aria-label={i.label} title={i.label} onClick={() => set({ appIcon: i.id })}
                className={cn("flex aspect-square items-center justify-center rounded-2xl border transition-all active:scale-90", theme.appIcon === i.id ? "border-primary bg-primary-soft" : "border-line bg-surface2")}>
                <svg viewBox="0 0 24 24" className="h-8 w-8 rounded-[10px]" style={{ background: "var(--a)" }} aria-hidden dangerouslySetInnerHTML={{ __html: appIconSvg(i.id) }} />
              </button>
            ))}
          </div>
        </Section>

        <Section title="Icon style" hint="Stroke weight of every icon">
          <SegmentedControl<IconStyle> label="Icon style" value={theme.iconStyle} onChange={(iconStyle) => set({ iconStyle })}
            options={[{ value: "thin", label: "Thin" }, { value: "regular", label: "Regular" }, { value: "bold", label: "Bold" }]} />
        </Section>

        <Section title="Navigation bar">
          <div role="radiogroup" aria-label="Navigation bar style" className="grid grid-cols-3 gap-2.5">
            {NAV_OPTIONS.map((n) => (
              <button key={n.value} role="radio" aria-checked={theme.navStyle === n.value} onClick={() => set({ navStyle: n.value })} className="space-y-1.5 text-left">
                <NavPreview style={n.value} active={theme.navStyle === n.value} />
                <span className="block px-0.5"><span className="block text-[13px] font-bold">{n.label}</span><span className="block text-[11px] text-muted">{n.hint}</span></span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Animations" hint="Full: springs and receipt printing · Subtle: fades only · Off: no motion">
          <SegmentedControl<MotionLevel> label="Animations" value={theme.motion} onChange={(motion) => set({ motion })}
            options={[{ value: "full", label: "Full" }, { value: "subtle", label: "Subtle" }, { value: "off", label: "Off" }]} />
        </Section>
      </div>
    </BottomSheet>
  );
}
