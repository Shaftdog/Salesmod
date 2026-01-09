/**
 * Zod Validation Schemas for Invoicing System
 * Provides runtime type validation for all invoice-related API operations
 */

import { z } from 'zod';
import { sanitizeText } from '@/lib/utils/sanitize';
import {
  PAYMENT_METHOD_OPTIONS,
  INVOICE_STATUS_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
  COD_COLLECTION_METHOD_OPTIONS,
} from '@/types/invoicing';
import {
  MAX_PAGE_LIMIT,
  MAX_PAGE_NUMBER,
  DEFAULT_PAGE,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
} from '@/lib/constants/invoicing';

// =============================================
// BASE SCHEMAS
// =============================================

export const PaymentMethodSchema = z.enum(['cod', 'stripe_link', 'net_terms']);

export const InvoiceStatusSchema = z.enum([
  'draft',
  'sent',
  'viewed',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
  'void',
]);

export const PaymentTypeSchema = z.enum([
  'cash',
  'check',
  'credit_card',
  'stripe',
  'ach',
  'wire',
  'money_order',
  'other',
]);

export const CodCollectionMethodSchema = z.enum([
  'cash',
  'check',
  'money_order',
  'cashiers_check',
]);

// =============================================
// LINE ITEM SCHEMAS
// =============================================

export const CreateLineItemSchema = z.object({
  order_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(), // Optional - for product catalog items
  square_footage: z.number().int().positive().optional(), // Optional - for SF-based pricing
  description: z.string().min(1, 'Description is required').max(500).transform(sanitizeText),
  quantity: z.number().positive('Quantity must be positive').default(1),
  unit_price: z.number().nonnegative('Unit price must be non-negative'),
  tax_rate: z.number().min(0).max(1).optional().default(0),
  line_order: z.number().int().nonnegative().optional(),
});

export const UpdateLineItemSchema = z.object({
  product_id: z.string().uuid().optional(),
  square_footage: z.number().int().positive().optional(),
  description: z.string().min(1).max(500).transform(sanitizeText).optional(),
  quantity: z.number().positive().optional(),
  unit_price: z.number().nonnegative().optional(),
  tax_rate: z.number().min(0).max(1).optional(),
  line_order: z.number().int().nonnegative().optional(),
});

// =============================================
// INVOICE SCHEMAS
// =============================================

export const CreateInvoiceSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  order_id: z.string().uuid().optional(), // Optional link to order
  payment_method: PaymentMethodSchema,

  // Dates (YYYY-MM-DD format to match database DATE columns)
  invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),

  // Financial
  tax_rate: z.number().min(0).max(1).optional().default(0),
  discount_amount: z.number().nonnegative().optional().default(0),

  // Content (sanitized to prevent XSS)
  notes: z.string().max(2000).transform(sanitizeText).optional(),
  terms_and_conditions: z.string().max(5000).transform(sanitizeText).optional(),
  footer_text: z.string().max(500).transform(sanitizeText).optional(),

  // Stripe fields (required if payment_method = 'stripe_link')
  stripe_customer_id: z.string().optional(),

  // COD fields (required if payment_method = 'cod')
  cod_collected_by: z.string().min(1).max(200).transform(sanitizeText).optional(),
  cod_collection_method: CodCollectionMethodSchema.optional(),
  cod_notes: z.string().max(1000).transform(sanitizeText).optional(),

  // Payer fields - when set, shows separate "Ordered By" (client) and "Bill To" (payer) on invoice
  // Common in appraisal workflows where borrower pays but order is from lender/AMC
  payer_name: z.string().max(200).transform(sanitizeText).optional(),
  payer_company: z.string().max(200).transform(sanitizeText).optional(),
  payer_email: z.string().email().optional(),
  payer_phone: z.string().max(50).transform(sanitizeText).optional(),
  payer_address: z.string().max(500).transform(sanitizeText).optional(),

  // Line items (required)
  line_items: z.array(CreateLineItemSchema).min(1, 'At least one line item is required'),
}).superRefine((data, ctx) => {
  // Note: stripe_customer_id is optional at creation - it will be created when generating payment link

  // Validate COD-specific fields
  if (data.payment_method === 'cod') {
    if (!data.cod_collected_by) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'cod_collected_by is required for COD payment method',
        path: ['cod_collected_by'],
      });
    }
    if (!data.cod_collection_method) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'cod_collection_method is required for COD payment method',
        path: ['cod_collection_method'],
      });
    }
  }
});

// Schema for line items in update operations (allows id for existing items)
export const UpdateInvoiceLineItemSchema = z.object({
  id: z.string().uuid().optional(), // Optional - only present for existing items
  description: z.string().min(1, 'Description is required').max(500).transform(sanitizeText),
  quantity: z.number().positive('Quantity must be positive'),
  unit_price: z.number().nonnegative('Unit price must be non-negative'),
  tax_rate: z.number().min(0).max(1).optional().default(0),
  line_order: z.number().int().nonnegative().optional(),
});

