/**
 * Cashflow Planner Constants
 *
 * Configuration constants for the cashflow planning system
 */

import type {
  TransactionType,
  CashflowStatus,
  BoardColumn,
  RecurrenceFrequency,
} from '@/types/cashflow';

// =============================================
// PAGINATION
// =============================================

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 200;

// =============================================
// BOARD CONFIGURATION
// =============================================

export const BOARD_COLUMN_ORDER: BoardColumn[] = [
  'overdue',
  'current_week',
  'next_week',
  'later',
  'collected',
];

export const BOARD_COLUMN_LIMITS = {
  overdue: 100,
  current_week: 50,
  next_week: 50,
  later: 100,
  collected: 200, // Archive column, can hold more
} as const;

// Days threshold for each column
export const BOARD_COLUMN_DAY_RANGES = {
  overdue: { min: -Infinity, max: -1 }, // Past due
  current_week: { min: 0, max: 7 }, // 0-7 days
  next_week: { min: 8, max: 14 }, // 8-14 days
  later: { min: 15, max: Infinity }, // 15+ days
  collected: { min: -Infinity, max: Infinity }, // Completed (any date)
} as const;

// =============================================
// AMOUNTS & LIMITS
// =============================================

export const MIN_TRANSACTION_AMOUNT = 0.01;
export const MAX_TRANSACTION_AMOUNT = 999_999_999.99;

export const CURRENCY_DECIMALS = 2;
export const DEFAULT_CURRENCY = 'USD';

// =============================================
// PRIORITY SCORING
// =============================================

export const MIN_PRIORITY_SCORE = 0;
export const MAX_PRIORITY_SCORE = 100;
export const DEFAULT_PRIORITY_SCORE = 50;

// Priority thresholds for UI indicators
export const PRIORITY_THRESHOLDS = {
  critical: 80, // Red
  high: 60, // Orange
  medium: 40, // Yellow
  low: 20, // Green
} as const;

// =============================================
// AI EXTRACTION
// =============================================

export const MIN_AI_CONFIDENCE = 0.0;
export const MAX_AI_CONFIDENCE = 1.0;
export const CONFIDENCE_THRESHOLD = 0.7; // Minimum confidence to auto-accept

// =============================================
// TEXT LIMITS
// =============================================

export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_CATEGORY_LENGTH = 100;

// =============================================
// DATE RANGES
// =============================================

export const FORECAST_DEFAULT_WEEKS = 12; // 90 days
export const FORECAST_MAX_WEEKS = 52; // 1 year

export const HISTORY_DEFAULT_MONTHS = 3;
export const HISTORY_MAX_MONTHS = 24; // 2 years

// =============================================
// RECURRENCE
// =============================================

export const RECURRENCE_FREQUENCIES: RecurrenceFrequency[] = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
];

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export const MAX_RECURRENCE_INTERVAL = 12; // e.g., every 12 months max
export const MAX_RECURRENCE_COUNT = 100; // Max number of recurrences

export const DEFAULT_RECURRENCE_END_MONTHS = 12; // Default to 1 year from now

// =============================================
// BATCH OPERATIONS
// =============================================

export const MAX_BATCH_CREATE_SIZE = 100;
export const MAX_BATCH_UPDATE_SIZE = 50;
export const MAX_BATCH_DELETE_SIZE = 50;

// =============================================
// STATUS TRANSITIONS
// =============================================

// Valid status transitions for cashflow transactions
export const CASHFLOW_STATUS_TRANSITIONS: Record<CashflowStatus, CashflowStatus[]> = {
  pending: ['scheduled', 'paid', 'overdue', 'cancelled'],
  scheduled: ['pending', 'paid', 'overdue', 'cancelled'],
  paid: [], // Terminal state (can't change once paid)
  overdue: ['paid', 'cancelled'], // Can only pay or cancel
  cancelled: [], // Terminal state
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: CashflowStatus,
  newStatus: CashflowStatus
): boolean {
  return CASHFLOW_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}

// =============================================
// BOARD COLUMN TRANSITIONS
// =============================================

// Which columns allow manual drag-and-drop moves
export const DRAGGABLE_COLUMNS: BoardColumn[] = [
  'current_week',
  'next_week',
  'later',
];

// Columns that are auto-managed (can't manually move to these)
export const AUTO_MANAGED_COLUMNS: BoardColumn[] = ['overdue', 'collected'];

/**
 * Check if a transaction can be moved to a column
 */
export function canMoveToColumn(
  sourceColumn: BoardColumn,
  targetColumn: BoardColumn,
  status: CashflowStatus
): boolean {
  // Can't move to auto-managed columns
  if (AUTO_MANAGED_COLUMNS.includes(targetColumn)) {
    return false;
  }

  // Can't move paid/cancelled transactions
  if (status === 'paid' || status === 'cancelled') {
    return false;
  }

  return true;
}

// =============================================
// TRANSACTION TYPE ICONS & COLORS
// =============================================

