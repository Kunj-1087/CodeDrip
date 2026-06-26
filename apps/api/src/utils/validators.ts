// =============================================================================
// Zod validation schemas + middleware factory.
//
// Every route that accepts a request body MUST validate it before processing.
// These schemas enforce type safety, length limits, format constraints, and
// sanitization (trim, lowercase) at the boundary — before any service or DB
// code runs. No raw req.body should ever reach business logic.
// =============================================================================
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

// ===========================================================================
// Auth schemas
// ===========================================================================
export const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(254).toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long (bcrypt limit)')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1).max(80).trim(),
  lastName: z.string().min(1).max(80).trim(),
  guestSessionId: z.string().max(120).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
  password: z.string().min(1).max(72),
  guestSessionId: z.string().max(120).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// ===========================================================================
// Product schemas (admin)
// ===========================================================================
export const createProductSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().max(10000).optional(),
  shortDescription: z.string().max(300).optional(),
  sku: z.string().max(60).trim().optional(),
  categoryId: z.string().uuid(),
  brand: z.string().max(120).trim().optional(),
  basePrice: z.number().nonnegative().max(9999999),
  compareAtPrice: z.number().nonnegative().max(9999999).nullable().optional(),
  stockQuantity: z.number().int().min(0).max(999999).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  specs: z.record(z.string(), z.unknown()).default({}),
});

// ===========================================================================
// Order schemas
// ===========================================================================
export const createOrderSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1).max(120),
    line1: z.string().min(1).max(200).trim(),
    line2: z.string().max(200).trim().optional(),
    city: z.string().min(1).max(100).trim(),
    state: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    country: z.string().max(100).default('India'),
    phone: z.string().max(20).optional(),
  }),
  couponCode: z.string().max(40).optional(),
  notes: z.string().max(500).optional(),
  // HARD INVARIANT: NEVER accept total, payment_status, or any price from client.
});

// ===========================================================================
// Payment schema — client only sends order ID
// ===========================================================================
export const mockPaymentSchema = z.object({
  orderId: z.string().uuid(),
  // Deliberately minimal — server reads everything else from DB.
});

// ===========================================================================
// Address schema
// ===========================================================================
export const addressSchema = z.object({
  label: z.string().max(60).trim().optional(),
  line1: z.string().min(1).max(200).trim(),
  line2: z.string().max(200).trim().optional(),
  city: z.string().min(1).max(100).trim(),
  state: z.string().max(100).trim().optional(),
  postalCode: z.string().max(20).trim().optional(),
  country: z.string().max(100).default('India'),
  isDefault: z.boolean().default(false),
});

// ===========================================================================
// Review schema
// ===========================================================================
export const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).trim().optional(),
});

// ===========================================================================
// Coupon validation schema
// ===========================================================================
export const couponValidateSchema = z.object({
  code: z.string().min(1).max(40).trim().toUpperCase(),
  subtotal: z.number().nonnegative(),
});

// ===========================================================================
// Profile / account schemas
// ===========================================================================
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(80).trim(),
  lastName: z.string().min(1).max(80).trim(),
});

// ===========================================================================
// Middleware factory
// ===========================================================================
/**
 * Express middleware that validates `req.body` against a Zod schema.
 * On failure, returns 400 with field-level error messages.
 * On success, replaces `req.body` with the parsed (and transformed) data.
 */
export function validate<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ error: 'Validation failed', errors });
    }
    // Replace body with cleaned/transformed data.
    req.body = result.data;
    next();
  };
}

/**
 * Query parameter validation — same as validate() but for req.query.
 */
export function validateQuery<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ error: 'Invalid query parameters', errors });
    }
    req.query = result.data;
    next();
  };
}
