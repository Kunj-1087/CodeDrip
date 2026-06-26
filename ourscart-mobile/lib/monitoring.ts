// =============================================================================
// Crash reporting and performance monitoring.
//
// Uses Sentry (expo-compatible, generous free tier) when configured via
// EXPO_PUBLIC_SENTRY_DSN. In development, all events are logged to console
// instead of sent — keeping Sentry clean during development.
//
// To enable: npx expo install @sentry/react-native
// Then set EXPO_PUBLIC_SENTRY_DSN in your .env
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null;

try {
  // Dynamic import so the app doesn't crash if @sentry/react-native isn't installed.
  Sentry = require('@sentry/react-native');
} catch {
  // Sentry not installed — all calls are no-ops.
}

export function initializeMonitoring(): void {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) {
    if (__DEV__) {
      console.info('[Monitoring] Sentry DSN not set — skipping initialization');
    }
    return;
  }

  if (!Sentry) {
    console.warn('[Monitoring] @sentry/react-native not installed — skipping initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_ENV || 'development',
    // Only sample 10% of performance traces in production.
    tracesSampleRate: process.env.EXPO_PUBLIC_ENV === 'production' ? 0.1 : 1.0,
    // Never send in development — keeps Sentry clean.
    enabled: !__DEV__,
    // Android-specific: capture native crashes (ANRs, OOM crashes).
    enableNative: true,
    enableNativeCrashHandling: true,
  });

  if (__DEV__) {
    console.info('[Monitoring] Sentry initialized');
  }
}

export function setMonitoringUser(user: { id: string; email: string }): void {
  if (Sentry?.setUser) {
    Sentry.setUser({ id: user.id, email: user.email });
  }
}

export function clearMonitoringUser(): void {
  if (Sentry?.setUser) {
    Sentry.setUser(null);
  }
}

export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (__DEV__) {
    console.error('[Error]', error, context);
    return;
  }
  if (Sentry?.captureException) {
    Sentry.captureException(error, { extra: context });
  }
}

export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' | 'fatal' = 'info',
): void {
  if (__DEV__) {
    console.log(`[${level.toUpperCase()}]`, message);
    return;
  }
  if (Sentry?.captureMessage) {
    Sentry.captureMessage(message, level);
  }
}
