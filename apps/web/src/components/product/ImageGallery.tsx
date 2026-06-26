'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProductImage } from '@/types';
import { ProductImage as ProductImageComponent } from '@/components/ui/ProductImage';
import { cn } from '@/lib/cn';

const PLACEHOLDER_IMG: ProductImage = { id: 'ph', url: '', altText: null, sortOrder: 0, isPrimary: true };

export function ImageGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const list = images.length > 0 ? images : [PLACEHOLDER_IMG];
  const [active, setActive] = useState(0);
  
  // Lightbox overlay states
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxActiveIndex, setLightboxActiveIndex] = useState(0);
  
  // Gesture states
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  // Hover zoom states (desktop)
  const [zoomOrigin, setZoomOrigin] = useState('center');
  const [zoomed, setZoomed] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const initialPinchDistance = useRef(0);
  const initialScale = useRef(1);
  const isZoomed = useRef(false);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    if (width > 0) {
      const index = Math.round(scrollLeft / width);
      setActive(index);
    }
  };

  const scrollToImage = (index: number) => {
    if (carouselRef.current) {
      const width = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth',
      });
      setActive(index);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxActiveIndex(index);
    setLightboxOpen(true);
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  };

  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, []);

  // Gestures for Lightbox
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      isZoomed.current = scale > 1;

      const now = Date.now();
      if (now - lastTap < 300) {
        if (scale > 1) {
          setScale(1);
          setTranslateX(0);
          setTranslateY(0);
        } else {
          setScale(2.5);
        }
      }
      setLastTap(now);
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      initialPinchDistance.current = dist;
      initialScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const diffY = touch.clientY - touchStartY.current;
      const diffX = touch.clientX - touchStartX.current;

      if (scale > 1) {
        setTranslateX(diffX);
        setTranslateY(diffY);
      } else {
        if (diffY > 30 && Math.abs(diffY) > Math.abs(diffX)) {
          setTranslateY(diffY);
        } else {
          setTranslateX(diffX);
        }
      }
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const nextScale = (dist / initialPinchDistance.current) * initialScale.current;
      setScale(Math.max(1, Math.min(nextScale, 4)));
    }
  };

  const handleTouchEnd = () => {
    if (scale === 1) {
      if (translateY > 120) {
        closeLightbox();
      } else if (translateX > 80 && lightboxActiveIndex > 0) {
        setLightboxActiveIndex((idx) => idx - 1);
      } else if (translateX < -80 && lightboxActiveIndex < list.length - 1) {
        setLightboxActiveIndex((idx) => idx + 1);
      }
    }
    if (scale === 1 || translateY <= 120) {
      setTranslateX(0);
      setTranslateY(0);
    }
  };

  return (
    <div>
      {/* Mobile Swipeable Gallery with dots */}
      <div className="md:hidden">
        <div className="relative aspect-square overflow-hidden bg-surface-2 rounded-xl">
          <div
            ref={carouselRef}
            onScroll={onScroll}
            className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-none"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {list.map((img, i) => (
              <div
                key={img.id}
                onClick={() => openLightbox(i)}
                className="h-full w-full flex-shrink-0 snap-center cursor-zoom-in"
              >
                <ProductImageComponent
                  src={img.url}
                  alt={img.altText || `${name} ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {list.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {list.map((_, i) => (
              <span
                key={i}
                onClick={() => scrollToImage(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  active === i ? "bg-primary w-3" : "bg-white/20 w-1.5"
                )}
              />
            ))}
          </div>
        )}

        {/* Thumbnail strip (hide on very small screens, show sm:flex) */}
        {list.length > 1 && (
          <div className="hidden sm:flex mt-4 gap-2 overflow-x-auto pb-1 scrollbar-none">
            {list.map((img, i) => (
              <button
                key={img.id}
                onClick={() => scrollToImage(i)}
                aria-label={`View image ${i + 1}`}
                className={cn(
                  "h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                  active === i ? "border-primary" : "border-border bg-surface-2"
                )}
              >
                <ProductImageComponent
                  src={img.url}
                  alt={img.altText || `${name} ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Gallery */}
      <div className="hidden md:block">
        <div 
          onClick={() => openLightbox(active)}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setZoomed(true)}
          onMouseLeave={() => { setZoomed(false); setZoomOrigin('center'); }}
          className="card aspect-square overflow-hidden bg-surface-2 rounded-2xl cursor-zoom-in relative"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="h-full w-full"
            >
              <ProductImageComponent
                src={list[active].url}
                alt={list[active].altText || name}
                style={{
                  transformOrigin: zoomOrigin,
                  transform: zoomed ? 'scale(2.2)' : 'scale(1)',
                  transition: zoomed ? 'none' : 'transform 0.25s ease-out',
                }}
                className="h-full w-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>
        {list.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
            {list.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${i === active ? 'border-primary' : 'border-white/5 hover:border-white/20'}`}
              >
                <ProductImageComponent
                  src={img.url}
                  alt={img.altText || `${name} ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between w-full p-5 z-50">
              <span className="text-xs font-mono text-muted">
                {lightboxActiveIndex + 1} / {list.length}
              </span>
              <button
                onClick={closeLightbox}
                className="text-xs font-mono text-primary hover:text-accent border border-primary/20 px-2 py-1 rounded bg-black/40"
              >
                [close]
              </button>
            </div>

            {/* Interactive Zoomable Image container */}
            <div
              className="flex-1 w-full flex items-center justify-center overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                style={{
                  transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                  transition: translateX !== 0 || translateY !== 0 ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="w-full max-h-[75vh] flex justify-center items-center"
              >
                <img
                  src={list[lightboxActiveIndex].url}
                  alt={list[lightboxActiveIndex].altText || name}
                  className="max-w-full max-h-[75vh] object-contain pointer-events-none"
                />
              </div>
            </div>

            {/* Footer help */}
            <div className="p-4 text-center text-[10px] font-mono text-muted/60 bg-gradient-to-t from-black/40 to-transparent">
              // pinch to zoom • double tap to scale • swipe down to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
