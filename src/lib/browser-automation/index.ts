/**
 * P2.3: Browser Automation
 * Multi-portal browser automation with security controls
 */

// Types
export type {
  BrowserJobStatus,
  BrowserJobType,
  BrowserAutomationJob,
  JobResult,
  JobArtifact,
  VendorPortalConfig,
  PortalSelectors,
  WorkflowDefinition,
  WorkflowStep,
  RateLimits,
  DomainAllowlistEntry,
  BrowserSession,
  BrowserCookie,
  ExecutionContext,
  ExecutionLog,
  RecordedWorkflow,
  RecordedStep,
  CreateJobRequest,
  JobExecutionResult,
} from './types';

// Automation Engine (main entry point)
export {
  executeJob,
  createJob,
  getPendingJobs,
  getJob,
  cancelJob,
  retryJob,
} from './automation-engine';

// Order Acceptor (specialized workflow)
export {
  acceptOrder,
  queueOrderAcceptance,
  batchAcceptOrders,
  checkOrderStatus,
  getAcceptanceStats,
} from './order-acceptor';

// Workflow Recorder
export {
  startRecording,
  addRecordedStep,
  stopRecording,
  getWorkflow,
  listWorkflows,
  deleteWorkflow,
  updateWorkflow,
  validateWorkflow,
  convertToWorkflowSteps,
  generateWorkflowDefinition,
} from './workflow-recorder';

// Security - Domain Validator
export {
  isDomainAllowed,
  addToAllowlist,
  removeFromAllowlist,
  getAllowlist,
  isInGlobalAllowlist,
  extractDomain,
  isSecureUrl,
} from './security/domain-validator';

// Security - Approval Gate
export {
  requiresApproval,
  isJobApproved,
  approveJob,
  rejectJob,
  autoApproveJob,
  getPendingApprovals,
  getPendingApprovalCount,
} from './security/approval-gate';

// Portal Configs
export {
  getPortalTemplate,
  getAvailablePortalTypes,
  createPortalConfig,
  getPortalConfig,
  listPortalConfigs,
  updatePortalConfig,
  deletePortalConfig,
  togglePortalActive,
  getPortalStats,
  // Portal-specific exports
  valuetracPortalConfig,
  getValuetracUrls,
  parseValuetracStatus,
  mercuryNetworkPortalConfig,
  getMercuryNetworkUrls,
  parseMercuryNetworkStatus,
  genericPortalConfig,
  buildPortalConfig,
} from './portal-configs';
