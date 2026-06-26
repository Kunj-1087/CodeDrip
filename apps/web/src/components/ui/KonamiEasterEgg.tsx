'use client';
import { useEffect, useRef } from 'react';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export function KonamiEasterEgg() {
  const idx = useRef(0);
  const applied = useRef(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (applied.current) return;

      if (e.key === KONAMI[idx.current]) {
        idx.current++;
        if (idx.current === KONAMI.length) {
          applied.current = true;
          triggerEgg();
        }
      } else {
        idx.current = 0;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return null;
}

function triggerEgg() {
  // Auto-apply discount in localStorage
  try {
    const stored = JSON.parse(localStorage.getItem('codedrip_konami_discount') || 'null');
    if (!stored) {
      localStorage.setItem('codedrip_konami_discount', JSON.stringify({ active: true, code: 'KONAMICODE', discount: 15 }));
    }
  } catch {}

  // Confetti
  const colors = ['#58a6ff', '#3fb950', '#f85149', '#d29922', '#bc8cff', '#f0db4f'];
  const container = document.body;

  for (let i = 0; i < 100; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed;
      z-index: 9999;
      pointer-events: none;
      width: ${Math.random() * 8 + 4}px;
      height: ${Math.random() * 8 + 4}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      left: ${Math.random() * 100}vw;
      top: -10px;
      opacity: 1;
      transition: none;
    `;
    container.appendChild(el);

    const x = (Math.random() - 0.5) * 200;
    const duration = Math.random() * 2000 + 1500;

    el.animate([
      { transform: `translateY(0) translateX(0) rotate(0deg)`, opacity: 1 },
      { transform: `translateY(${window.innerHeight + 20}px) translateX(${x}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
    ], {
      duration,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    }).onfinish = () => el.remove();
  }

  // Toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    background: #161b22;
    border: 1px solid #58a6ff;
    color: #58a6ff;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
    animation: fade-in 0.3s ease-out;
  `;
  toast.textContent = '🎉 Konami code activated! 15% discount auto-applied at checkout.';
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
