import type { ZodSchema } from 'zod';
import { AppError } from './AppError.ts';

// Parse `data` against a Zod schema, converting a validation failure into a
// 400 AppError with field-level details. Centralizes the "validate then use"
// pattern so handlers never touch unvalidated request input.
export function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw AppError.badRequest('Validation failed', result.error.flatten().fieldErrors);
  }
  return result.data;
}
