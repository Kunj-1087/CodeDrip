// Type definition for express-rate-limit store interface.
// This allows the rate limiter to accept a Redis store when configured.
export interface RateLimitStore {
  init?: (options: unknown) => void;
  increment: (key: string) => Promise<{ totalHits: number; resetTime: Date | undefined }>;
  decrement: (key: string) => Promise<void>;
  resetKey: (key: string) => Promise<void>;
  resetAll?: () => Promise<void>;
  readonly localKeys?: boolean;
}
