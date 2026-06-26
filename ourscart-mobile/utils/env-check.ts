// =============================================================================
// App environment validation — runs at startup before the app renders.
// Fails loudly in dev (crash with clear message), logs error in production.
//
// IMPORTANT: This module must NOT import from monitoring.ts or any file that
// depends on Sentry. Environment validation runs before Sentry is initialized,
// so using Sentry here would fail silently.
// =============================================================================

const REQUIRED_ENV_VARS = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_STORE_NAME',
] as const;

export function validateAppEnvironment(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    if (__DEV__) {
      throw new Error(`${message}\n\nCheck your .env file and run expo start again.`);
    } else {
      // In production, don't crash the app — log and continue.
      console.error(message);
    }
  }

  // Validate HTTPS in production — never send credentials over HTTP.
  if (
    !__DEV__ &&
    process.env.EXPO_PUBLIC_API_URL?.startsWith('http://') &&
    !process.env.EXPO_PUBLIC_API_URL?.includes('localhost')
  ) {
    console.error(
      'SECURITY: EXPO_PUBLIC_API_URL uses http:// in production. Must use https://',
    );
  }
}
