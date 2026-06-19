// Formatting helpers. Currency uses Intl with the store currency; falls back to
// a plain number if the runtime lacks the locale data.
export function formatCurrency(amount: number, currency = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

// Title-cases a status enum like "in_transit" -> "In transit".
export function titleizeStatus(status: string): string {
  const s = status.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
