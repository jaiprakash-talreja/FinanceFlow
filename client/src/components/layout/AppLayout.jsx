import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowLeftRight, LayoutDashboard, LogOut, Menu, MessageCircle, Moon, PiggyBank,
  ShieldCheck, Sun, Tags, UserRound, Users, X, Inbox,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useSocket } from "../../context/SocketContext";
import NotificationBell from "../NotificationBell";
import Logo from "../Logo";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/support", label: "Support chat", icon: MessageCircle, userOnly: true },
  { to: "/profile", label: "Profile", icon: UserRound },
];

const ADMIN_NAV = [
  { to: "/admin", label: "Overview", icon: ShieldCheck, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/support", label: "Support inbox", icon: Inbox },
];

function NavItem({ to, label, icon: Icon, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
        }`
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {label}
    </NavLink>
  );
}

function Sidebar({ onNavigate }) {
  const { user, isAdmin, logout } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5"><Logo /></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Main">
        {NAV.filter((n) => !(n.userOnly && isAdmin)).map((n) => <NavItem key={n.to} {...n} onNavigate={onNavigate} />)}
        {isAdmin && (
          <>
            <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Admin</p>
            {ADMIN_NAV.map((n) => <NavItem key={n.to} {...n} onNavigate={onNavigate} />)}
          </>
        )}
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button onClick={logout} className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800" title="Log out" aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [drawer, setDrawer] = useState(false);
  const { toggle, isDark } = useTheme();
  const { connected } = useSocket();
  const location = useLocation();

  useEffect(() => setDrawer(false), [location.pathname]);

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile / tablet drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-slate-950/50" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-slide-in bg-white shadow-xl dark:bg-slate-900">
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:px-6">
        <button onClick={() => setDrawer(true)} className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="lg:hidden"><Logo compact /></div>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <span className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-slate-500 sm:flex" title={connected ? "Real-time updates on" : "Reconnecting…"}>
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-brand-500" : "bg-amber-400 animate-pulse"}`} />
            {connected ? "Live" : "Offline"}
          </span>
          <button onClick={toggle} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Toggle dark mode">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <NotificationBell />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
