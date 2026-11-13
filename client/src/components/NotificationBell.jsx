import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Megaphone, MessageCircle, PiggyBank, Sparkles } from "lucide-react";
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
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white" aria-label={`Notifications (${unread} unread)`}>
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 z-50 animate-slide-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {items.length === 0 && <li className="px-4 py-10 text-center text-sm text-slate-500">You're all caught up.</li>}
            {items.map((n) => {
              const Icon = ICONS[n.kind] || Sparkles;
              return (
                <li key={n._id}>
                  <button onClick={() => !n.read && markRead(n._id)} className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${n.read ? "opacity-70" : ""}`}>
                    <span className="mt-0.5 rounded-lg bg-slate-100 p-1.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {n.title}
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">{n.message}</span>
                      <span className="mt-1 block text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
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
