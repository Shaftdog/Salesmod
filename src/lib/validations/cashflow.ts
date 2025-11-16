/**
 * Zod Validation Schemas for Cashflow System
 * Provides runtime type validation for all cashflow-related API operations
 */

import { z } from 'zod';
import { sanitizeText } from '@/lib/utils/sanitize';
import {
  MAX_PAGE_LIMIT,
  MIN_TRANSACTION_AMOUNT,
  MAX_TRANSACTION_AMOUNT,
  MAX_DESCRIPTION_LENGTH,
  MAX_CATEGORY_LENGTH,
  MIN_PRIORITY_SCORE,
  MAX_PRIORITY_SCORE,
  MIN_AI_CONFIDENCE,
  MAX_AI_CONFIDENCE,
  MAX_RECURRENCE_INTERVAL,
  MAX_RECURRENCE_COUNT,
  FORECAST_MAX_WEEKS,
} from '@/lib/constants/cashflow';

// =============================================
// BASE SCHEMAS
// =============================================

export const TransactionTypeSchema = z.enum(['income', 'expense']);

export const CashflowStatusSchema = z.enum([
  'pending',
  'scheduled',
  'paid',
  'overdue',
  'cancelled',
]);

export const BoardColumnSchema = z.enum([
  'overdue',
  'current_week',
  'next_week',
  'later',
  'collected',
]);

export const RecurrenceFrequencySchema = z.enum([
  'daily',
  'weekly',
  'monthly',
  'yearly',
]);

// =============================================
// RECURRENCE PATTERN SCHEMA
// =============================================

export const RecurrencePatternSchema = z.object({
  frequency: RecurrenceFrequencySchema,
  interval: z.number().int().min(1).max(MAX_RECURRENCE_INTERVAL),
  end_date: z.string().date().optional(),
  count: z.number().int().min(1).max(MAX_RECURRENCE_COUNT).optional(),
}).refine(
  (data) => {
    // Can't have both end_date and count
    return !(data.end_date && data.count);
  },
  {
    message: 'Cannot specify both end_date and count',
  }
);

// =============================================
// AI METADATA SCHEMA
// =============================================

export const AIMetadataSchema = z.object({
  extraction_method: z.enum(['chat', 'document', 'manual']).optional(),
  source_text: z.string().max(5000).optional(),
  extracted_fields: z.array(z.string()).optional(),
  model_used: z.string().max(100).optional(),
  timestamp: z.string().datetime().optional(),
});

// =============================================
// CREATE TRANSACTION SCHEMA
// =============================================

export const CreateCashflowTransactionSchema = z.object({
  // Required fields
  transaction_type: TransactionTypeSchema,
  description: z.string().min(1).max(MAX_DESCRIPTION_LENGTH).transform(sanitizeText),
  amount: z.number()
    .positive()
    .min(MIN_TRANSACTION_AMOUNT)
    .max(MAX_TRANSACTION_AMOUNT),

  // Optional relationships
  category: z.string().max(MAX_CATEGORY_LENGTH).optional().transform((val) =>
    val ? sanitizeText(val) : undefined
  ),
  invoice_id: z.string().uuid().optional(),
  order_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),

  // Optional dates
  due_date: z.string().date().optional(),
  expected_date: z.string().date().optional(),

  // Recurrence
  is_recurring: z.boolean().default(false),
  recurrence_pattern: RecurrencePatternSchema.optional(),

  // Priority
  priority_score: z.number()
    .int()
    .min(MIN_PRIORITY_SCORE)
    .max(MAX_PRIORITY_SCORE)
    .optional(),

  // AI metadata
  ai_extracted: z.boolean().default(false),
  ai_metadata: AIMetadataSchema.optional(),
  ai_confidence: z.number()
    .min(MIN_AI_CONFIDENCE)
    .max(MAX_AI_CONFIDENCE)
    .optional(),
}).refine(
  (data) => {
    // If is_recurring is true, must have recurrence_pattern
    if (data.is_recurring && !data.recurrence_pattern) {
      return false;
    }
    return true;
  },
  {
    message: 'Recurrence pattern required for recurring transactions',
    path: ['recurrence_pattern'],
  }
);

