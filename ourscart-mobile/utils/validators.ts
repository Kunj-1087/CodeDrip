// =============================================================================
// Client-side form validation. All validation happens BEFORE API calls to catch
// errors on device — not on the server. This saves bandwidth and provides
// instant feedback to the user on slow connections.
//
// Two layers:
//   1. Individual validators (validateEmail, validatePassword, etc.) — used by
//      existing form screens for field-level error checking.
//   2. Composite validators (validateRegistration, validateAddress, etc.) —
//      used for complete form validation before submission.
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

// ===========================================================================
// Individual validators — return error string or undefined on success.
// Used by existing screen components for inline validation.
// ===========================================================================

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return undefined;
}

export function validateName(name: string, fieldName: string): string | undefined {
  if (!name.trim()) return `${fieldName} is required`;
  if (name.length > 80) return `${fieldName} must be 80 characters or less`;
  return undefined;
}

export function validateConfirmPassword(password: string, confirm: string): string | undefined {
  if (password !== confirm) return 'Passwords do not match';
  return undefined;
}

export function validateRequired(value: string, label: string): string | undefined {
  if (!value.trim()) return `${label} is required`;
  return undefined;
}

export function validatePhone(phone: string): string | undefined {
  if (!phone.trim()) return 'Phone number is required';
  const digits = phone.replace(/\D/g, '');
  if (!/^[6-9][0-9]{9}$/.test(digits)) return 'Enter a valid 10-digit Indian mobile number';
  return undefined;
}

export function validatePincode(pincode: string): string | undefined {
  if (!pincode.trim()) return 'Pincode is required';
  if (!/^[1-9][0-9]{5}$/.test(pincode)) return 'Enter a valid 6-digit Indian pincode';
  return undefined;
}

// ===========================================================================
// Payment helpers — card formatting utilities
// ===========================================================================

export function formatCardNumber(text: string): string {
  const cleaned = text.replace(/\D/g, '').substring(0, 16);
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : '';
}

export function formatExpiry(text: string): string {
  const cleaned = text.replace(/\D/g, '').substring(0, 4);
  if (cleaned.length <= 2) return cleaned;
  return `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
}

export function detectCardBrand(number: string): string {
  const cleaned = number.replace(/\s/g, '');
  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'Amex';
  if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
  if (/^2/.test(cleaned)) return 'Mastercard';
  return 'Unknown';
}

// ===========================================================================
// Composite validators — complete form validation
// ===========================================================================

export function validateRegistration(data: {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const firstNameErr = validateName(data.firstName, 'First name');
  if (firstNameErr) errors.firstName = firstNameErr;

  const lastNameErr = validateName(data.lastName, 'Last name');
  if (lastNameErr) errors.lastName = lastNameErr;

  const emailErr = validateEmail(data.email);
  if (emailErr) errors.email = emailErr;

  const passErr = validatePassword(data.password);
  if (passErr) errors.password = passErr;

  const confirmErr = validateConfirmPassword(data.password, data.confirmPassword);
  if (confirmErr) errors.confirmPassword = confirmErr;

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateLoginForm(data: {
  email: string;
  password: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const emailErr = validateEmail(data.email);
  if (emailErr) errors.email = emailErr;

  if (!data.password) errors.password = 'Password is required';

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateAddress(data: {
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const line1Err = validateRequired(data.line1, 'Address');
  if (line1Err) errors.line1 = line1Err;

  const cityErr = validateRequired(data.city, 'City');
  if (cityErr) errors.city = cityErr;

  const stateErr = validateRequired(data.state, 'State');
  if (stateErr) errors.state = stateErr;

  const pinErr = validatePincode(data.postalCode);
  if (pinErr) errors.postalCode = pinErr;

  const phoneErr = validatePhone(data.phone);
  if (phoneErr) errors.phone = phoneErr;

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateCoupon(code: string): ValidationResult {
  const errors: Record<string, string> = {};
  if (!code.trim()) errors.code = 'Enter a coupon code';
  else if (code.length > 50) errors.code = 'Coupon code too long';
  else if (/[^A-Z0-9_-]/i.test(code)) errors.code = 'Invalid coupon code format';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateReview(data: {
  rating: number;
  title: string;
  body: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  if (data.rating < 1 || data.rating > 5) errors.rating = 'Select a rating between 1 and 5';
  if (!data.title.trim() || data.title.length > 150) {
    errors.title = 'Title is required (max 150 characters)';
  }
  if (data.body.length < 10) errors.body = 'Review must be at least 10 characters';
  if (data.body.length > 2000) errors.body = 'Review too long (max 2000 characters)';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validatePasswordResetForm(data: {
  password: string;
  confirmPassword: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const passErr = validatePassword(data.password);
  if (passErr) errors.password = passErr;
  const confirmErr = validateConfirmPassword(data.password, data.confirmPassword);
  if (confirmErr) errors.confirmPassword = confirmErr;
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateProfileForm(data: {
  firstName: string;
  lastName: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const nameErr = validateName(data.firstName, 'First name');
  if (nameErr) errors.firstName = nameErr;
  const lastNameErr = validateName(data.lastName, 'Last name');
  if (lastNameErr) errors.lastName = lastNameErr;
  return { valid: Object.keys(errors).length === 0, errors };
}

export const validateRegistrationForm = validateRegistration;
export const validateAddressForm = validateAddress;
export const validateReviewForm = validateReview;
