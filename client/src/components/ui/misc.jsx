import { AlertTriangle, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import Button from "./Button";

const BADGE = {
  green: "bg-pos-50 text-pos-700 dark:bg-pos-500/15 dark:text-pos-400",
  red: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  amber: "bg-[#fbf1dc] text-[#8a5a12] dark:bg-[#d9a441]/15 dark:text-[#e8c27a]",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  violet: "bg-[#14130f] text-[#f4f2ec] dark:bg-[#f4f2ec] dark:text-[#14130f]",
};

export function Badge({ color = "slate", children, className = "" }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide ${BADGE[color]} ${className}`}>{children}</span>;
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 shadow-clay-sm dark:bg-slate-800">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <p className="font-serif-display text-xl">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <AlertTriangle className="h-6 w-6 text-brand-500" strokeWidth={1.75} />
      <p className="text-sm text-muted">{error?.message || "Something went wrong"}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = value >= max ? "bg-brand-500" : pct >= 80 ? "bg-[#d9a441]" : "bg-ink";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-[width] duration-700 ease-soft ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">Page {page} of {pages}</span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => onChange(page - 1)}>Prev</Button>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-8 flex animate-rise flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif-display text-[2.1rem] leading-[1.05] sm:text-[2.6rem]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-[15px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "slate", sub }) {
  const tones = {
    green: "text-pos-600 dark:text-pos-400",
    red: "text-brand-600 dark:text-brand-400",
    blue: "text-ink",
    slate: "text-muted",
  };
  return (
    <div className="surface group animate-rise p-5 transition duration-300 ease-soft hover:-translate-y-0.5 hover:shadow-lift sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        {Icon && <Icon className={`h-4 w-4 ${tones[tone]}`} strokeWidth={1.75} />}
      </div>
      <p className="font-serif-display mt-4 text-[2rem] leading-none tabular-nums">{value}</p>
      {sub && <p className="mt-2 text-xs text-muted">{sub}</p>}
    </div>
  );
}
