import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  MANUAL_REVIEW: "border-amber-400/35 bg-amber-400/10 text-amber-200",
  VERIFIED: "border-sky-400/35 bg-sky-400/10 text-sky-200",
  ISSUED: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  REJECTED: "border-white/20 bg-white/5 text-bone/50",
  APPROVED: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  PENDING: "border-amber-400/35 bg-amber-400/10 text-amber-200",
  HIDDEN: "border-white/20 bg-white/5 text-bone/50",
  SENT: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  SKIPPED: "border-amber-400/35 bg-amber-400/10 text-amber-200",
  FAILED: "border-crimson/40 bg-crimson/10 text-[#ff8a86]",
  CONFIRMED: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  ARCHIVED: "border-white/20 bg-white/5 text-bone/50",
  DRAFT: "border-white/20 bg-white/5 text-bone/50",
  CANCELLED: "border-crimson/40 bg-crimson/10 text-[#ff8a86]",
  FLAGGED: "border-crimson/40 bg-crimson/10 text-[#ff8a86]",
  YEAR_TO_CONFIRM: "border-white/20 bg-white/5 text-bone/60",
  NOT_SENT: "border-white/20 bg-white/5 text-bone/50",
  EXPIRED: "border-amber-400/35 bg-amber-400/10 text-amber-200",
  CLAIMED: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em]",
        STATUS_STYLES[status] ?? "border-white/20 bg-white/5 text-bone/55",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function AdminFlash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "mb-6 border px-4 py-3 text-[11px] leading-5",
        error
          ? "border-crimson/40 bg-crimson/[0.08] text-[#ff8a86]"
          : "border-emerald-400/30 bg-emerald-400/[0.07] text-emerald-200",
      )}
    >
      {error ?? ok}
    </div>
  );
}

export function AdminPanel({
  title,
  description,
  actions,
  children,
  className,
  tone = "default",
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: "default" | "danger";
}) {
  return (
    <section
      className={cn(
        "border bg-[#0d0d0d]",
        tone === "danger" ? "border-crimson/25" : "border-white/10",
        className,
      )}
    >
      {(title || description || actions) && (
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-bone/80">
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-[10px] leading-5 text-bone/35">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  meta,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  meta?: string;
  accent?: boolean;
}) {
  return (
    <div className="border border-white/10 bg-[#0d0d0d] p-4">
      <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-bone/35">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-3xl leading-none",
          accent ? "text-crimson" : "text-bone",
        )}
      >
        {value}
      </p>
      {meta && <p className="mt-2 text-[9px] leading-4 text-bone/30">{meta}</p>}
    </div>
  );
}

export function AdminField({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  required,
  hint,
  className,
  ...rest
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  maxLength?: number;
  spellCheck?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="block text-[8px] font-semibold uppercase tracking-[0.18em] text-bone/40">
        {label}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="mt-1.5 w-full border border-white/12 bg-ink px-3 py-2.5 text-[12px] text-bone placeholder:text-bone/20 focus:border-crimson"
        {...rest}
      />
      {hint && <span className="mt-1 block text-[9px] leading-4 text-bone/25">{hint}</span>}
    </label>
  );
}

export function AdminTextarea({
  label,
  name,
  defaultValue,
  rows = 4,
  required,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[8px] font-semibold uppercase tracking-[0.18em] text-bone/40">
        {label}
      </span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        required={required}
        className="mt-1.5 w-full resize-y border border-white/12 bg-ink px-3 py-2.5 text-[12px] leading-6 text-bone placeholder:text-bone/20 focus:border-crimson"
      />
      {hint && <span className="mt-1 block text-[9px] leading-4 text-bone/25">{hint}</span>}
    </label>
  );
}

export function AdminSelect({
  label,
  name,
  options,
  defaultValue,
  className,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="block text-[8px] font-semibold uppercase tracking-[0.18em] text-bone/40">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-1.5 w-full border border-white/12 bg-ink px-3 py-2.5 text-[12px] text-bone focus:border-crimson"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AdminCheckbox({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 py-1">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-3.5 w-3.5 accent-[#e53935]"
      />
      <span>
        <span className="block text-[11px] text-bone/70">{label}</span>
        {hint && <span className="mt-0.5 block text-[9px] leading-4 text-bone/30">{hint}</span>}
      </span>
    </label>
  );
}

export function AdminButton({
  children,
  variant = "primary",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "light" | "outline" | "danger" | "ghost";
}) {
  const styles: Record<string, string> = {
    primary: "bg-crimson text-ink hover:bg-[#ff4b46]",
    light: "bg-bone text-ink hover:bg-white",
    outline: "border border-white/20 text-bone/75 hover:border-crimson hover:text-crimson",
    danger: "border border-crimson/45 text-crimson hover:bg-crimson hover:text-ink",
    ghost: "text-bone/50 hover:text-bone",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function AdminEmpty({ children }: { children: ReactNode }) {
  return <p className="px-5 py-8 text-center text-[11px] text-bone/35">{children}</p>;
}

export function AdminTableShell({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}
