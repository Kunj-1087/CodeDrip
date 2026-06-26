import { cn } from '@/lib/cn';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'wordmark-only';
  className?: string;
}

export function DevMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <span 
      style={{ fontSize: size ? size * 0.75 : undefined }} 
      className={cn('font-mono font-bold select-none inline-flex items-center', className)}
    >
      <span className="text-zinc-500">&lt;</span>
      <span className="text-[#FF4D4D]/80">/</span>
      <span className="text-zinc-500">&gt;</span>
    </span>
  );
}

const HEIGHTS = {
  sm: 'h-7 md:h-8',
  md: 'h-11 md:h-12',
  lg: 'h-16 md:h-20',
  xl: 'h-24 md:h-28',
} as const;

export function Logo({ size = 'md', className }: LogoProps) {
  return (
    <span className={cn('relative inline-flex overflow-hidden transition-transform active:scale-[0.98] group select-none', HEIGHTS[size], className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/codedrip-logo.jpg"
        alt="CodeDrip Logo"
        className={cn('object-contain h-[180%] w-auto max-w-none -translate-y-[22%] transition-transform duration-500 group-hover:scale-[1.08]')}
      />
    </span>
  );
}

