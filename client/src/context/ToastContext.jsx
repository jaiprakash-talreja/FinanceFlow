import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, cls: "text-brand-600 dark:text-brand-400" },
  error: { icon: XCircle, cls: "text-rose-600 dark:text-rose-400" },
  info: { icon: Info, cls: "text-sky-600 dark:text-sky-400" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback((type, title, message) => {
    const id = ++idRef.current;
    setToasts((list) => [...list.slice(-3), { id, type, title, message }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (title, message) => show("success", title, message),
    error: (title, message) => show("error", title, message),
    info: (title, message) => show("info", title, message),
  }), [show]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">
        {toasts.map(({ id, type, title, message }) => {
          const { icon: Icon, cls } = STYLES[type];
          return (
            <div key={id} role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-slide-in items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cls}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{title}</p>
                {message && <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{message}</p>}
              </div>
              <button onClick={() => dismiss(id)} className="rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
