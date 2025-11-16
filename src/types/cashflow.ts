/**
 * Cashflow Planner Types
 *
 * Type definitions for the integrated cashflow planning system
 * Syncs automatically with invoicing system via database triggers
 */

import type { Invoice } from './invoicing';
import type { Client } from './client';
import type { Order } from './order';

// =============================================
// ENUMS
// =============================================

export type TransactionType = 'income' | 'expense';
export type CashflowStatus = 'pending' | 'scheduled' | 'paid' | 'overdue' | 'cancelled';
export type BoardColumn = 'overdue' | 'current_week' | 'next_week' | 'later' | 'collected';

export const TRANSACTION_TYPES: Record<TransactionType, string> = {
  income: 'Income',
  expense: 'Expense',
};

export const CASHFLOW_STATUSES: Record<CashflowStatus, string> = {
  pending: 'Pending',
  scheduled: 'Scheduled',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const BOARD_COLUMNS: Record<BoardColumn, string> = {
  overdue: 'Overdue',
  current_week: 'Current Week',
  next_week: 'Next Week',
  later: 'Later',
  collected: 'Collected',
};

// =============================================
// RECURRENCE PATTERN
// =============================================

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  interval: number; // e.g., every 1 week, every 2 months
  end_date?: string; // ISO date string
  count?: number; // Alternative to end_date: repeat N times
}

// =============================================
// AI METADATA
// =============================================

export interface AIMetadata {
  extraction_method?: 'chat' | 'document' | 'manual';
  source_text?: string;
  extracted_fields?: string[];
  model_used?: string;
  timestamp?: string;
}

// =============================================
// MAIN TYPES
// =============================================

export interface CashflowTransaction {
  id: string;
  org_id: string;
  user_id: string;

  // Classification
  transaction_type: TransactionType;
  category: string | null;

  // Relationships
  invoice_id: string | null;
  order_id: string | null;
  client_id: string | null;

  // Financial
  description: string;
  amount: number;

  // Dates
  due_date: string | null; // ISO date string
  expected_date: string | null;
  actual_date: string | null;

  // Recurrence
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
  parent_transaction_id: string | null;

  // Status & Priority
  status: CashflowStatus;
  priority_score: number; // 0-100

  // Board
  board_column: BoardColumn;
  board_position: number;

  // AI
  ai_extracted: boolean;
  ai_metadata: AIMetadata | null;
  ai_confidence: number | null; // 0.00-1.00

  // Audit
  created_at: string;
  updated_at: string;
}

// =============================================
// VIEW TYPES (from database views)
// =============================================

export interface CashflowBoardItem extends CashflowTransaction {
  // Joined data
  client_name: string | null;
  invoice_number: string | null;
  invoice_status: Invoice['status'] | null;
  property_address: string | null;

  // Calculated fields
  days_overdue: number;
  days_until_due: number;
}

export interface CashflowSummary {
  org_id: string;
  board_column: BoardColumn;
  transaction_type: TransactionType;
  transaction_count: number;
  total_amount: number;
  total_income: number;
  total_expenses: number;
  net_amount: number;
}

export interface CashflowForecast {
  org_id: string;
  week_start: string; // ISO date string
  transaction_count: number;
  expected_income: number;
  expected_expenses: number;
  net_cashflow: number;
}

export interface CashflowOverdueItem extends CashflowTransaction {
  client_name: string | null;
  invoice_number: string | null;
  days_overdue: number;
}

// =============================================
// BOARD STRUCTURE
// =============================================

export interface CashflowBoard {
  overdue: CashflowBoardItem[];
  current_week: CashflowBoardItem[];
  next_week: CashflowBoardItem[];
  later: CashflowBoardItem[];
  collected: CashflowBoardItem[];
}

export interface BoardColumnData {
  column: BoardColumn;
  title: string;
  items: CashflowBoardItem[];
  total_amount: number;
  item_count: number;
}

// =============================================
// CREATE/UPDATE TYPES
// =============================================

export interface CreateCashflowTransactionInput {
  transaction_type: TransactionType;
  category?: string;
  invoice_id?: string;
  order_id?: string;
  client_id?: string;
  description: string;
  amount: number;
  due_date?: string;
  expected_date?: string;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
  priority_score?: number;
  ai_extracted?: boolean;
  ai_metadata?: AIMetadata;
  ai_confidence?: number;
}

export interface UpdateCashflowTransactionInput {
  description?: string;
  amount?: number;
  due_date?: string;
  expected_date?: string;
  actual_date?: string;
  status?: CashflowStatus;
  category?: string;
  priority_score?: number;
  board_column?: BoardColumn;
  board_position?: number;
  recurrence_pattern?: RecurrencePattern;
}

export interface MoveCashflowTransactionInput {
  transaction_id: string;
  target_column: BoardColumn;
  target_position: number;
  update_due_date?: boolean; // Auto-adjust due date based on column
}

// =============================================
// QUERY PARAMS
// =============================================

export interface CashflowListParams {
  transaction_type?: TransactionType | TransactionType[];
  status?: CashflowStatus | CashflowStatus[];
  board_column?: BoardColumn | BoardColumn[];
  category?: string;
  client_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  include_recurring?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'due_date' | 'amount' | 'created_at' | 'updated_at' | 'priority_score';
  sort_order?: 'asc' | 'desc';
}

