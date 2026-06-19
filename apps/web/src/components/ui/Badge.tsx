import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'indigo';

// Status pills use a subtle tint background + high-contrast text (Precision Core).
// In Stock=green, Low=amber, Out/error=red, processing=blue, shipped=indigo.
const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>
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
