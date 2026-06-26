import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'indigo';
type Size = 'sm' | 'md';

// Status pills: a subtle tint of the tone's own color + high-contrast text. Tints
// are token-based alphas so they adapt to light/dark automatically. Uppercase +
// wide tracking reads as a precise system label, not body copy.
const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-muted',
  success: 'bg-success/[0.12] text-success',
  warning: 'bg-warning/[0.14] text-warning',
  danger: 'bg-danger/[0.12] text-danger',
  info: 'bg-info/10 text-info',
  brand: 'bg-primary-light text-primary',
  indigo: 'bg-info/10 text-info',
};

const SIZES: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
};

export function Badge({
  children,
  tone = 'neutral',
  size = 'md',
}: {
  children: ReactNode;
  tone?: Tone;
  size?: Size;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold uppercase tracking-wider',
        TONES[tone],
        SIZES[size],
      )}
    >
      {children}
    </span>
  );
}

// Maps an order/stock status string to an appropriate badge tone.
export function statusTone(status: string): Tone {
  switch (status) {
    case 'paid':
    case 'delivered':
      return 'success';
    case 'pending':
      return 'warning';
    case 'processing':
      return 'info';
    case 'shipped':
      return 'indigo';
    case 'failed':
    case 'cancelled':
    case 'refunded':
      return 'danger';
    default:
      return 'neutral';
  }
}
