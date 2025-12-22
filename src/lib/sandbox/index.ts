/**
 * P2.2: Utility Sandbox
 * Template-based script execution in controlled environment
 */

// Types
export type {
  SandboxStatus,
  TemplateType,
  ScriptTemplate,
  TemplateParameter,
  ResourceLimits,
  SandboxExecution,
  FileReference,
  ExecutionResult,
  ExecutionRequest,
} from './types';

// Executor (main entry point)
export {
  executeSandboxJob,
  runPendingExecution,
  getPendingSandboxJobs,
  getExecution,
  getRecentExecutions,
  getExecutionStats,
  queueSandboxJob,
  cancelSandboxJob,
  listTemplates,
  getTemplatesByType,
} from './executor';

// Templates
export {
  executeTemplate,
  getTemplateByName,
  getTemplateByType,
  getAvailableTemplateTypes,
  isTemplateSupported,
  // Individual template executors
  executeParsePdf,
  executeParseDocx,
  executeExtractContacts,
  executeCleanCsv,
  executeNormalizeOrders,
  executeBidComparison,
  executeEngagementReport,
  executeInvoiceExtractor,
} from './templates';
