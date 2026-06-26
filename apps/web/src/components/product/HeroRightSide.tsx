'use client';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

export function HeroRightSide() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let animationFrameId: number;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;

    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        if (wrapper) wrapper.style.transform = '';
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaQueryChange);
    } else {
      mediaQuery.addListener(handleMediaQueryChange);
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      targetX = (e.clientX - centerX) / 20;
      targetY = (e.clientY - centerY) / 20;
    };

    const handleMouseLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    const animateParallax = () => {
      let scale = 1;
      if (window.innerWidth < 400) {
        scale = 0.72;
      } else if (window.innerWidth < 480) {
        scale = 0.8;
      } else if (window.innerWidth < 640) {
        scale = 0.85;
      } else if (window.innerWidth < 1024) {
        scale = 0.9;
      }

      if (wrapper) {
        if (prefersReducedMotion) {
          wrapper.style.transform = `scale(${scale})`;
        } else {
          currentX += (targetX - currentX) * 0.08;
          currentY += (targetY - currentY) * 0.08;
          wrapper.style.transform = `perspective(1000px) rotateY(${currentX}deg) rotateX(${-currentY}deg) scale(${scale})`;
        }
      }

      animationFrameId = requestAnimationFrame(animateParallax);
    };

    animateParallax();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaQueryChange);
      } else {
        mediaQuery.removeListener(handleMediaQueryChange);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="hero-image-wrapper">
      {/* Background glow rings (behind image) */}
      <div className="hero-glow-ring-1"></div>
      <div className="hero-glow-ring-2"></div>
      <div className="hero-glow-blob"></div>

      {/* Main image card */}
      <div className="hero-image-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/codedrip-hero-shirt.png"
          alt="CodeDrip T-Shirt"
        />
      </div>

      {/* Limited Drop pill (top right of card) */}
      <div className="floating-pill-limited">
        Limited Drop — 47 left
      </div>

      {/* Floating Card 1 — NEW DROP (top left) */}
      <div className="floating-card-new-drop">
        <div className="card-label-row">
          <span className="status-dot"></span>
          <span className="card-label-text">New Drop</span>
        </div>
        <div className="card-command-row">
          <span className="terminal-prompt">$</span>
          <span className="terminal-command">
            sudo npm i -g threads
          </span>
          <span className="terminal-cursor"></span>
        </div>
        <div className="card-meta-row">
          <span className="meta-tag">v2.0.1</span>
          <span className="meta-text">· Just dropped</span>
        </div>
      </div>

      {/* Floating Card 2 — RATING (bottom right) */}
      <div className="floating-card-rating">
        <div className="rating-top-row">
          <div className="stars-row">
            <span className="star-icon">★</span>
            <span className="star-icon">★</span>
            <span className="star-icon">★</span>
            <span className="star-icon">★</span>
            <span className="star-icon">★</span>
          </div>
          <div>
            <span className="rating-score">4.9</span>
            <span className="rating-max">/ 5.0</span>
          </div>
        </div>
        <div className="review-count">
          <span>500+</span> Verified Reviews
        </div>
        <div className="avatar-row">
          <div className="avatar-stack">
            <div className="avatar">👤</div>
            <div className="avatar">👤</div>
            <div className="avatar">👤</div>
            <div className="avatar">👤</div>
          </div>
          <span className="avatar-label">
            +<span>500</span> devs
          </span>
        </div>
      </div>
    </div>
  );
}
