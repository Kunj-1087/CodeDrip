import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'danger' | 'dark' | 'ghost';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Render a circular, equal-sided icon button (ghost by default). */
  icon?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Variants map onto the same tokens as the global `.btn-*` primitives so a Button
// component and a raw `.btn-primary` link are visually identical.
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary text-white shadow-xs hover:bg-primary-hover hover:-translate-y-px hover:shadow-sm active:translate-y-0 active:shadow-none',
  secondary:
    'border border-border-strong bg-surface text-ink hover:border-faint hover:bg-surface-3',
  danger: 'bg-danger text-white shadow-xs hover:-translate-y-px hover:shadow-sm active:translate-y-0',
  dark: 'bg-secondary text-white hover:-translate-y-px hover:shadow-sm active:translate-y-0 active:shadow-none',
  ghost: 'text-ink hover:bg-surface-3',
};

// Height + padding + type per size (height is fixed so the loading spinner never
// changes the button's footprint).
const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3.5 text-xs',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
  xl: 'h-14 px-8 text-lg',
};

const ICON_SIZES: Record<Size, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-14 w-14',
};

function Spinner({ className }: { className?: string }) {
  // Pure-CSS ring spinner: a transparent border with one colored edge spun by
  // Tailwind's `animate-spin`. `currentColor` makes it inherit the label color.
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    icon = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      // aria-busy so assistive tech announces the in-flight state.
      aria-busy={loading || undefined}
      whileTap={{ scale: 0.97 }}
      whileHover="hover"
      className={cn(
        'relative inline-flex select-none items-center justify-center gap-2 font-semibold tracking-[0.01em] overflow-hidden',
        'transition-[background,box-shadow,transform,border-color,color] duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        icon ? cn('rounded-full', ICON_SIZES[size]) : cn('rounded-md', SIZES[size]),
        VARIANTS[icon && variant === 'primary' ? 'ghost' : variant],
        className,
      )}
      {...rest}
    >
      {/* Shimmer gradient sweep on hover */}
      {!disabled && !loading && (variant === 'primary' || variant === 'danger' || variant === 'dark') && (
        <span className="absolute inset-0 block overflow-hidden rounded-[inherit] pointer-events-none z-0">
          <motion.span 
            className="absolute inset-0 block h-full w-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
            initial={{ x: '-100%' }}
            variants={{
              hover: { x: '100%' }
            }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        </span>
      )}

      {/* Keep the label in flow even while loading (just hidden) so the button
          width is preserved — no layout shift when the spinner swaps in. */}
      <span className={cn('relative z-10 inline-flex items-center gap-2', loading && 'invisible')}>
        {leftIcon}
        {children}
        {rightIcon}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center z-10">
          <Spinner className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </span>
      )}
    </motion.button>
  );
});
