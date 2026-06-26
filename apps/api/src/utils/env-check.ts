// =============================================================================
// Environment validation — runs at startup BEFORE the server binds.
// Fails fast and loudly if required secrets are missing, too short, or use
// dangerous default/placeholder values. A misconfigured deploy should never
// start in a half-secure state.
// =============================================================================

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'NODE_ENV',
];

const DANGEROUS_DEFAULTS = [
  'your_jwt_secret_here',
  'changeme',
  'secret',
  'password',
  'example',
  'test',
  'replace-with',
  'aaaaaaaa',
  'bbbbbbbb',
];

export function validateEnvironment(): void {
  const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Check your .env file. See .env.example for all required variables.',
    );
  }

  // Check for dangerous default values in signing secrets.
  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    const value = (process.env[key] ?? '').toLowerCase();
    if (DANGEROUS_DEFAULTS.some((d) => value.includes(d))) {
      throw new Error(
        `${key} appears to be a placeholder value (contains "${DANGEROUS_DEFAULTS.find((d) => value.includes(d))}"). ` +
          'Set a real secret (minimum 32 random characters).',
      );
    }
    if ((process.env[key] ?? '').length < 32) {
      throw new Error(`${key} is too short. Minimum 32 characters required. Found ${(process.env[key] ?? '').length}.`);
    }
  }

  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different values.');
  }

  if (process.env.NODE_ENV === 'production') {
    const dbUrl = process.env.DATABASE_URL ?? '';
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      // eslint-disable-next-line no-console
      console.warn('[ENV] Warning: DATABASE_URL points to localhost in production. Is this intentional?');
    }

    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
    if (bcryptRounds < 12) {
      throw new Error(
        `BCRYPT_ROUNDS must be >= 12 in production. Current value: ${bcryptRounds}. Refusing to start.`,
      );
    }
  }
}