// =============================================
// UPDATE TRANSACTION SCHEMA
// =============================================

export const UpdateCashflowTransactionSchema = z.object({
  description: z.string().min(1).max(MAX_DESCRIPTION_LENGTH).transform(sanitizeText).optional(),
  amount: z.number()
    .positive()
    .min(MIN_TRANSACTION_AMOUNT)
    .max(MAX_TRANSACTION_AMOUNT)
    .optional(),
  category: z.string().max(MAX_CATEGORY_LENGTH).transform(sanitizeText).optional(),
  due_date: z.string().date().optional(),
  expected_date: z.string().date().optional(),
  actual_date: z.string().date().optional(),
  status: CashflowStatusSchema.optional(),
  priority_score: z.number()
    .int()
    .min(MIN_PRIORITY_SCORE)
    .max(MAX_PRIORITY_SCORE)
    .optional(),
  board_column: BoardColumnSchema.optional(),
  board_position: z.number().int().min(0).optional(),
  recurrence_pattern: RecurrencePatternSchema.optional(),
});

// =============================================
// MOVE TRANSACTION SCHEMA
// =============================================

export const MoveCashflowTransactionSchema = z.object({
  transaction_id: z.string().uuid(),
  target_column: BoardColumnSchema,
  target_position: z.number().int().min(0),
  update_due_date: z.boolean().default(false),
});

// =============================================
// MARK PAID SCHEMA
// =============================================

export const MarkPaidSchema = z.object({
  actual_date: z.string().date().optional(),
  notes: z.string().max(2000).transform(sanitizeText).optional(),
});

// =============================================
// QUERY/LIST SCHEMAS
// =============================================

