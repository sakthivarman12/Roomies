"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { money } from "@/lib/format";

export interface Slice {
  label: string;
  value: number;
  color: string;
}

export function Donut({ slices, size = 160, thickness = 18, center, onSelect, onCenter }: { slices: Slice[]; size?: number; thickness?: number; center?: React.ReactNode; onSelect?: (label: string) => void; onCenter?: () => void }) {
  const reduce = useReducedMotion();
  const total = slices.reduce((a, s) => a + s.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role={onSelect ? "group" : "img"} aria-label={`Breakdown: ${slices.map((s) => `${s.label} ${money(s.value)}`).join(", ")}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        <motion.g
          style={{ originX: "50%", originY: "50%" }}
          initial={reduce ? false : { opacity: 0, rotate: -50, scale: 0.88 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 90, damping: 16 }}
        >
          {total > 0 && slices.filter((s) => s.value > 0).map((s) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={s.label}
                cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness} strokeLinecap="butt"
                strokeDasharray={`${Math.max(len - 3, 0)} ${c}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={onSelect ? { cursor: "pointer", pointerEvents: "stroke" } : undefined}
                onClick={onSelect ? () => onSelect(s.label) : undefined}
                role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={onSelect ? `${s.label} ${money(s.value)} — view records` : undefined}
                onKeyDown={onSelect ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(s.label); } } : undefined}
              />
            );
            offset += len;
            return el;
          })}
        </motion.g>
      </svg>
      {center && (onCenter
        ? <button type="button" onClick={onCenter} aria-label="View all records" className="absolute inset-[24%] flex flex-col items-center justify-center rounded-full text-center transition-colors hover:bg-surface2">{center}</button>
        : <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>)}
    </div>
  );
}

export function BarChart({ data, height = 140, highlightLast = true, selected, onSelect }: { data: { label: string; value: number }[]; height?: number; highlightLast?: boolean; selected?: number; onSelect?: (index: number) => void }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3" style={{ height: height + 28 }} role="img" aria-label={`Spending by month: ${data.map((d) => `${d.label} ${money(d.value)}`).join(", ")}`}>
      {data.map((d, i) => {
        const last = selected !== undefined ? i === selected : highlightLast && i === data.length - 1;
        const Wrapper = onSelect ? "button" : "div";
        return (
          <Wrapper key={d.label} {...(onSelect ? { type: "button" as const, onClick: () => onSelect(i), "aria-label": `${d.label}: ${money(d.value)} — view records`, "aria-pressed": last } : {})} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-end" style={{ height }}>
              <motion.div
                className="w-full rounded-t-xl"
                style={{ background: last ? "var(--primary)" : "var(--primary-soft)", minHeight: 4 }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max((d.value / max) * 100, 3)}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20, delay: i * 0.06 }}
                title={money(d.value)}
              />
            </div>
            <span className={`text-[11px] font-semibold ${last ? "text-primary" : "text-muted"}`}>{d.label}</span>
          </Wrapper>
        );
      })}
    </div>
  );
}

export function HBars({ items }: { items: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((it, i) => (
        <li key={it.label}>
          <div className="mb-1 flex justify-between text-[13px]">
            <span className="font-semibold">{it.label}</span>
            <span className="tnum font-bold">{money(it.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface2">
            <motion.div className="h-full rounded-full" style={{ background: it.color }} initial={{ width: 0 }} animate={{ width: `${(it.value / max) * 100}%` }} transition={{ delay: i * 0.06, type: "spring", stiffness: 110, damping: 22 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
