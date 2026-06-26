'use client';
import { useToast, type ToastType } from '@/context/ToastContext';
import { cn } from '@/lib/cn';

// Per-type accent (left border + icon color) and the matching glyph. `info` uses
// the brand color so neutral notifications still feel on-brand.
const ACCENT: Record<ToastType, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-primary',
};
const BORDER: Record<ToastType, string> = {
  success: 'before:bg-success',
  error: 'before:bg-danger',
  info: 'before:bg-primary',
};

function ToastIcon({ type }: { type: ToastType }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: cn('h-5 w-5 flex-shrink-0', ACCENT[type]),
    'aria-hidden': true,
  } as const;
  if (type === 'success') return <svg {...common}><path d="M20 6 9 17l-5-5" /></svg>;
  if (type === 'error')
    return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>;
}

// Fixed, screen-reader-announced toast stack. Mounted once by Providers. The 3.5s
// progress bar mirrors the auto-dismiss timer in ToastContext, so the shrinking
// bar is an honest countdown to dismissal.
export function ToastViewport() {
  const { toasts, dismiss } = useToast();
  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[min(92vw,24rem)] flex-col gap-3"
      aria-live="polite"
      role="status"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'group pointer-events-auto relative animate-toast-in overflow-hidden rounded-lg border border-border bg-surface pl-4 pr-3 py-3.5 shadow-xl',
            // 3px left accent rail via a ::before bar.
            "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:content-['']",
            BORDER[t.type],
          )}
        >
          <div className="flex items-start gap-3">
            <ToastIcon type={t.type} />
            <p className="flex-1 pt-0.5 text-sm font-medium leading-snug text-ink">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="-mr-1 grid h-6 w-6 flex-shrink-0 place-items-center rounded-md text-faint transition-colors hover:bg-surface-3 hover:text-ink"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Countdown bar — shrinks across the dismiss window, tinted to the type. */}
          <span
            className={cn('absolute bottom-0 left-0 h-0.5 w-full origin-left animate-[toast-countdown_3.5s_linear_forwards]', ACCENT[t.type])}
            style={{ backgroundColor: 'currentColor' }}
            aria-hidden="true"
          />
        </div>
      ))}
    </div>
  );
}
