/**
 * Invoicing System TypeScript Types
 * Auto-generated from Supabase schema
 */

// =============================================
// TYPE ALIASES
// =============================================

/**
 * Stripe metadata - can contain arbitrary string key-value pairs
 * Used to attach custom data to Stripe invoices/payments
 */
export type StripeMetadata = Record<string, string | number | boolean | null>;

// =============================================
// ENUMS
// =============================================

export type PaymentMethodType = 'cod' | 'stripe_link' | 'net_terms';

export type InvoiceStatusType =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'void';

export type CodCollectionMethodType =
  | 'cash'
  | 'check'
  | 'money_order'
  | 'cashiers_check';

export type PaymentType =
  | 'cash'
  | 'check'
  | 'credit_card'
  | 'stripe'
  | 'ach'
  | 'wire'
  | 'money_order'
  | 'other';

export type AgingBucket = 'current' | '1-30' | '31-60' | '61-90' | '90+';

// =============================================
// DATABASE TABLES
// =============================================

export interface InvoiceNumberSequence {
  org_id: string;
  last_invoice_number: number;
  prefix: string;
  suffix_format: string | null;
  padding: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  org_id: string;
  client_id: string;

  // Invoice identification
  invoice_number: string;
  invoice_date: string; // Date string
  due_date: string; // Date string

  // Payment method and status
  payment_method: PaymentMethodType;
  status: InvoiceStatusType;

  // Financial amounts
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;

  // Stripe fields
  stripe_invoice_id: string | null;
  stripe_payment_link_url: string | null;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  stripe_metadata: StripeMetadata | null;

  // COD fields
  cod_collected_by: string | null;
  cod_collection_method: CodCollectionMethodType | null;
  cod_receipt_number: string | null;
  cod_collected_at: string | null;
  cod_notes: string | null;

  // Content
  notes: string | null;
  terms_and_conditions: string | null;
  footer_text: string | null;

  // State tracking
  sent_at: string | null;
  viewed_at: string | null;
  first_payment_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  voided_at: string | null;

  // Audit
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  order_id: string | null;

  description: string;
  quantity: number;
  unit_price: number;
  amount: number;

  tax_rate: number;
  tax_amount: number;

  line_order: number;

  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  org_id: string;

  payment_date: string; // Date string
  amount: number;
  payment_method: PaymentType;

  reference_number: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;

  is_reconciled: boolean;
  reconciled_at: string | null;
  reconciled_by: string | null;

  notes: string | null;

  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================
// VIEWS
// =============================================

export interface OutstandingInvoice {
  id: string;
  org_id: string;
  client_id: string;
  client_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  payment_method: PaymentMethodType;
  status: InvoiceStatusType;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  days_overdue: number;
  aging_bucket: AgingBucket;
}

export interface InvoiceAgingReport {
  org_id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  payment_terms: number;
  total_outstanding_invoices: number;
  total_outstanding_amount: number;
  current_amount: number;
  aged_1_30: number;
  aged_31_60: number;
  aged_61_90: number;
  aged_90_plus: number;
  oldest_invoice_date: string;
  newest_invoice_date: string;
}

export interface ClientPaymentHistory {
  client_id: string;
  company_name: string;
  payment_terms: number;
  total_invoices: number;
  paid_invoices: number;
  outstanding_invoices: number;
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  avg_days_to_pay: number | null;
  overdue_count: number;
  last_invoice_date: string | null;
  last_payment_date: string | null;
}

export interface RevenueRecognition {
  org_id: string;
  revenue_month: string;
  payment_method: PaymentMethodType;
  status: InvoiceStatusType;
  invoice_count: number;
  total_invoiced: number;
  total_collected: number;
  total_outstanding: number;
  recognized_revenue: number;
  deferred_revenue: number;
}

// =============================================
// REQUEST/RESPONSE TYPES
// =============================================

export interface CreateInvoiceRequest {
  org_id: string;
  client_id: string;
  payment_method: PaymentMethodType;
  invoice_date?: string;
  due_date?: string;
  tax_rate?: number;
  discount_amount?: number;
  notes?: string;
  terms_and_conditions?: string;

  // Stripe fields (if payment_method = 'stripe_link')
  stripe_customer_id?: string;

  // COD fields (if payment_method = 'cod')
  cod_collected_by?: string;
  cod_collection_method?: CodCollectionMethodType;

  // Line items
  line_items: CreateInvoiceLineItemRequest[];
}

export interface CreateInvoiceLineItemRequest {
  order_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  line_order?: number;
}

export interface CreatePaymentRequest {
  invoice_id: string;
  org_id: string;
  amount: number;
  payment_method: PaymentType;
  payment_date?: string;
  reference_number?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  notes?: string;
}

export interface UpdateInvoiceRequest {
  status?: InvoiceStatusType;
  due_date?: string;
  tax_rate?: number;
  discount_amount?: number;
  notes?: string;
  terms_and_conditions?: string;

  // Stripe updates
  stripe_invoice_id?: string;
  stripe_payment_link_url?: string;
  stripe_payment_intent_id?: string;
  stripe_metadata?: StripeMetadata;