export const UpdateInvoiceSchema = z.object({
  status: InvoiceStatusSchema.optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  tax_rate: z.number().min(0).max(1).optional(),
  discount_amount: z.number().nonnegative().optional(),
  notes: z.string().max(2000).transform(sanitizeText).optional(),
  terms_and_conditions: z.string().max(5000).transform(sanitizeText).optional(),
  footer_text: z.string().max(500).transform(sanitizeText).optional(),
  payment_method: PaymentMethodSchema.optional(),

  // Line items for updating invoice items
  line_items: z.array(UpdateInvoiceLineItemSchema).min(1).optional(),

  // Stripe updates
  stripe_invoice_id: z.string().optional(),
  stripe_payment_link_url: z.string().url().optional(),
  stripe_payment_intent_id: z.string().optional(),
  stripe_metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),

  // COD updates (cod_collected_at is TIMESTAMPTZ so uses datetime)
  cod_collected_at: z.string().datetime().optional(),
  cod_receipt_number: z.string().max(100).transform(sanitizeText).optional(),
  cod_notes: z.string().max(1000).transform(sanitizeText).optional(),

  // Payer fields - when set, shows separate "Ordered By" (client) and "Bill To" (payer) on invoice
  payer_name: z.string().max(200).transform(sanitizeText).optional().nullable(),
  payer_company: z.string().max(200).transform(sanitizeText).optional().nullable(),
  payer_email: z.string().email().optional().nullable(),
  payer_phone: z.string().max(50).transform(sanitizeText).optional().nullable(),
  payer_address: z.string().max(500).transform(sanitizeText).optional().nullable(),
});

// =============================================
// PAYMENT SCHEMAS
// =============================================

export const CreatePaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
  payment_method: PaymentTypeSchema,
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  reference_number: z.string().max(200).transform(sanitizeText).optional(),
  stripe_payment_intent_id: z.string().optional(),
  stripe_charge_id: z.string().optional(),
  notes: z.string().max(1000).transform(sanitizeText).optional(),
});

export const UpdatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  payment_method: PaymentTypeSchema.optional(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  reference_number: z.string().max(200).transform(sanitizeText).optional(),
  notes: z.string().max(1000).transform(sanitizeText).optional(),
  is_reconciled: z.boolean().optional(),
});

// =============================================
// ACTION SCHEMAS
// =============================================

export const SendInvoiceSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  cc_emails: z.array(z.string().email()).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
  send_copy_to_self: z.boolean().optional().default(false),
});

export const MarkPaidSchema = z.object({
  payment_date: z.string().datetime().optional(),
  payment_method: PaymentTypeSchema,
  reference_number: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export const CancelInvoiceSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const GenerateStripeLinkSchema = z.object({
  description: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
});

// =============================================
// BATCH OPERATION SCHEMAS
// =============================================

export const BatchCreateInvoicesSchema = z.object({
  invoices: z.array(CreateInvoiceSchema).min(1).max(100),
  send_immediately: z.boolean().optional().default(false),
});

export const BatchSendInvoicesSchema = z.object({
  invoice_ids: z.array(z.string().uuid()).min(1).max(50),
  email_template: SendInvoiceSchema.optional(),
});

// =============================================
// FILTER/QUERY SCHEMAS
// =============================================

export const InvoiceFiltersSchema = z.object({
  client_id: z.string().uuid().optional(),
  status: z.union([
    InvoiceStatusSchema,
    z.array(InvoiceStatusSchema),
  ]).optional(),
  payment_method: z.union([
    PaymentMethodSchema,
    z.array(PaymentMethodSchema),
  ]).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  overdue_only: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  search: z.string().max(200).optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().max(MAX_PAGE_NUMBER).optional().default(DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(MAX_PAGE_LIMIT).optional().default(DEFAULT_PAGE_LIMIT),
  sort_by: z.string().optional().default(DEFAULT_SORT_BY),
  sort_order: z.enum(['asc', 'desc']).optional().default(DEFAULT_SORT_ORDER),
});

export const InvoiceListQuerySchema = InvoiceFiltersSchema.merge(PaginationSchema);

// =============================================
// REPORT SCHEMAS
// =============================================

export const OutstandingReportQuerySchema = z.object({
  aging_bucket: z.enum(['current', '1-30', '31-60', '61-90', '90+']).optional(),
  min_amount: z.number().nonnegative().optional(),
  sort_by: z.enum(['due_date', 'amount_due', 'days_overdue']).optional().default('due_date'),
  sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
}).merge(PaginationSchema);

export const AgingReportQuerySchema = z.object({
  client_id: z.string().uuid().optional(),
  min_outstanding: z.number().nonnegative().optional(),
  sort_by: z.enum(['total_outstanding_amount', 'aged_90_plus']).optional().default('total_outstanding_amount'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const RevenueReportQuerySchema = z.object({
  start_month: z.string().regex(/^\d{4}-\d{2}$/).optional(), // YYYY-MM format
  end_month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  payment_method: PaymentMethodSchema.optional(),
  group_by: z.enum(['month', 'payment_method', 'status']).optional().default('month'),
});

// =============================================
// WEBHOOK SCHEMAS
// =============================================

export const StripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
});

// =============================================
// TYPE EXPORTS (inferred from schemas)
// =============================================

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof UpdatePaymentSchema>;
export type SendInvoiceInput = z.infer<typeof SendInvoiceSchema>;
export type MarkPaidInput = z.infer<typeof MarkPaidSchema>;
export type CancelInvoiceInput = z.infer<typeof CancelInvoiceSchema>;
export type GenerateStripeLinkInput = z.infer<typeof GenerateStripeLinkSchema>;
export type BatchCreateInvoicesInput = z.infer<typeof BatchCreateInvoicesSchema>;
export type BatchSendInvoicesInput = z.infer<typeof BatchSendInvoicesSchema>;
export type InvoiceFiltersInput = z.infer<typeof InvoiceFiltersSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type InvoiceListQueryInput = z.infer<typeof InvoiceListQuerySchema>;
export type OutstandingReportQueryInput = z.infer<typeof OutstandingReportQuerySchema>;
export type AgingReportQueryInput = z.infer<typeof AgingReportQuerySchema>;
export type RevenueReportQueryInput = z.infer<typeof RevenueReportQuerySchema>;
