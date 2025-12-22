/**
 * P2.3: Browser Automation Types
 */

// ============================================================================
// Job Types
// ============================================================================

export type BrowserJobStatus =
  | 'pending_approval'
  | 'approved'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export type BrowserJobType =
  | 'accept_order'
  | 'check_status'
  | 'download_documents'
  | 'submit_report'
  | 'custom_workflow';

export interface BrowserAutomationJob {
  id: string;
  tenantId: string;
  portalConfigId: string;
  jobType: BrowserJobType;
  targetUrl: string;
  orderId?: string;
  orderNumber?: string;
  parameters: Record<string, unknown>;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  status: BrowserJobStatus;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  result?: JobResult;
  errorMessage?: string;
  screenshotPaths?: string[];
  runId?: string;
  cardId?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobResult {
  success: boolean;
  data?: Record<string, unknown>;
  message?: string;
  artifacts?: JobArtifact[];
}

export interface JobArtifact {
  type: 'screenshot' | 'document' | 'log' | 'data';
  name: string;
  path?: string;
  content?: string;
  mimeType?: string;
  size?: number;
}

// ============================================================================
// Portal Configuration
// ============================================================================

export interface VendorPortalConfig {
  id: string;
  tenantId: string;
  portalName: string;
  portalType: 'valuetrac' | 'mercury' | 'alamode' | 'custom';
  baseUrl: string;
  loginUrl?: string;
  orderListUrl?: string;
  credentialName: string;
  isActive: boolean;
  selectors: PortalSelectors;
  workflows: WorkflowDefinition[];
  rateLimits: RateLimits;
  lastUsedAt?: Date;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortalSelectors {
  // Login selectors
  usernameField?: string;
  passwordField?: string;
  loginButton?: string;
  loginSuccessIndicator?: string;
  // Order list selectors
  orderTable?: string;
  orderRow?: string;
  orderIdCell?: string;
  orderStatusCell?: string;
  orderActionsCell?: string;
  // Order detail selectors
  acceptButton?: string;
  rejectButton?: string;
  downloadButton?: string;
  submitButton?: string;
  // Custom selectors
  custom?: Record<string, string>;
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  steps: WorkflowStep[];
  requiresApproval: boolean;
  timeout: number;
}

export interface WorkflowStep {
  action: 'navigate' | 'click' | 'fill' | 'select' | 'wait' | 'screenshot' | 'extract' | 'assert';
  target?: string;
  value?: string;
  selector?: string;
  timeout?: number;
  optional?: boolean;
  extractAs?: string;
  assertCondition?: string;
}

export interface RateLimits {
  maxJobsPerHour: number;
  maxJobsPerDay: number;
  minDelayBetweenJobsMs: number;
  maxConcurrentJobs: number;
}

// ============================================================================
// Domain Security
// ============================================================================

export interface DomainAllowlistEntry {
  id: string;
  domain: string;
  isGlobal: boolean;
  tenantId?: string;
  addedBy: string;
  addedAt: Date;
  reason?: string;
  expiresAt?: Date;
}

// ============================================================================
// Browser Session
// ============================================================================

export interface BrowserSession {
  id: string;
  jobId: string;
  startedAt: Date;
  lastActivityAt: Date;
  currentUrl?: string;
  cookies?: BrowserCookie[];
  isActive: boolean;
}

export interface BrowserCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly: boolean;
  secure: boolean;
}

// ============================================================================
// Execution Context
// ============================================================================

export interface ExecutionContext {
  job: BrowserAutomationJob;
  portal: VendorPortalConfig;
  credentials?: {
    username: string;
    password: string;
    [key: string]: string;
  };
  extractedData: Record<string, unknown>;
  screenshots: string[];
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// Workflow Recording
// ============================================================================

export interface RecordedWorkflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  portalConfigId: string;
  steps: RecordedStep[];
  startUrl: string;
  isValidated: boolean;
  validatedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecordedStep {
  sequence: number;
  action: string;
  selector?: string;
  value?: string;
  url?: string;
  timestamp: number;
  screenshot?: string;
  waitForNavigation?: boolean;
}

// ============================================================================
// API Types
// ============================================================================

export interface CreateJobRequest {
  portalConfigId: string;
  jobType: BrowserJobType;
  targetUrl?: string;
  orderId?: string;
  orderNumber?: string;
  parameters?: Record<string, unknown>;
  triggeredBy: string;
  runId?: string;
  cardId?: string;
}

export interface JobExecutionResult {
  jobId: string;
  success: boolean;
  status: BrowserJobStatus;
  result?: JobResult;
  durationMs: number;
  error?: string;
  screenshots?: string[];
}
