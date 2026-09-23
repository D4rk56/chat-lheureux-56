import React, { createContext, useContext, useState, useCallback } from 'react';
import { Heart, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext({
  showToast: () => {},
  removeToast: () => {}
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((title, message, type = 'success', duration = 3200) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    const newToast = { id, title, message, type };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div 
        aria-live="polite" 
        className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2.5 pointer-events-none sm:max-w-md"
      >
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isHeart = toast.type === 'heart';
          const isInfo = toast.type === 'info';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-md transition-all transform duration-300 animate-in fade-in slide-in-from-top-2 border ${
                isError 
                  ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
                  : isHeart
                  ? 'bg-slate-900/95 border-pink-500/50 text-white'
                  : isInfo
                  ? 'bg-slate-900/95 border-blue-500/50 text-slate-100'
                  : 'bg-slate-900/95 border-emerald-500/50 text-emerald-100'
              }`}
            >
              <div 
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                  isError 
                    ? 'bg-rose-500/20 text-rose-400' 
                    : isHeart
                    ? 'bg-pink-500/20 text-pink-400'
                    : isInfo
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {isError ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : isHeart ? (
                  <Heart className="w-4 h-4 fill-pink-400" />
                ) : isInfo ? (
                  <Info className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <strong className="block text-xs font-bold text-white truncate">
                  {toast.title}
                </strong>
                {toast.message && (
                  <span className="text-[11px] text-slate-300 block truncate">
                    {toast.message}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
