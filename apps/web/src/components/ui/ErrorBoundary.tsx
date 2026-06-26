'use client';

import { Component, type ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const win = typeof window !== 'undefined' ? (window as any) : null;

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI. If omitted, a default error page is shown. */
  fallback?: ReactNode;
  /** Optional error callback for analytics / Sentry. */
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Production error boundary that catches render-phase errors and shows a
 * fallback UI instead of a white screen. Integrates with Sentry when the
 * __SENTRY__ global is available (loaded via the Sentry CDN or npm package).
 *
 * Wrap every page-level component with this boundary so a crash in one section
 * doesn't take down the entire application.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
    // Log to console in all environments.
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);

    // Report to Sentry if available (loaded via CDN script or npm package).
    if (win?.__SENTRY__?.captureException) {
      try {
        win.__SENTRY__.captureException(error, {
          extra: { componentStack: errorInfo.componentStack },
        });
      } catch {
        // Gracefully degrade if Sentry reporting itself fails.
      }
    }

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="mx-auto max-w-md text-center">
            <div className="mb-4 text-4xl">⚠️</div>
            <h2 className="mb-2 text-xl font-semibold text-ink">Something went wrong</h2>
            <p className="mb-6 text-sm text-muted">
              Our team has been notified. Please try refreshing the page.
            </p>
            <button
              onClick={this.handleRetry}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
