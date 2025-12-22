/**
 * P2.3: Generic Portal Configuration
 * Base portal class and utilities
 */

import type { VendorPortalConfig, PortalSelectors, WorkflowDefinition, RateLimits } from '../types';

// ============================================================================
// Base Portal Configuration
// ============================================================================

export interface PortalConfigTemplate {
  portalType: VendorPortalConfig['portalType'];
  name: string;
  defaultSelectors: PortalSelectors;
  defaultWorkflows: WorkflowDefinition[];
  defaultRateLimits: RateLimits;
  urlPatterns: {
    base: string;
    login?: string;
    orderList?: string;
    orderDetail?: string;
  };
}

/**
 * Generic portal configuration template
 */
export const genericPortalConfig: PortalConfigTemplate = {
  portalType: 'custom',
  name: 'Generic Portal',
  defaultSelectors: {
    usernameField: 'input[name="username"], input[type="email"], #username, #email',
    passwordField: 'input[name="password"], input[type="password"], #password',
    loginButton: 'button[type="submit"], input[type="submit"], #login-btn, .login-button',
    loginSuccessIndicator: '.dashboard, .home, .welcome, #main-content',
    orderTable: 'table.orders, #orders-table, .order-list',
    orderRow: 'tr.order-row, .order-item, [data-order-id]',
    orderIdCell: 'td.order-id, .order-number, [data-field="id"]',
    orderStatusCell: 'td.status, .order-status, [data-field="status"]',
    acceptButton: 'button.accept, .accept-order, #accept-btn, [data-action="accept"]',
    rejectButton: 'button.reject, .reject-order, #reject-btn, [data-action="reject"]',
    downloadButton: 'button.download, .download-btn, a[download], [data-action="download"]',
    submitButton: 'button.submit, input[type="submit"], #submit-btn',
  },
  defaultWorkflows: [
    {
      name: 'accept_order',
      description: 'Accept an order on the portal',
      steps: [
        { action: 'navigate', value: '{{loginUrl}}' },
        { action: 'fill', selector: '{{usernameField}}', value: '{{username}}' },
        { action: 'fill', selector: '{{passwordField}}', value: '{{password}}' },
        { action: 'click', selector: '{{loginButton}}' },
        { action: 'wait', timeout: 3000 },
        { action: 'assert', assertCondition: 'loggedIn' },
        { action: 'navigate', value: '{{orderUrl}}' },
        { action: 'wait', timeout: 2000 },
        { action: 'click', selector: '{{acceptButton}}' },
        { action: 'wait', timeout: 2000 },
        { action: 'screenshot' },
      ],
      requiresApproval: false,
      timeout: 60000,
    },
    {
      name: 'check_status',
      description: 'Check order status on the portal',
      steps: [
        { action: 'navigate', value: '{{loginUrl}}' },
        { action: 'fill', selector: '{{usernameField}}', value: '{{username}}' },
        { action: 'fill', selector: '{{passwordField}}', value: '{{password}}' },
        { action: 'click', selector: '{{loginButton}}' },
        { action: 'wait', timeout: 3000 },
        { action: 'navigate', value: '{{orderListUrl}}' },
        { action: 'wait', timeout: 2000 },
        { action: 'extract', selector: '{{orderStatusCell}}', extractAs: 'status' },
        { action: 'screenshot' },
      ],
      requiresApproval: false,
      timeout: 45000,
    },
    {
      name: 'download_documents',
      description: 'Download order documents',
      steps: [
        { action: 'navigate', value: '{{loginUrl}}' },
        { action: 'fill', selector: '{{usernameField}}', value: '{{username}}' },
        { action: 'fill', selector: '{{passwordField}}', value: '{{password}}' },
        { action: 'click', selector: '{{loginButton}}' },
        { action: 'wait', timeout: 3000 },
        { action: 'navigate', value: '{{orderUrl}}' },
        { action: 'wait', timeout: 2000 },
        { action: 'click', selector: '{{downloadButton}}' },
        { action: 'wait', timeout: 5000 },
        { action: 'screenshot' },
      ],
      requiresApproval: false,
      timeout: 90000,
    },
  ],
  defaultRateLimits: {
    maxJobsPerHour: 20,
    maxJobsPerDay: 100,
    minDelayBetweenJobsMs: 5000,
    maxConcurrentJobs: 1,
  },
  urlPatterns: {
    base: '',
    login: '/login',
    orderList: '/orders',
    orderDetail: '/orders/{orderId}',
  },
};

// ============================================================================
// Portal Config Builder
// ============================================================================

/**
 * Build a portal configuration from template
 */
