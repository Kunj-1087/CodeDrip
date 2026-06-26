'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GhostItem {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  imageUrl: string;
}

export function CartFlyAnimation() {
  const [ghosts, setGhosts] = useState<GhostItem[]>([]);

  useEffect(() => {
    const handleAnimate = (e: Event) => {
      const customEvent = e as CustomEvent<{ startX: number; startY: number; imageUrl: string }>;
      const { startX, startY, imageUrl } = customEvent.detail;

      // Find cart icon element in Navbar or BottomNav
      const cartIcon = document.getElementById('cart-icon-nav') || document.getElementById('cart-icon-bottom');
      let endX = window.innerWidth - 80;
      let endY = 40;

      if (cartIcon) {
        const rect = cartIcon.getBoundingClientRect();
        endX = rect.left + rect.width / 2;
        endY = rect.top + rect.height / 2;
      }

      const id = `${Date.now()}-${Math.random()}`;
      setGhosts((curr) => [
        ...curr,
        { id, startX, startY, endX, endY, imageUrl },
      ]);

      // Trigger the bounce animation on the cart icon when ghost arrives (after 600ms)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('cart-bounce'));
      }, 600);

      // Clean up ghost state after animation completes
      setTimeout(() => {
        setGhosts((curr) => curr.filter((g) => g.id !== id));
      }, 800);
    };

    window.addEventListener('add-to-cart-animate', handleAnimate);
    return () => {
      window.removeEventListener('add-to-cart-animate', handleAnimate);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {ghosts.map((g) => (
          <motion.div
            key={g.id}
            initial={{
              position: 'fixed',
              left: 0,
              top: 0,
              x: g.startX - 32, // center the 64px image
              y: g.startY - 32,
              scale: 1,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              x: g.endX - 12, // match target size
              y: g.endY - 12,
              scale: [1, 0.7, 0.2],
              rotate: [0, 45, 180],
              opacity: [1, 0.9, 0],
            }}
            transition={{
              duration: 0.7,
              ease: [0.25, 0.46, 0.45, 0.94], // quadratic ease
            }}
            className="h-16 w-16 rounded-xl border border-primary/20 bg-surface shadow-lg overflow-hidden flex items-center justify-center p-1"
          >
            {/* Using standard img for the temporary ghost image */}
            <img src={g.imageUrl} alt="" className="h-full w-full object-cover rounded-lg" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
