const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const PLACEHOLDER_BLUR = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export function buildImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildProductImageUrl(product: { imageUrl?: string | null }): string | null {
  return buildImageUrl(product.imageUrl);
}

export { PLACEHOLDER_BLUR };
