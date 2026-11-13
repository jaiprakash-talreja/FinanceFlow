import { BellRing, MessageCircle, PiggyBank } from "lucide-react";
import Logo from "../../components/Logo";

const POINTS = [
  { icon: PiggyBank, text: "Monthly budgets with alerts at 80% and 100%" },
  { icon: BellRing, text: "Live notifications across all your devices" },
  { icon: MessageCircle, text: "Real-time chat with the support team" },
];

// Split-screen layout shared by the login and register pages.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative [&_a]:text-white"><Logo /></div>
        <div className="relative">
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">Know where every rupee goes.</h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-brand-100">
                <span className="rounded-lg bg-white/10 p-2"><Icon className="h-5 w-5" /></span>{text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-brand-200/70">FinanceFlow · Full Stack Development mini project</p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
