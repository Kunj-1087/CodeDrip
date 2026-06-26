// Presentation helpers. The API speaks numbers; the UI speaks ₹ and human dates.

/** ₹ with Indian digit grouping (1,00,000) and no decimals for whole rupees. */
export function formatCurrency(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const hasPaise = Math.round(value * 100) % 100 !== 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Bare grouped number without the symbol, e.g. for "Save ₹1,200". */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(
    Number.isFinite(amount) ? amount : 0,
  );
}

/** Discount percentage from compare-at vs sale price; null when not on sale. */
export function discountPercent(basePrice: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= basePrice) return null;
  return Math.round(((compareAt - basePrice) / compareAt) * 100);
}

export function savingsAmount(basePrice: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= basePrice) return null;
  return compareAt - basePrice;
}

/** "20 Jun 2026" */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/** "20 Jun 2026, 4:30 PM" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

/** "2 items" / "1 item" */
export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : plural ?? `${singular}s`}`;
}

/** Two-letter initials for the avatar fallback. */
export function initials(firstName?: string, lastName?: string): string {
  const a = firstName?.trim()?.[0] ?? '';
  const b = lastName?.trim()?.[0] ?? '';
  const result = `${a}${b}`.toUpperCase();
  return result || '?';
}

/** Human label for a fulfillment/payment status enum. */
export function titleCaseStatus(status: string): string {
  return status
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
