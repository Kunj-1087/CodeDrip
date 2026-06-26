import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  /** Optional leading adornment (e.g. a search icon). */
  leftIcon?: ReactNode;
}

// Token-driven text field. The focus ring is the brand color at 15% — the same
// treatment used by the global `.input` primitive — and the error state swaps the
// border + ring to the danger token. Label/helper/error are wired with ids so the
// field is announced correctly by screen readers (aria-describedby / aria-invalid).
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helper, leftIcon, id, className, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const describedBy = error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-muted">
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">{leftIcon}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full rounded-md border bg-surface px-3.5 py-2.5 text-sm text-ink',
            'transition-[border-color,box-shadow] duration-100 placeholder:text-faint focus:outline-none focus:ring-2',
            leftIcon ? 'pl-10' : undefined,
            error
              ? 'border-danger focus:border-danger focus:ring-danger/15'
              : 'border-border-strong focus:border-primary focus:ring-primary/15',
            className,
          )}
          {...rest}
        />
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : helper ? (
        <p id={`${inputId}-helper`} className="mt-1 text-xs text-faint">
          {helper}
        </p>
      ) : null}
    </div>
  );
});
