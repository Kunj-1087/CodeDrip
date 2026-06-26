'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  stagger?: number;
  className?: string;
  staggerChildren?: boolean;
}

export function ScrollReveal({
  children,
  delay = 0,
  duration = 0.5,
  y = 30,
  stagger = 0.08,
  className,
  staggerChildren = false,
}: ScrollRevealProps) {
  if (staggerChildren) {
    return (
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: stagger,
            },
          },
        }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration, delay, ease: [0.215, 0.61, 0.355, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRevealItem({ 
  children, 
  y = 30, 
  duration = 0.5 
}: { 
  children: ReactNode; 
  y?: number; 
  duration?: number 
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0, transition: { duration, ease: [0.215, 0.61, 0.355, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
