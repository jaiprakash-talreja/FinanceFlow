import { Link } from "react-router-dom";

export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-brand-600" />
        <path d="M9 21l5-6 4 3 5-7" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && <span className="text-lg">Finance<span className="text-brand-600 dark:text-brand-400">Flow</span></span>}
    </Link>
  );
}
