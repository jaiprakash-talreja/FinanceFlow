import Spinner from "./Spinner";

const VARIANTS = {
  // Orange clay button with dark text
  primary: "bg-brand-500 text-[#14130f] shadow-clay hover:bg-brand-400 focus-visible:ring-brand-500/40",
  secondary: "bg-card text-ink shadow-clay-sm ring-1 ring-line hover:bg-slate-100 focus-visible:ring-slate-400/40 dark:hover:bg-slate-800",
  danger: "bg-brand-700 text-white shadow-clay hover:bg-brand-800 focus-visible:ring-brand-700/40",
  ghost: "text-muted hover:bg-slate-200/50 hover:text-ink focus-visible:ring-slate-400/40 dark:hover:bg-slate-800",
};

const SIZES = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-[10px]",
  md: "h-10 px-4 text-sm gap-2 rounded-clay",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-clay",
  icon: "h-9 w-9 justify-center rounded-[10px]",
};

export default function Button({ variant = "primary", size = "md", loading = false, icon: Icon, className = "", children, disabled, ...props }) {
  return (
    <button
      className={`inline-flex select-none items-center justify-center font-medium transition duration-200 ease-soft
        focus-visible:outline-none focus-visible:ring-4 active:translate-y-px active:shadow-none
        disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner className="h-4 w-4" /> : Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />}
      {children}
    </button>
  );
}
