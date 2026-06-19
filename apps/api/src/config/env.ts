// =============================================================================
// Environment loading + validation.
// Fails fast at boot if a required server secret is missing or too weak, so a
// misconfigured deploy never starts in a half-secure state. Only variables
// listed here are read; nothing here is ever sent to the browser.
// =============================================================================
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the monorepo-root .env (apps/api/src/config -> ../../../../.env), then
// allow a local apps/api/.env to override during isolated API work.
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Distinct, sufficiently long signing secrets. 32 chars is the floor; the
  // .env.example ships 64+. Access and refresh secrets MUST differ.
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRY: z.string().default('7d'),

  BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(12),

  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),

  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(5 * 1024 * 1024),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.string().optional().default(''),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('noreply@ourscart.com'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const e = parsed.data;

if (e.JWT_SECRET === e.JWT_REFRESH_SECRET) {
  // eslint-disable-next-line no-console
  console.error('JWT_SECRET and JWT_REFRESH_SECRET must be different values.');
  process.exit(1);
}

export const env = {
  nodeEnv: e.NODE_ENV,
  isProduction: e.NODE_ENV === 'production',
  port: e.PORT,
  databaseUrl: e.DATABASE_URL,
  jwtSecret: e.JWT_SECRET,
  jwtRefreshSecret: e.JWT_REFRESH_SECRET,
  accessTokenExpiry: e.ACCESS_TOKEN_EXPIRY,
  refreshTokenExpiry: e.REFRESH_TOKEN_EXPIRY,
  bcryptRounds: e.BCRYPT_ROUNDS,
  corsOrigin: e.CORS_ORIGIN,
  uploadDir: e.UPLOAD_DIR,
  maxFileSize: e.MAX_FILE_SIZE,
  smtp: { host: e.SMTP_HOST, port: e.SMTP_PORT, user: e.SMTP_USER, pass: e.SMTP_PASS },
  emailFrom: e.EMAIL_FROM,
} as const;
