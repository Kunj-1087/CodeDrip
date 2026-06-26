'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Size = 'sm' | 'md' | 'lg';
const SIZES: Record<Size, string> = {
  sm: 'max-w-[480px]',
  md: 'max-w-[640px]',
  lg: 'max-w-[800px]',
};

// Accessible modal: ESC + click-outside close, scroll locked while open, focus
// moved in on open and trapped within (Tab/Shift+Tab cycle the focusables), and
// restored to the trigger on close. role=dialog + aria-modal for assistive tech.
export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: Size;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      // Keep focus inside the panel by wrapping at the first/last focusable.
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 p-0 md:items-center md:justify-center md:p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full border border-border bg-[#0C0C0E] p-6 shadow-xl outline-none',
          'rounded-t-2xl rounded-b-none border-b-0 max-h-[85vh] overflow-y-auto animate-sheet-up', // Mobile bottom sheet
          'md:rounded-xl md:border-b md:max-h-none md:overflow-y-visible md:animate-scale-in', // Desktop modal
          SIZES[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/10 md:hidden" />

        {/* Ghost icon close button, top-right. */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-3 top-3 grid h-11 w-11 md:h-9 md:w-9 place-items-center rounded-full text-faint transition-colors hover:bg-surface-3 hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {title && <h2 className="mb-4 pr-8 text-2xl font-bold tracking-tight text-ink font-mono">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
