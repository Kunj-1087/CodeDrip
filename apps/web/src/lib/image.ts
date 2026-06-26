export const PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22400%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2214%22 text-anchor=%22middle%22 x=%22200%22 y=%22205%22%3ENo image available%3C/text%3E%3C/svg%3E';

export function buildImageUrl(url: string | null | undefined): string {
  if (!url) return PLACEHOLDER;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${apiUrl}${url}`;
  }
  return url;
}

export function buildProductImageUrl(product: { imageUrl?: string | null; images?: Array<{ url: string; isPrimary: boolean }> }): string {
  if (product.imageUrl) return buildImageUrl(product.imageUrl);
  if (product.images && product.images.length > 0) {
    const primary = product.images.find((i) => i.isPrimary) || product.images[0];
    return buildImageUrl(primary.url);
  }
  return PLACEHOLDER;
}