export interface CashflowForecastParams {
  weeks?: number; // Default 12 (90 days)
  include_expenses?: boolean;
  include_income?: boolean;
  group_by?: 'week' | 'month';
}

// =============================================
// CATEGORY DEFINITIONS
// =============================================

export const INCOME_CATEGORIES = [
  'invoice_payment',
  'retainer',
  'consulting_fee',
  'commission',
  'other_income',
] as const;

export const EXPENSE_CATEGORIES = [
  'office_rent',
  'utilities',
  'software_subscription',
  'insurance',
  'payroll',
  'contractor_payment',
  'marketing',
  'office_supplies',
  'professional_services',
  'travel',
  'meals_entertainment',
  'equipment',
  'taxes',
  'loan_payment',
  'other_expense',
] as const;

export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type TransactionCategory = IncomeCategory | ExpenseCategory;

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  // Income
  invoice_payment: 'Invoice Payment',
  retainer: 'Retainer',
  consulting_fee: 'Consulting Fee',
  commission: 'Commission',
  other_income: 'Other Income',

  // Expenses
  office_rent: 'Office Rent',
  utilities: 'Utilities',
  software_subscription: 'Software Subscription',
  insurance: 'Insurance',
  payroll: 'Payroll',
  contractor_payment: 'Contractor Payment',
  marketing: 'Marketing',
  office_supplies: 'Office Supplies',
  professional_services: 'Professional Services',
  travel: 'Travel',
  meals_entertainment: 'Meals & Entertainment',
  equipment: 'Equipment',
  taxes: 'Taxes',
  loan_payment: 'Loan Payment',
  other_expense: 'Other Expense',
};

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Calculate which board column a transaction belongs in
 */
export function calculateBoardColumn(
  due_date: string | null,
  status: CashflowStatus
): BoardColumn {
  if (status === 'paid' || status === 'cancelled') {
    return 'collected';
  }

  if (!due_date) {
    return 'later';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(due_date);
  dueDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'overdue';
  } else if (diffDays <= 7) {
    return 'current_week';
  } else if (diffDays <= 14) {
    return 'next_week';
  } else {
    return 'later';
  }
}

/**
 * Calculate days until due (positive) or overdue (negative)
 */
export function calculateDaysUntilDue(due_date: string | null): number {
  if (!due_date) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(due_date);
  dueDate.setHours(0, 0, 0, 0);

  return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get status color for UI
 */
export function getCashflowStatusColor(status: CashflowStatus): string {
  const colors: Record<CashflowStatus, string> = {
    pending: 'gray',
    scheduled: 'blue',
    paid: 'green',
    overdue: 'red',
    cancelled: 'gray',
  };
  return colors[status];
}

/**
 * Get board column color for UI
 */
export function getBoardColumnColor(column: BoardColumn): string {
  const colors: Record<BoardColumn, string> = {
    overdue: 'red',
    current_week: 'yellow',
    next_week: 'blue',
    later: 'gray',
    collected: 'green',
  };
  return colors[column];
}

/**
 * Format amount with transaction type indicator
 */
export function formatTransactionAmount(
  amount: number,
  transaction_type: TransactionType,
  currency: string = 'USD'
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  });

  const formatted = formatter.format(amount);
  return transaction_type === 'expense' ? `-${formatted}` : `+${formatted}`;
}

/**
 * Check if transaction can be edited
 */
export function canEditTransaction(transaction: CashflowTransaction): boolean {
  // Can't edit if paid or cancelled
  if (transaction.status === 'paid' || transaction.status === 'cancelled') {
    return false;
  }

  // Can't edit if linked to invoice (managed via invoicing system)
  if (transaction.invoice_id) {
    return false;
  }

  return true;
}

/**
 * Check if transaction can be deleted
 */
export function canDeleteTransaction(transaction: CashflowTransaction): boolean {
  // Can't delete if linked to invoice
  if (transaction.invoice_id) {
    return false;
  }

  // Can't delete if it has child recurring transactions
  // (This would need to be checked via API)

  return true;
}

/**
 * Generate next recurrence date
 */
export function calculateNextRecurrence(
  current_date: string,
  pattern: RecurrencePattern
): string | null {
  const date = new Date(current_date);

  switch (pattern.frequency) {
    case 'daily':
      date.setDate(date.getDate() + pattern.interval);
      break;
    case 'weekly':
      date.setDate(date.getDate() + (7 * pattern.interval));
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + pattern.interval);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + pattern.interval);
      break;
  }

  // Check if past end date
  if (pattern.end_date && date > new Date(pattern.end_date)) {
    return null;
  }

  return date.toISOString().split('T')[0];
}

/**
 * Validate recurrence pattern
 */
export function isValidRecurrencePattern(pattern: RecurrencePattern): boolean {
  if (!pattern.frequency || !pattern.interval) return false;
  if (pattern.interval < 1) return false;
  if (pattern.end_date && pattern.count) return false; // Can't have both
  if (pattern.count && pattern.count < 1) return false;

  return true;
}
