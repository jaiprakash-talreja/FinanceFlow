import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowLeftRight, Inbox, LayoutGrid, LogOut, Menu, MessageCircle, Moon, PiggyBank,
  ShieldCheck, Sun, Tags, UserRound, Users, X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useSocket } from "../../context/SocketContext";
import NotificationBell from "../NotificationBell";
import Logo from "../Logo";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/support", label: "Support", icon: MessageCircle, userOnly: true },
  { to: "/profile", label: "Profile", icon: UserRound },
];

const ADMIN_NAV = [
  { to: "/admin", label: "Admin overview", icon: ShieldCheck, end: true },
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
        `group flex items-center gap-3 rounded-clay px-3 py-2.5 text-[14px] transition duration-200 ease-soft ${
          isActive
            ? "bg-card font-medium text-ink shadow-clay-sm ring-1 ring-line/70"
            : "text-muted hover:bg-slate-200/40 hover:text-ink dark:hover:bg-slate-800/60"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`h-[18px] w-[18px] shrink-0 transition ${isActive ? "text-brand-500" : ""}`} strokeWidth={1.75} />
          {label}
        </>
      )}
    </NavLink>
  );
}

function Sidebar({ onNavigate }) {
  const { user, isAdmin, logout } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center px-6"><Logo /></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2" aria-label="Main">
        {NAV.filter((n) => !(n.userOnly && isAdmin)).map((n) => <NavItem key={n.to} {...n} onNavigate={onNavigate} />)}
        {isAdmin && (
          <>
            <p className="px-3 pb-2 pt-6 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Admin</p>
            {ADMIN_NAV.map((n) => <NavItem key={n.to} {...n} onNavigate={onNavigate} />)}
          </>
        )}
      </nav>
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-clay-sm ring-1 ring-line/70">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink font-serif-display text-lg text-paper">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <button onClick={logout} className="rounded-lg p-2 text-muted transition hover:bg-slate-200/60 hover:text-brand-600 dark:hover:bg-slate-800" title="Log out" aria-label="Log out">
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
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
    <div className="min-h-screen lg:pl-[272px]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[272px] lg:block">
        <Sidebar />
      </aside>

      {/* Mobile / tablet drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-[#14130f]/35 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-2 left-2 w-72 max-w-[85vw] animate-slide-in rounded-[28px] border border-line/70 bg-paper shadow-lift">
            <button onClick={() => setDrawer(false)} className="absolute right-4 top-6 rounded-full p-1.5 text-muted hover:bg-slate-200/60 dark:hover:bg-slate-800" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-paper/80 px-4 backdrop-blur-md sm:px-6 lg:h-20 lg:px-10">
        <button onClick={() => setDrawer(true)} className="rounded-xl p-2 text-ink hover:bg-slate-200/50 dark:hover:bg-slate-800 lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <div className="lg:hidden"><Logo compact /></div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="mr-1 hidden items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs text-muted shadow-clay-sm ring-1 ring-line/70 sm:flex" title={connected ? "Real-time updates on" : "Reconnecting…"}>
            <span className="relative flex h-2 w-2">
              {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pos-500 opacity-40" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? "bg-pos-500" : "bg-[#d9a441]"}`} />
            </span>
            {connected ? "Live" : "Connecting"}
          </span>
          <button onClick={toggle} className="rounded-xl p-2.5 text-muted transition hover:bg-slate-200/50 hover:text-ink dark:hover:bg-slate-800" aria-label="Toggle dark mode">
            {isDark ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />}
          </button>
          <NotificationBell />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 sm:px-6 lg:px-10 lg:pt-2">
        <Outlet />
      </main>
    </div>
  );
}
