// =============================================================================
// Input sanitization — never trust user input before sending to the API.
// Each function targets a specific input type with appropriate character and
// length restrictions. Apply these in onChangeText handlers throughout the app.
// =============================================================================

/** Strip HTML injection characters and enforce max length. */
export function sanitizeText(input: string, maxLength = 255): string {
  return input.trim().replace(/[<>]/g, '').substring(0, maxLength);
}

/** Normalize email: lowercase, trim, enforce length limit. */
export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase().substring(0, 254);
}

/** Only allow numeric values in price inputs — prevent injection. */
export function sanitizePrice(input: string): number {
  const parsed = parseFloat(input.replace(/[^0-9.]/g, ''));
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/** Strip dangerous characters from search queries. */
export function sanitizeSearchQuery(input: string): string {
  return input.trim().replace(/[<>'"]/g, '').substring(0, 100);
}

/** Strip non-numeric characters from pincode input. */
export function sanitizePincode(input: string): string {
  return input.replace(/[^0-9]/g, '').substring(0, 6);
}

/** Strip non-numeric dial characters from phone input. */
export function sanitizePhone(input: string): string {
  return input.replace(/[^0-9+\-\s]/g, '').substring(0, 15);
}

/** Sanitize name fields (strip HTML, limit length). */
export function sanitizeName(input: string): string {
  return input.trim().replace(/[<>]/g, '').substring(0, 80);
}
