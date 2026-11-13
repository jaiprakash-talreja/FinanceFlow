import { Link } from "react-router-dom";

// Two stacked, tilted clay cards: ink + orange.
export function LogoMark({ className = "h-7 w-7" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="13" y="4" width="14" height="20" rx="5" className="fill-ink" transform="rotate(14 20 14)" />
      <rect x="4" y="8" width="14" height="20" rx="5" fill="#ff5f2e" transform="rotate(-10 11 18)" />
    </svg>
  );
}

export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-ink">
      <LogoMark />
      {!compact && <span className="font-serif-display text-[1.4rem] leading-none">FinanceFlow</span>}
    </Link>
  );
}
