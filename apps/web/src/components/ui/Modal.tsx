'use client';
import { useEffect, useRef, type ReactNode } from 'react';

// Accessible modal: ESC to close, click-outside to close, focus moved in on open,
// scroll locked while open. role=dialog + aria-modal for assistive tech.
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card w-full max-w-lg animate-slide-up p-6 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="mb-4 text-lg font-semibold text-ink">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