export const CashflowListQuerySchema = z.object({
  // Filters
  transaction_type: z.union([
    TransactionTypeSchema,
    z.array(TransactionTypeSchema),
  ]).optional(),
  status: z.union([
    CashflowStatusSchema,
    z.array(CashflowStatusSchema),
  ]).optional(),
  board_column: z.union([
    BoardColumnSchema,
    z.array(BoardColumnSchema),
  ]).optional(),
  category: z.string().max(MAX_CATEGORY_LENGTH).optional(),
  client_id: z.string().uuid().optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  search: z.string().max(200).optional(),
  include_recurring: z.boolean().default(true),

  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(50),

  // Sorting
  sort_by: z.enum([
    'due_date',
    'amount',
    'created_at',
    'updated_at',
    'priority_score',
  ]).default('due_date'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// =============================================
// BOARD QUERY SCHEMA
// =============================================

export const CashflowBoardQuerySchema = z.object({
  // Optional filters
  transaction_type: TransactionTypeSchema.optional(),
  client_id: z.string().uuid().optional(),
  category: z.string().max(MAX_CATEGORY_LENGTH).optional(),
  include_collected: z.boolean().default(false), // Hide collected by default
});

// =============================================
// FORECAST QUERY SCHEMA
// =============================================

export const CashflowForecastQuerySchema = z.object({
  weeks: z.coerce.number().int().min(1).max(FORECAST_MAX_WEEKS).default(12),
  include_expenses: z.boolean().default(true),
  include_income: z.boolean().default(true),
  group_by: z.enum(['week', 'month']).default('week'),
});

// =============================================
// SUMMARY QUERY SCHEMA
// =============================================

export const CashflowSummaryQuerySchema = z.object({
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  group_by: z.enum(['column', 'category', 'type']).default('column'),
});

// =============================================
// BATCH OPERATIONS SCHEMAS
// =============================================

export const BatchCreateTransactionsSchema = z.object({
  transactions: z.array(CreateCashflowTransactionSchema).min(1).max(100),
  validate_only: z.boolean().default(false), // Dry run mode
});

export const BatchUpdateTransactionsSchema = z.object({
  transaction_ids: z.array(z.string().uuid()).min(1).max(50),
  updates: UpdateCashflowTransactionSchema,
});

export const BatchDeleteTransactionsSchema = z.object({
  transaction_ids: z.array(z.string().uuid()).min(1).max(50),
});

export const BatchMarkPaidSchema = z.object({
  transaction_ids: z.array(z.string().uuid()).min(1).max(50),
  actual_date: z.string().date().optional(),
});

// =============================================
// AI EXTRACTION SCHEMA
// =============================================

export const ExtractExpenseFromTextSchema = z.object({
  text: z.string().min(1).max(5000),
  default_category: z.string().max(MAX_CATEGORY_LENGTH).optional(),
  client_id: z.string().uuid().optional(),
  order_id: z.string().uuid().optional(),
});

export const ExtractExpenseFromDocumentSchema = z.object({
  file_url: z.string().url(),
  file_type: z.enum(['pdf', 'image', 'txt', 'doc', 'docx']),
  client_id: z.string().uuid().optional(),
  order_id: z.string().uuid().optional(),
});

// =============================================
// SYNC SCHEMA
// =============================================

export const ManualSyncSchema = z.object({
  invoice_ids: z.array(z.string().uuid()).optional(), // Sync specific invoices
  full_sync: z.boolean().default(false), // Re-sync all invoices
});

// =============================================
// EXPORT SCHEMA
// =============================================

export const ExportCashflowSchema = z.object({
  format: z.enum(['csv', 'pdf', 'excel']),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  transaction_type: TransactionTypeSchema.optional(),
  include_collected: z.boolean().default(false),
});

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Validate and parse query parameters
 */
export function parseListQuery(params: unknown) {
  return CashflowListQuerySchema.parse(params);
}

/**
 * Validate and parse board query parameters
 */
export function parseBoardQuery(params: unknown) {
  return CashflowBoardQuerySchema.parse(params);
}

/**
 * Validate and parse forecast query parameters
 */
export function parseForecastQuery(params: unknown) {
  return CashflowForecastQuerySchema.parse(params);
}

/**
 * Validate create transaction input
 */
export function validateCreateTransaction(data: unknown) {
  return CreateCashflowTransactionSchema.parse(data);
}

/**
 * Validate update transaction input
 */
export function validateUpdateTransaction(data: unknown) {
  return UpdateCashflowTransactionSchema.parse(data);
}

/**
 * Validate move transaction input
 */
export function validateMoveTransaction(data: unknown) {
  return MoveCashflowTransactionSchema.parse(data);
}

/**
 * Validate batch operations
 */
export function validateBatchCreate(data: unknown) {
  return BatchCreateTransactionsSchema.parse(data);
}

export function validateBatchUpdate(data: unknown) {
  return BatchUpdateTransactionsSchema.parse(data);
}

export function validateBatchDelete(data: unknown) {
  return BatchDeleteTransactionsSchema.parse(data);
}

/**
 * Validate AI extraction
 */
export function validateTextExtraction(data: unknown) {
  return ExtractExpenseFromTextSchema.parse(data);
}

export function validateDocumentExtraction(data: unknown) {
  return ExtractExpenseFromDocumentSchema.parse(data);
}

// =============================================
// TYPE EXPORTS
// =============================================

export type CreateCashflowTransactionInput = z.infer<typeof CreateCashflowTransactionSchema>;
export type UpdateCashflowTransactionInput = z.infer<typeof UpdateCashflowTransactionSchema>;
export type MoveCashflowTransactionInput = z.infer<typeof MoveCashflowTransactionSchema>;
export type CashflowListQuery = z.infer<typeof CashflowListQuerySchema>;
export type CashflowBoardQuery = z.infer<typeof CashflowBoardQuerySchema>;
export type CashflowForecastQuery = z.infer<typeof CashflowForecastQuerySchema>;
export type ExtractExpenseFromTextInput = z.infer<typeof ExtractExpenseFromTextSchema>;
export type ExtractExpenseFromDocumentInput = z.infer<typeof ExtractExpenseFromDocumentSchema>;
