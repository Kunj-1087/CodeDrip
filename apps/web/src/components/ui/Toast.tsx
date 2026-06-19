'use client';
import { useToast, type ToastType } from '@/context/ToastContext';

const STYLES: Record<ToastType, string> = {
  success: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
  info: 'border-border bg-surface text-ink',
};

// Fixed, screen-reader-announced toast stack. Mounted once by Providers.
export function ToastViewport() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,22rem)] flex-col gap-2" aria-live="polite" role="status">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto animate-slide-up rounded-xl border px-4 py-3 text-left text-sm shadow-card ${STYLES[t.type]}`}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
