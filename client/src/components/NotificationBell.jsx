import { useEffect, useRef, useState } from "react";
import { Bell, Megaphone, MessageCircle, PiggyBank, Sparkles } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { timeAgo } from "../lib/format";

const ICONS = { budget: PiggyBank, announcement: Megaphone, chat: MessageCircle, system: Sparkles };

export default function NotificationBell() {
  const { items, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className={`relative rounded-xl p-2.5 transition hover:bg-slate-200/50 hover:text-ink dark:hover:bg-slate-800 ${open ? "bg-slate-200/50 text-ink dark:bg-slate-800" : "text-muted"}`}
        aria-label={`Notifications (${unread} unread)`}>
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-[#14130f] ring-2 ring-paper">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 z-50 animate-slide-in overflow-hidden rounded-3xl border border-line/70 bg-card shadow-lift sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px]">
          <div className="flex items-center justify-between px-5 pb-2 pt-5">
            <p className="font-serif-display text-xl">Notifications</p>
            {unread > 0 && <button onClick={markAllRead} className="link text-xs">Mark all read</button>}
          </div>
          <ul className="max-h-[60vh] overflow-y-auto px-2 pb-2">
            {items.length === 0 && <li className="px-4 py-12 text-center text-sm text-muted">You're all caught up.</li>}
            {items.map((n) => {
              const Icon = ICONS[n.kind] || Sparkles;
              return (
                <li key={n._id}>
                  <button onClick={() => !n.read && markRead(n._id)}
                    className={`flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800/60 ${n.read ? "opacity-60" : ""}`}>
                    <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${n.kind === "budget" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15" : "bg-slate-100 text-muted dark:bg-slate-800"}`}>
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {n.title}
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-muted">{n.message}</span>
                      <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
