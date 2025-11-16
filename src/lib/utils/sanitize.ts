/**
 * Text Sanitization Utilities
 *
 * These utilities sanitize user input to prevent XSS attacks.
 * Used primarily for text fields that will be stored in database and rendered in UI.
 */

/**
 * Escapes HTML special characters to prevent XSS
 * This is a basic sanitization - for rich text, consider using a library like DOMPurify
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes multiple text fields in an object
 * Useful for sanitizing invoice/payment data
 */
export function sanitizeTextFields<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): T {
  const sanitized = { ...data };

  for (const field of fields) {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeText(sanitized[field] as string) as T[keyof T];
    }
  }

  return sanitized;
}

/**
 * Sanitizes invoice-specific text fields
 */
export function sanitizeInvoiceData(data: any): any {
  return sanitizeTextFields(data, [
    'notes',
    'terms_and_conditions',
    'footer_text',
    'client_notes',
  ]);
}

/**
 * Sanitizes line item descriptions
 */
export function sanitizeLineItems(lineItems: any[]): any[] {
  return lineItems.map((item) =>
    sanitizeTextFields(item, ['description', 'notes'])
  );
}