export const TRANSACTION_TYPE_ICONS = {
  income: 'ArrowDownCircle', // Money coming in
  expense: 'ArrowUpCircle', // Money going out
} as const;

export const TRANSACTION_TYPE_COLORS = {
  income: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-500',
    icon: 'text-green-600',
  },
  expense: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-500',
    icon: 'text-red-600',
  },
} as const;

// =============================================
// STATUS COLORS & ICONS
// =============================================

export const STATUS_COLORS = {
  pending: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
  },
  scheduled: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
  },
  paid: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
  },
  overdue: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
  },
  cancelled: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-300',
  },
} as const;

export const STATUS_ICONS = {
  pending: 'Clock',
  scheduled: 'Calendar',
  paid: 'CheckCircle2',
  overdue: 'AlertCircle',
  cancelled: 'XCircle',
} as const;

// =============================================
// BOARD COLUMN COLORS & ICONS
// =============================================

export const BOARD_COLUMN_COLORS = {
  overdue: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    header: 'bg-red-100 text-red-800',
  },
  current_week: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    header: 'bg-yellow-100 text-yellow-800',
  },
  next_week: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    header: 'bg-blue-100 text-blue-800',
  },
  later: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    header: 'bg-gray-100 text-gray-800',
  },
  collected: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    header: 'bg-green-100 text-green-800',
  },
} as const;

export const BOARD_COLUMN_ICONS = {
  overdue: 'AlertTriangle',
  current_week: 'Clock',
  next_week: 'Calendar',
  later: 'CalendarDays',
  collected: 'CheckCircle2',
} as const;

// =============================================
// CATEGORY COLORS
// =============================================

export const CATEGORY_COLORS: Record<string, string> = {
  // Income categories
  invoice_payment: 'green',
  retainer: 'emerald',
  consulting_fee: 'teal',
  commission: 'cyan',
  other_income: 'green',

  // Expense categories
  office_rent: 'red',
  utilities: 'orange',
  software_subscription: 'blue',
  insurance: 'purple',
  payroll: 'pink',
  contractor_payment: 'rose',
  marketing: 'amber',
  office_supplies: 'yellow',
  professional_services: 'indigo',
  travel: 'violet',
  meals_entertainment: 'fuchsia',
  equipment: 'red',
  taxes: 'orange',
  loan_payment: 'red',
  other_expense: 'gray',
};

// =============================================
// FILTERS & SORTING
// =============================================

export const SORT_OPTIONS = [
  { value: 'due_date', label: 'Due Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'updated_at', label: 'Updated Date' },
  { value: 'priority_score', label: 'Priority' },
] as const;

export const DEFAULT_SORT_BY = 'due_date';
export const DEFAULT_SORT_ORDER = 'asc';

// =============================================
// KEYBOARD SHORTCUTS
// =============================================

export const KEYBOARD_SHORTCUTS = {
  // Board navigation
  NEXT_COLUMN: 'ArrowRight',
  PREV_COLUMN: 'ArrowLeft',
  NEXT_ITEM: 'ArrowDown',
  PREV_ITEM: 'ArrowUp',

  // Actions
  CREATE_TRANSACTION: 'n',
  SEARCH: '/',
  MARK_PAID: 'p',
  EDIT: 'e',
  DELETE: 'Backspace',

  // Filters
  SHOW_ALL: 'a',
  SHOW_INCOME: 'i',
  SHOW_EXPENSES: 'x',
  SHOW_OVERDUE: 'o',
} as const;

// =============================================
// ERROR MESSAGES
// =============================================

export const ERROR_MESSAGES = {
  INVALID_AMOUNT: 'Amount must be greater than 0',
  AMOUNT_TOO_LARGE: `Amount cannot exceed ${MAX_TRANSACTION_AMOUNT.toLocaleString()}`,
  INVALID_DATE: 'Invalid date format',
  DESCRIPTION_TOO_LONG: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`,
  INVALID_STATUS_TRANSITION: 'Cannot change to this status',
  CANNOT_EDIT_PAID: 'Cannot edit paid transactions',
  CANNOT_DELETE_INVOICE_LINKED: 'Cannot delete invoice-linked transactions',
  INVALID_RECURRENCE: 'Invalid recurrence pattern',
} as const;

// =============================================
// SUCCESS MESSAGES
// =============================================

export const SUCCESS_MESSAGES = {
  TRANSACTION_CREATED: 'Transaction created successfully',
  TRANSACTION_UPDATED: 'Transaction updated successfully',
  TRANSACTION_DELETED: 'Transaction deleted successfully',
  TRANSACTION_PAID: 'Transaction marked as paid',
  TRANSACTION_MOVED: 'Transaction moved successfully',
  RECURRENCE_CREATED: 'Recurring transactions created successfully',
} as const;

// =============================================
// EXPORT FORMATS
// =============================================

export const EXPORT_FORMATS = ['csv', 'pdf', 'excel'] as const;
export type ExportFormat = typeof EXPORT_FORMATS[number];

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV',
  pdf: 'PDF',
  excel: 'Excel',
};
