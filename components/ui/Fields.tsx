"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

const BASE =
  "w-full rounded-2xl border border-line bg-surface px-4 text-[15px] text-ink placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 min-h-[48px]";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string) => React.ReactNode;
  className?: string;
}

export function Field({ label, hint, error, children, className }: FieldProps) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block px-1 text-[13px] font-semibold text-muted">{label}</label>
      {children(id)}
      {error ? <p role="alert" className="px-1 text-xs font-medium text-danger">{error}</p> : hint ? <p className="px-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string; fieldClassName?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, className, fieldClassName, ...rest }, ref) {
  return (
    <Field label={label} hint={hint} error={error} className={fieldClassName}>
      {(id) => <input id={id} ref={ref} aria-invalid={!!error} className={cn(BASE, error && "border-danger", className)} {...rest} />}
    </Field>
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string };

export function Textarea({ label, hint, error, className, ...rest }: TextareaProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id) => <textarea id={id} rows={3} className={cn(BASE, "py-3", className)} {...rest} />}
    </Field>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string; options: { value: string; label: string }[]; hint?: string; error?: string; fieldClassName?: string;
};

export function Select({ label, options, hint, error, className, fieldClassName, ...rest }: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error} className={fieldClassName}>
      {(id) => (
        <select id={id} className={cn(BASE, "appearance-none bg-[length:16px] bg-[right_16px_center] bg-no-repeat pr-10", className)}
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239a9fbd' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
          {...rest}
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </Field>
  );
}

/** Compact inline filter dropdown. */
export function MiniSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}
      className="min-h-[44px] shrink-0 rounded-full border border-line bg-surface px-3.5 text-[13px] font-semibold text-ink focus:border-primary focus:outline-none">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input type="search" aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="min-h-[48px] w-full rounded-2xl border border-line bg-surface px-4 text-[15px] placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10" />
  );
}

type DatePickerProps = Omit<InputProps, "type">;
export function DatePicker(props: DatePickerProps) {
  return <Input type="date" {...props} />;
}

interface AmountInputProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoFocus?: boolean;
}

/** Large, prominent rupee amount entry. */
export function AmountInput({ label = "Amount", value, onChange, error, autoFocus }: AmountInputProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block px-1 text-[13px] font-semibold text-muted">{label}</label>
      <div className={cn("flex items-center gap-2 rounded-3xl border border-line bg-surface2/60 px-5 py-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10", error && "border-danger")}>
        <span className="text-3xl font-bold text-muted">₹</span>
        <input
          id={id}
          inputMode="decimal"
          autoFocus={autoFocus}
          placeholder="0"
          value={value}
          aria-invalid={!!error}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, "");
            if ((v.match(/\./g) ?? []).length <= 1 && /^\d*\.?\d{0,2}$/.test(v)) onChange(v);
          }}
          className="tnum w-full bg-transparent text-4xl font-extrabold tracking-tight text-ink placeholder:text-muted/40 focus:outline-none"
        />
      </div>
      {error && <p role="alert" className="px-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
