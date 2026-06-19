'use client';
import { useEffect, useRef } from 'react';

export interface Slice {
  label: string;
  value: number;
  color: string;
}

// Doughnut chart drawn with the RAW Canvas 2D API — no chart library. Renders a
// legend beside the ring. Empty data shows a neutral full ring.
export function DoughnutChart({ data }: { data: Slice[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 200;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;
    const inner = radius * 0.62;
    const total = data.reduce((s, d) => s + d.value, 0);

    if (total === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.arc(cx, cy, inner, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(148,163,184,0.25)';
      ctx.fill('evenodd');
      return;
    }

    let start = -Math.PI / 2;
    for (const slice of data) {
      const angle = (slice.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, start + angle);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      start += angle;
    }

    // Punch out the center to make it a doughnut.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Center total.
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-text')
      ? `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim()})`
      : '#0f172a';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(total), cx, cy + 4);
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('orders', cx, cy + 20);
  }, [data]);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <canvas ref={canvasRef} role="img" aria-label="Orders by status doughnut chart" />
      <ul className="space-y-2 text-sm">
        {data.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ background: s.color }} />
            <span className="capitalize text-ink">{s.label}</span>
            <span className="text-muted">· {s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
