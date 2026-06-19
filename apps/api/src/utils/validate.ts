import { z, type ZodTypeAny } from 'zod';
import { AppError } from './AppError.ts';

// Parse `data` against a Zod schema, converting a validation failure into a
// 400 AppError with field-level details. Returns the schema's OUTPUT type, so
// fields with .default()/.coerce are correctly non-optional to callers.
export function parseOrThrow<S extends ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw AppError.badRequest('Validation failed', result.error.flatten().fieldErrors);
  }
  return result.data;
}
