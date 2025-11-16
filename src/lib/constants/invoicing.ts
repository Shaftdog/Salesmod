/**
 * Invoicing Module Constants
 * Centralized constants for invoicing system
 */

// =============================================
// PAGINATION
// =============================================

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
export const MAX_PAGE_NUMBER = 10000;

// =============================================
// PAYMENT TERMS
// =============================================

export const DEFAULT_PAYMENT_TERMS_DAYS = 30;
export const NET_15_DAYS = 15;
export const NET_30_DAYS = 30;
export const NET_60_DAYS = 60;
export const NET_90_DAYS = 90;

// =============================================
// BATCH OPERATIONS
// =============================================

export const MAX_BATCH_CREATE_SIZE = 100;
export const MAX_BATCH_SEND_SIZE = 50;

// =============================================
// INVOICE NUMBERING
// =============================================

export const DEFAULT_INVOICE_PREFIX = 'INV-';
export const DEFAULT_INVOICE_PADDING = 5;
export const DEFAULT_INVOICE_SUFFIX_FORMAT = ''; // e.g., '-YYYY' for year

// =============================================
// AGING BUCKETS (in days)
// =============================================

export const AGING_BUCKET_CURRENT = 0;
export const AGING_BUCKET_1_30 = 30;
export const AGING_BUCKET_31_60 = 60;
export const AGING_BUCKET_61_90 = 90;
export const AGING_BUCKET_90_PLUS = 91;

export const AGING_BUCKETS = {
  CURRENT: 'current',
  DAYS_1_30: '1-30',
  DAYS_31_60: '31-60',
  DAYS_61_90: '61-90',
  DAYS_90_PLUS: '90+',
} as const;

// =============================================
// TAX RATES
// =============================================

export const DEFAULT_TAX_RATE = 0;
export const MAX_TAX_RATE = 1; // 100%

// =============================================
// AMOUNTS & CURRENCY
// =============================================

export const MIN_INVOICE_AMOUNT = 0.01;
export const MAX_INVOICE_AMOUNT = 999999999.99;
export const CURRENCY_DECIMALS = 2;

// =============================================
// STRIPE
// =============================================

export const STRIPE_CENTS_MULTIPLIER = 100;
export const STRIPE_DEFAULT_DAYS_UNTIL_DUE = 30;

// =============================================
// VALIDATION LIMITS
// =============================================

export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_NOTES_LENGTH = 2000;
export const MAX_TERMS_LENGTH = 5000;
export const MAX_FOOTER_LENGTH = 500;
export const MAX_REFERENCE_NUMBER_LENGTH = 200;
export const MAX_COD_COLLECTOR_NAME_LENGTH = 200;
export const MAX_RECEIPT_NUMBER_LENGTH = 100;

// =============================================
// INVOICE STATUS TRANSITIONS
// =============================================

export const INVOICE_STATUS_TRANSITIONS = {
  draft: ['sent', 'cancelled', 'void'],
  sent: ['viewed', 'partially_paid', 'paid', 'overdue', 'cancelled', 'void'],
  viewed: ['partially_paid', 'paid', 'overdue', 'cancelled', 'void'],
  partially_paid: ['paid', 'overdue', 'void'],
  paid: ['void'], // Can only void paid invoices
  overdue: ['partially_paid', 'paid', 'void'],
  cancelled: [], // Terminal state
  void: [], // Terminal state
} as const;

export type InvoiceStatus = keyof typeof INVOICE_STATUS_TRANSITIONS;

/**
 * Check if an invoice status transition is valid
 */
export function isValidStatusTransition(
  fromStatus: InvoiceStatus,
  toStatus: InvoiceStatus
): boolean {
  const validTransitions = INVOICE_STATUS_TRANSITIONS[fromStatus];
  return validTransitions.includes(toStatus as any);
}

/**
 * Get valid status transitions for a given status
 */
export function getValidStatusTransitions(status: InvoiceStatus): readonly string[] {
  return INVOICE_STATUS_TRANSITIONS[status] || [];
}

// =============================================
// PAYMENT METHOD TYPES
// =============================================

export const PAYMENT_METHODS = {
  COD: 'cod',
  STRIPE_LINK: 'stripe_link',
  NET_TERMS: 'net_terms',
} as const;

export const COD_COLLECTION_METHODS = {
  CASH: 'cash',
  CHECK: 'check',
  MONEY_ORDER: 'money_order',
  CREDIT_CARD: 'credit_card',
} as const;

export const PAYMENT_TYPES = {
  CASH: 'cash',
  CHECK: 'check',
  ACH: 'ach',
  WIRE: 'wire',
  CREDIT_CARD: 'credit_card',
  STRIPE: 'stripe',
  OTHER: 'other',
} as const;

// =============================================
// SORT OPTIONS
// =============================================

export const DEFAULT_SORT_BY = 'created_at';
export const DEFAULT_SORT_ORDER = 'desc';

export const VALID_SORT_FIELDS = [
  'created_at',
  'invoice_date',
  'due_date',
  'invoice_number',
  'total_amount',
  'amount_due',
  'status',
] as const;

export const VALID_SORT_ORDERS = ['asc', 'desc'] as const;
