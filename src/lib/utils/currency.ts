/**
 * Currency Formatting Utilities
 * Provides functions for formatting currency values
 */

/**
 * Format a number as USD currency
 * @param amount - The amount to format
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(amount: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse a currency string to a number
 * @param currencyString - The currency string to parse (e.g., "$1,234.56")
 * @returns The numeric value
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbol, commas, and spaces
  const cleaned = currencyString.replace(/[$,\s]/g, '');
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
}

/**
 * Format a number as currency without the symbol
 * @param amount - The amount to format
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @returns Formatted number string (e.g., "1,234.56")
 */
export function formatAmount(amount: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
