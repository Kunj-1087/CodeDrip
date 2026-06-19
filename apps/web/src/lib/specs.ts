import type { Product } from '@/types';

// Pick the most buyer-relevant spec VALUES for the compact mono pills shown on
// product cards (e.g. "1TB", "NVMe PCIe 4.0", "7450MB/s"). Order matters: the
// first present keys win, capped at `limit` so cards stay tidy.
const PRIORITY = [
  'capacity',
  'speed',
  'interface',
  'read_speed',
  'form_factor',
  'cas_latency',
  'volume',
  'length',
];

export function topSpecs(product: Pick<Product, 'specs'>, limit = 3): string[] {
  const specs = product.specs ?? {};
  const values: string[] = [];

  for (const key of PRIORITY) {
    if (specs[key] && !values.includes(String(specs[key]))) values.push(String(specs[key]));
    if (values.length >= limit) return values;
  }
  // Fall back to any remaining spec values if priority keys were sparse.
  for (const v of Object.values(specs)) {
    const s = String(v);
    if (!values.includes(s)) values.push(s);
    if (values.length >= limit) break;
  }
  return values.slice(0, limit);
}
