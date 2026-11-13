import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setUnauthorizedHandler, tokenStore } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => tokenStore.get());
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const clear = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setUser(null);
  }, []);

  // Any 401 from the API (expired token, deactivated account) logs the user out.
  useEffect(() => setUnauthorizedHandler(clear), [clear]);

  // Restore the session on page load.
  useEffect(() => {
    if (!token) return;
    const ctrl = new AbortController();
    api("/auth/me", { signal: ctrl.signal })
      .then((res) => setUser(res.user))
      .catch((err) => { if (err.name !== "AbortError") clear(); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = useCallback(({ token: t, user: u }) => {
    tokenStore.set(t);
    setToken(t);
    setUser(u);
  }, []);

  const login = useCallback(async (email, password) => {
    startSession(await api("/auth/login", { method: "POST", body: { email, password } }));
  }, [startSession]);

  const register = useCallback(async (name, email, password) => {
    startSession(await api("/auth/register", { method: "POST", body: { name, email, password } }));
  }, [startSession]);

  const logout = useCallback(async () => {
    try { await api("/auth/logout", { method: "POST" }); } catch { /* token may already be invalid */ }
    clear();
  }, [clear]);

  const value = useMemo(() => ({
    user, token, loading,
    isAdmin: user?.role === "admin",
    login, register, logout, setUser, startSession,
  }), [user, token, loading, login, register, logout, startSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
