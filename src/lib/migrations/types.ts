// Type definitions for the migration system

export type MigrationSource = 'asana' | 'hubspot' | 'csv' | 'other';
export type MigrationEntity = 'orders' | 'contacts' | 'clients' | 'deals' | 'tasks';
export type MigrationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type DuplicateStrategy = 'skip' | 'update' | 'create';
export type TransformFunction = 'lowercase' | 'toNumber' | 'toDate' | 'concat' | 'coalesce' | 'extract_domain' | 'none';

export interface FieldMapping {
  sourceColumn: string;
  targetField: string; // 'email' or 'props.custom_field' or ''
  transform?: TransformFunction;
  required?: boolean;
  transformParams?: Record<string, any>; // For concat, coalesce, etc.
}

export interface MigrationJob {
  id: string;
  user_id: string;
  source: MigrationSource;
  entity: MigrationEntity;
  mode: 'csv' | 'api';
  status: MigrationStatus;
  totals: MigrationTotals;
  mapping: FieldMapping[];
  idempotency_key?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  error_message?: string;
}

export interface MigrationTotals {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}

export interface MigrationError {
  id: number;
  job_id: string;
  row_index: number;
  raw_data: Record<string, any>;
  error_message: string;
  field?: string;
  created_at: string;
}

export interface PreviewData {
  headers: string[];
  sampleRows: Record<string, any>[];
  totalCount: number;
  fileHash: string;
  suggestedPreset?: string;
}

export interface DryRunResult {
  total: number;
  wouldInsert: number;
  wouldUpdate: number;
  wouldSkip: number;
  errors: ValidationError[];
  duplicates: DuplicateMatch[];
}

export interface ValidationError {
  rowIndex: number;
  field: string;
  message: string;
  value?: any;
}

export interface DuplicateMatch {
  rowIndex: number;
  matchedId: string;
  matchedOn: string;
  existingData: Record<string, any>;
  newData: Record<string, any>;
}

export interface DatabaseField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface MigrationPreset {
  id: string;
  name: string;
  source: MigrationSource;
  entity: MigrationEntity;
  description: string;
  mappings: FieldMapping[];
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  data: string; // base64 or text content
}

