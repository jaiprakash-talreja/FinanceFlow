import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import useSocketEvent from "../hooks/useSocketEvent";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    const res = await api("/notifications");
    setItems(res.items);
    setUnread(res.unread);
  }, []);

  useEffect(() => {
    if (!user) { setItems([]); setUnread(0); return; }
    refresh().catch(() => {});
  }, [user, refresh]);

  // Live notifications pushed by the server
  useSocketEvent("notification:new", (n) => {
    setItems((list) => [n, ...list].slice(0, 30));
    setUnread((c) => c + 1);
    toast.info(n.title, n.message);
  });

  const markRead = useCallback(async (id) => {
    setItems((list) => list.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
    await api(`/notifications/${id}/read`, { method: "PATCH" }).catch(() => refresh());
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await api("/notifications/read-all", { method: "PATCH" }).catch(() => refresh());
  }, [refresh]);

  const value = useMemo(() => ({ items, unread, markRead, markAllRead, refresh }), [items, unread, markRead, markAllRead, refresh]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}
