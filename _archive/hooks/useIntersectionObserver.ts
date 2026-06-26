'use client';
import { useEffect, useRef, useState } from 'react';

// Reports when the observed element first enters the viewport — used for
// lazy reveal / fade-in of below-the-fold sections.
export function useIntersectionObserver<T extends Element>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isVisible) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, options ?? { rootMargin: '0px 0px -10% 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible, options]);

  return { ref, isVisible };
}
