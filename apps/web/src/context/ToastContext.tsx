'use client';
import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastValue {
  toasts: Toast[];
  notify: (message: string, type?: ToastType) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastValue | null>(null);
let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++counter;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  return <ToastContext.Provider value={{ toasts, notify, dismiss }}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
