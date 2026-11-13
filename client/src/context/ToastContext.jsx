import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Check, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: Check, cls: "bg-pos-500 text-white" },
  error: { icon: X, cls: "bg-brand-500 text-[#14130f]" },
  info: { icon: Info, cls: "bg-ink text-paper" },
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
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
        {toasts.map(({ id, type, title, message }) => {
          const { icon: Icon, cls } = STYLES[type];
          return (
            <div key={id} role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-slide-in items-start gap-3 rounded-2xl border border-line/70 bg-card p-4 shadow-lift">
              <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full shadow-clay-sm ${cls}`}><Icon className="h-3.5 w-3.5" strokeWidth={2.5} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{title}</p>
                {message && <p className="mt-0.5 text-[13px] leading-snug text-muted">{message}</p>}
              </div>
              <button onClick={() => dismiss(id)} className="rounded-md p-0.5 text-slate-400 transition hover:text-ink" aria-label="Dismiss">
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
