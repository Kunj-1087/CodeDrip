import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted border-border',
  success: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  danger: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}

// Maps an order status string to an appropriate badge tone.
export function statusTone(status: string): Tone {
  switch (status) {
    case 'paid':
    case 'delivered':
      return 'success';
    case 'pending':
    case 'processing':
      return 'warning';
    case 'shipped':
      return 'info';
    case 'failed':
    case 'cancelled':
    case 'refunded':
      return 'danger';
    default:
      return 'neutral';
  }
}
