'use client';
import { useCallback, useState, useRef, useEffect, type ImgHTMLAttributes } from 'react';
import { buildImageUrl, PLACEHOLDER } from '@/lib/image';
import { cn } from '@/lib/cn';

interface ProductImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
  /** Image URL (relative, absolute, or null/undefined for placeholder). */
  src: string | null | undefined;
  /** Alt text for the image. */
  alt: string;
  /** Optional override for the fallback placeholder URL. */
  fallback?: string;
  /** Additional class names to merge. */
  className?: string;
  /** Whether to show a subtle shimmer background while loading. */
  shimmer?: boolean;
}

/**
 * ProductImage — a drop-in replacement for `<img>` that:
 *  - Resolves relative URLs via buildImageUrl()
 *  - Shows an SVG placeholder on null/missing src
 *  - Falls back to placeholder on image load error
 *  - Uses native lazy loading
 *  - Detects already-cached images so `onLoad` is never missed
 *  - Supports optional shimmer loading state
 *
 * Usage: <ProductImage src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
 */
export function ProductImage({
  src,
  alt,
  fallback,
  className,
  shimmer = false,
  ...imgProps
}: ProductImageProps) {
  const resolvedUrl = buildImageUrl(src);
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Guard against state updates on unmounted components.
  const aliveRef = useRef(true);

  useEffect(() => {
    return () => { aliveRef.current = false; };
  }, []);

  const handleLoad = useCallback(() => {
    if (aliveRef.current) setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    if (aliveRef.current) setImgError(true);
  }, []);

  // Ref callback that fires synchronously when the element mounts so we can
  // detect images already in the browser cache (onLoad won't fire for those).
  const imgRef = useCallback((el: HTMLImageElement | null) => {
    if (!el) return;
    if (el.complete && el.naturalWidth > 0) {
      if (aliveRef.current) setLoaded(true);
    }
  }, []);

  const displaySrc = imgError ? (fallback ?? PLACEHOLDER) : resolvedUrl;
  const isPlaceholder = imgError || !src;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Shimmer overlay while loading (but not for the inline placeholder SVG). */}
      {shimmer && !loaded && !isPlaceholder && (
        <div className="absolute inset-0 skeleton z-10" />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={displaySrc}
        alt={alt}
        loading="lazy"
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          'h-full w-full transition-opacity duration-200',
          loaded || isPlaceholder ? 'opacity-100' : 'opacity-0',
        )}
        {...imgProps}
      />
    </div>
  );
}