  // COD updates
  cod_collected_at?: string;
  cod_receipt_number?: string;
  cod_notes?: string;
}

// =============================================
// JOINED/ENRICHED TYPES
// =============================================

export interface InvoiceWithDetails extends Invoice {
  client: {
    id: string;
    company_name: string;
    email: string;
    payment_terms: number;
  };
  line_items: InvoiceLineItem[];
  payments: Payment[];
}

export interface InvoiceLineItemWithOrder extends InvoiceLineItem {
  order?: {
    id: string;
    order_number: string;
    property_address: string;
    status: string;
  };
}

// =============================================
// UTILITY TYPES
// =============================================

export interface InvoiceSummary {
  total_invoices: number;
  total_amount: number;
  total_paid: number;
  total_outstanding: number;
  by_status: Record<InvoiceStatusType, number>;
  by_payment_method: Record<PaymentMethodType, number>;
}

export interface InvoiceFilters {
  org_id: string;
  client_id?: string;
  status?: InvoiceStatusType | InvoiceStatusType[];
  payment_method?: PaymentMethodType | PaymentMethodType[];
  date_from?: string;
  date_to?: string;
  overdue_only?: boolean;
  search?: string; // Search invoice number or client name
}

export interface InvoicePaginationParams {
  page?: number;
  limit?: number;
  sort_by?: keyof Invoice;
  sort_order?: 'asc' | 'desc';
}

// =============================================
// WEBHOOK TYPES (for Stripe integration)
// =============================================

export interface StripeInvoiceWebhookPayload {
  id: string;
  object: 'invoice';
  amount_paid: number;
  amount_due: number;
  customer: string;
  hosted_invoice_url: string;
  payment_intent: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  metadata: {
    invoice_id?: string;
    org_id?: string;
  };
}

export interface StripeWebhookEvent {
  id: string;
  type:
    | 'invoice.payment_succeeded'
    | 'invoice.payment_failed'
    | 'invoice.finalized'
    | 'invoice.sent'
    | 'invoice.viewed'
    | 'invoice.voided';
  data: {
    object: StripeInvoiceWebhookPayload;
  };
}

// =============================================
// VALIDATION SCHEMAS (for use with Zod)
// =============================================

export const INVOICE_STATUS_OPTIONS: InvoiceStatusType[] = [
  'draft',
  'sent',
  'viewed',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
  'void'
];

export const PAYMENT_METHOD_OPTIONS: PaymentMethodType[] = [
  'cod',
  'stripe_link',
  'net_terms'
];

export const PAYMENT_TYPE_OPTIONS: PaymentType[] = [
  'cash',
  'check',
  'credit_card',
  'stripe',
  'ach',
  'wire',
  'money_order',
  'other'
];

export const COD_COLLECTION_METHOD_OPTIONS: CodCollectionMethodType[] = [
  'cash',
  'check',
  'money_order',
  'cashiers_check'
];

// =============================================
// HELPER FUNCTIONS
// =============================================

export const formatInvoiceNumber = (prefix: string, number: number, padding: number = 5): string => {
  return `${prefix}${number.toString().padStart(padding, '0')}`;
};

export const calculateDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const getAgingBucket = (daysOverdue: number): AgingBucket => {
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return '1-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
};

export const calculateInvoiceTotal = (
  subtotal: number,
  taxRate: number,
  discountAmount: number = 0
): { subtotal: number; taxAmount: number; total: number } => {
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = Math.round(afterDiscount * taxRate * 100) / 100;
  const total = afterDiscount + taxAmount;

  return {
    subtotal,
    taxAmount,
    total
  };
};

export const isInvoiceOverdue = (invoice: Invoice): boolean => {
  if (!['sent', 'viewed', 'partially_paid', 'overdue'].includes(invoice.status)) {
    return false;
  }
  return new Date(invoice.due_date) < new Date();
};

export const canEditInvoice = (invoice: Invoice): boolean => {
  return ['draft', 'sent'].includes(invoice.status);
};

export const canDeleteInvoice = (invoice: Invoice): boolean => {
  return invoice.status === 'draft' && invoice.amount_paid === 0;
};

export const canVoidInvoice = (invoice: Invoice): boolean => {
  return !['void', 'cancelled'].includes(invoice.status);
};

export const getInvoiceStatusColor = (status: InvoiceStatusType): string => {
  const colors: Record<InvoiceStatusType, string> = {
    draft: 'gray',
    sent: 'blue',
    viewed: 'cyan',
    partially_paid: 'yellow',
    paid: 'green',
    overdue: 'red',
    cancelled: 'gray',
    void: 'gray'
  };
  return colors[status];
};

export const getInvoiceStatusLabel = (status: InvoiceStatusType): string => {
  const labels: Record<InvoiceStatusType, string> = {
    draft: 'Draft',
    sent: 'Sent',
    viewed: 'Viewed',
    partially_paid: 'Partially Paid',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    void: 'Void'
  };
  return labels[status];
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString));
};
