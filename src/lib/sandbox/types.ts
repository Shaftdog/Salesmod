/**
 * P2.2: Sandbox Types
 */

export type SandboxStatus = 'pending' | 'running' | 'completed' | 'failed' | 'timeout' | 'killed';

export type TemplateType =
  | 'parse_pdf'
  | 'parse_docx'
  | 'extract_contacts'
  | 'clean_csv'
  | 'normalize_orders'
  | 'bid_comparison'
  | 'engagement_report'
  | 'invoice_extractor';

export interface ScriptTemplate {
  id: string;
  templateName: string;
  templateType: TemplateType;
  description: string;
  language: 'typescript' | 'python';
  scriptCode: string;
  parameters: TemplateParameter[];
  allowedImports: string[];
  resourceLimits: ResourceLimits;
  version: number;
  isActive: boolean;
}

export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: unknown;
  description: string;
}

export interface ResourceLimits {
  max_memory_mb: number;
  max_time_seconds: number;
}

export interface SandboxExecution {
  id?: string;
  tenantId: string;
  templateId: string;
  templateName: string;
  inputParams: Record<string, unknown>;
  inputFileRefs?: FileReference[];
  outputData?: Record<string, unknown>;
  outputFileRefs?: FileReference[];
  runId?: string;
  cardId?: string;
  triggeredBy: string;
  status: SandboxStatus;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  memoryUsedMb?: number;
  cpuTimeMs?: number;
  errorMessage?: string;
  errorStack?: string;
  createdAt?: Date;
}

export interface FileReference {
  documentId?: string;
  fileName: string;
  mimeType: string;
  size?: number;
  path?: string;
}

export interface ExecutionResult {
  success: boolean;
  executionId: string;
  outputData?: Record<string, unknown>;
  outputFileRefs?: FileReference[];
  durationMs: number;
  memoryUsedMb?: number;
  error?: string;
}

export interface ExecutionRequest {
  templateName: string;
  inputParams: Record<string, unknown>;
  inputFileRefs?: FileReference[];
  triggeredBy: string;
  runId?: string;
  cardId?: string;
}