export function buildPortalConfig(
  template: PortalConfigTemplate,
  overrides: {
    baseUrl: string;
    credentialName: string;
    selectors?: Partial<PortalSelectors>;
    rateLimits?: Partial<RateLimits>;
  }
): Omit<VendorPortalConfig, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> {
  return {
    portalName: template.name,
    portalType: template.portalType,
    baseUrl: overrides.baseUrl,
    loginUrl: buildUrl(overrides.baseUrl, template.urlPatterns.login),
    orderListUrl: buildUrl(overrides.baseUrl, template.urlPatterns.orderList),
    credentialName: overrides.credentialName,
    isActive: true,
    selectors: {
      ...template.defaultSelectors,
      ...overrides.selectors,
    },
    workflows: template.defaultWorkflows,
    rateLimits: {
      ...template.defaultRateLimits,
      ...overrides.rateLimits,
    },
    lastUsedAt: undefined,
    successCount: 0,
    failureCount: 0,
  };
}

/**
 * Build full URL from base and path
 */
function buildUrl(baseUrl: string, path?: string): string | undefined {
  if (!path) return undefined;
  const base = baseUrl.replace(/\/$/, '');
  const pathClean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${pathClean}`;
}

// ============================================================================
// Selector Helpers
// ============================================================================

/**
 * Generate selector variants for common patterns
 */
export function generateSelectorVariants(
  baseName: string,
  options?: { includeAria?: boolean; includeTestId?: boolean }
): string {
  const selectors: string[] = [];

  // ID based
  selectors.push(`#${baseName}`);

  // Class based
  selectors.push(`.${baseName}`);

  // Name attribute
  selectors.push(`[name="${baseName}"]`);

  // Data attribute
  selectors.push(`[data-${baseName}]`);

  // ARIA label
  if (options?.includeAria) {
    selectors.push(`[aria-label*="${baseName}"]`);
  }

  // Test ID
  if (options?.includeTestId) {
    selectors.push(`[data-testid="${baseName}"]`);
    selectors.push(`[data-test="${baseName}"]`);
  }

  return selectors.join(', ');
}

/**
 * Create login selectors from common patterns
 */
export function createLoginSelectors(): PortalSelectors {
  return {
    usernameField: [
      'input[name="username"]',
      'input[name="email"]',
      'input[type="email"]',
      'input[id="username"]',
      'input[id="email"]',
      'input[autocomplete="username"]',
    ].join(', '),
    passwordField: [
      'input[type="password"]',
      'input[name="password"]',
      'input[id="password"]',
      'input[autocomplete="current-password"]',
    ].join(', '),
    loginButton: [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Log in")',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
      '#login-button',
      '.login-btn',
    ].join(', '),
    loginSuccessIndicator: [
      '.dashboard',
      '.home',
      '#main-content',
      '[data-testid="dashboard"]',
      '.welcome-message',
    ].join(', '),
  };
}

// ============================================================================
// Workflow Template Helpers
// ============================================================================

/**
 * Create a login workflow
 */
export function createLoginWorkflow(
  selectors: PortalSelectors,
  options?: { waitAfterLogin?: number }
): WorkflowDefinition {
  return {
    name: 'login',
    description: 'Log into the portal',
    steps: [
      { action: 'fill', selector: selectors.usernameField!, value: '{{username}}' },
      { action: 'fill', selector: selectors.passwordField!, value: '{{password}}' },
      { action: 'click', selector: selectors.loginButton! },
      { action: 'wait', timeout: options?.waitAfterLogin || 3000 },
      {
        action: 'assert',
        selector: selectors.loginSuccessIndicator,
        assertCondition: 'visible',
      },
    ],
    requiresApproval: false,
    timeout: 30000,
  };
}

/**
 * Create an order acceptance workflow
 */
export function createAcceptOrderWorkflow(
  selectors: PortalSelectors,
  options?: { confirmationRequired?: boolean }
): WorkflowDefinition {
  const steps: WorkflowDefinition['steps'] = [
    { action: 'wait', timeout: 2000 },
    { action: 'click', selector: selectors.acceptButton! },
  ];

  if (options?.confirmationRequired) {
    steps.push({ action: 'wait', timeout: 1000 });
    steps.push({ action: 'click', selector: '.confirm-btn, button:has-text("Confirm")' });
  }

  steps.push({ action: 'wait', timeout: 2000 });
  steps.push({ action: 'screenshot' });

  return {
    name: 'accept_order',
    description: 'Accept an order',
    steps,
    requiresApproval: false,
    timeout: 30000,
  };
}
