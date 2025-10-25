"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import styles from "./toast.module.scss";

type Toast = {
  id: string;
  type?: "success" | "error" | "info";
  message: string;
  timeout?: number;
};

type ToastContextType = {
  addToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const addToast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const toast: Toast = { id, ...t };
      setToasts((prev) => [toast, ...prev]);

      const timeout = toast.timeout ?? 3500;
      window.setTimeout(() => removeToast(id), timeout);
    },
    [removeToast]
  );

  const toastContent = (
    <div className={styles.container} aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${styles[t.type || "info"]}`}
        >
          <div className={styles.message}>{t.message}</div>
          <button
            className={styles.close}
            onClick={() => removeToast(t.id)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Render portal into server-rendered placeholder to avoid hydration mismatch */}
      {mounted && typeof document !== "undefined"
        ? (() => {
            const root = document.getElementById("__toast_root");
            if (root) return createPortal(toastContent, root);
            // Fallback: render inline if no root exists
            return toastContent;
          })()
        : null}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
