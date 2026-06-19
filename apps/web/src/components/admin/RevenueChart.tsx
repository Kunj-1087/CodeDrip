'use client';
import { useEffect, useRef } from 'react';

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

// Revenue line chart drawn with the RAW Canvas 2D API — no chart library.
// Handles devicePixelRatio for crisp rendering and resizes with its container.
export function RevenueChart({ data, currency = 'INR' }: { data: RevenuePoint[]; currency?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const cssW = wrap.clientWidth;
      const cssH = 280;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const pad = { top: 20, right: 16, bottom: 28, left: 56 };
      const w = cssW - pad.left - pad.right;
      const h = cssH - pad.top - pad.bottom;

      // Resolve theme colors from CSS variables (channel triplets).
      const css = getComputedStyle(document.documentElement);
      const rgb = (name: string) => `rgb(${css.getPropertyValue(name).trim() || '37 99 235'})`;
      const primary = rgb('--color-primary');
      const border = rgb('--color-border');
      const muted = rgb('--color-text-muted');

      const max = Math.max(1, ...data.map((d) => d.revenue));
      const niceMax = Math.ceil(max / 4) * 4 || 4;
      const x = (i: number) => pad.left + (data.length <= 1 ? 0 : (i / (data.length - 1)) * w);
      const y = (v: number) => pad.top + h - (v / niceMax) * h;

      // Gridlines + y labels.
      ctx.strokeStyle = border;
      ctx.fillStyle = muted;
      ctx.font = '11px system-ui, sans-serif';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const gy = pad.top + (i / 4) * h;
        ctx.beginPath();
        ctx.moveTo(pad.left, gy);
        ctx.lineTo(pad.left + w, gy);
        ctx.stroke();
        const val = Math.round(niceMax - (i / 4) * niceMax);
        ctx.fillText(`${currency === 'INR' ? '₹' : ''}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`, 6, gy + 4);
      }

      if (data.length > 0) {
        // Area fill under the line.
        ctx.beginPath();
        ctx.moveTo(x(0), y(data[0].revenue));
        data.forEach((d, i) => ctx.lineTo(x(i), y(d.revenue)));
        ctx.lineTo(x(data.length - 1), pad.top + h);
        ctx.lineTo(x(0), pad.top + h);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + h);
        const ch = css.getPropertyValue('--color-primary').trim() || '37 99 235';
        grad.addColorStop(0, `rgba(${ch.split(' ').join(',')}, 0.20)`);
        grad.addColorStop(1, `rgba(${ch.split(' ').join(',')}, 0)`);
        ctx.fillStyle = grad;
        ctx.fill();

        // Line.
        ctx.beginPath();
        ctx.moveTo(x(0), y(data[0].revenue));
        data.forEach((d, i) => ctx.lineTo(x(i), y(d.revenue)));
        ctx.strokeStyle = primary;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // X labels (first, middle, last to avoid clutter).
      ctx.fillStyle = muted;
      const labelIdx = [0, Math.floor(data.length / 2), data.length - 1].filter((v, i, a) => a.indexOf(v) === i);
      labelIdx.forEach((i) => {
        if (!data[i]) return;
        const d = new Date(data[i].date);
        const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        ctx.fillText(label, x(i) - 16, pad.top + h + 18);
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [data, currency]);

  return (
    <div ref={wrapRef} className="w-full">
      <canvas ref={canvasRef} role="img" aria-label="Revenue over time line chart" />
    </div>
  );
}
