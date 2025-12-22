/**
 * P2.3: ValueTrac Portal Configuration
 * Portal-specific selectors and workflows for ValueTrac
 */

import type { PortalConfigTemplate } from './generic';

/**
 * ValueTrac portal configuration template
 */
export const valuetracPortalConfig: PortalConfigTemplate = {
  portalType: 'valuetrac',
  name: 'ValueTrac',
  defaultSelectors: {
    // Login selectors
    usernameField: '#UserName, input[name="UserName"]',
    passwordField: '#Password, input[name="Password"]',
    loginButton: '#btnLogin, button[type="submit"]',
    loginSuccessIndicator: '.dashboard-container, #main-dashboard, .vt-header',

    // Order list selectors
    orderTable: '#OrderGrid, .order-grid, table.orders',
    orderRow: 'tr[data-orderid], .order-row',
    orderIdCell: 'td.order-id, .vt-order-number',
    orderStatusCell: 'td.order-status, .vt-status',
    orderActionsCell: 'td.actions, .vt-actions',

    // Order action selectors
    acceptButton: '.btn-accept, #btnAccept, button[data-action="accept"]',
    rejectButton: '.btn-decline, #btnDecline, button[data-action="decline"]',
    downloadButton: '.btn-download, #btnDownload, a.download-link',
    submitButton: '#btnSubmit, .btn-submit',

    // Custom selectors
    custom: {
      feeField: '#AppraisalFee, input[name="fee"]',
      dueDateField: '#DueDate, input[name="dueDate"]',
      notesField: '#Notes, textarea[name="notes"]',
      propertyAddress: '.property-address, #PropertyAddress',
      clientName: '.client-name, #ClientName',
      orderType: '.order-type, #OrderType',
      confirmModal: '.modal-confirm, #confirmModal',
      confirmYes: '.btn-confirm-yes, #btnYes',
      confirmNo: '.btn-confirm-no, #btnNo',
    },
  },
  defaultWorkflows: [
    {
      name: 'accept_order',
      description: 'Accept an order on ValueTrac',
      steps: [
        { action: 'navigate', value: '{{loginUrl}}' },
        { action: 'fill', selector: '#UserName', value: '{{username}}' },
        { action: 'fill', selector: '#Password', value: '{{password}}' },
        { action: 'click', selector: '#btnLogin' },
        { action: 'wait', timeout: 3000 },
        { action: 'assert', selector: '.dashboard-container', assertCondition: 'visible' },
        { action: 'navigate', value: '{{orderUrl}}' },
        { action: 'wait', timeout: 2000 },
        { action: 'screenshot' },
        { action: 'click', selector: '.btn-accept' },
        { action: 'wait', timeout: 1000 },
        // Handle confirmation modal if it appears
        { action: 'click', selector: '.btn-confirm-yes', optional: true },
        { action: 'wait', timeout: 2000 },
        { action: 'screenshot' },
        { action: 'extract', selector: '.order-status', extractAs: 'newStatus' },
      ],
      requiresApproval: false,
      timeout: 60000,
    },
    {
      name: 'check_status',
      description: 'Check order status on ValueTrac',
      steps: [
        { action: 'navigate', value: '{{loginUrl}}' },
        { action: 'fill', selector: '#UserName', value: '{{username}}' },
        { action: 'fill', selector: '#Password', value: '{{password}}' },
        { action: 'click', selector: '#btnLogin' },
        { action: 'wait', timeout: 3000 },
        { action: 'navigate', value: '{{orderListUrl}}' },
        { action: 'wait', timeout: 2000 },
        { action: 'fill', selector: '#searchOrder', value: '{{orderNumber}}' },
        { action: 'click', selector: '#btnSearch' },
        { action: 'wait', timeout: 2000 },
        { action: 'extract', selector: '.vt-status', extractAs: 'status' },
        { action: 'extract', selector: '.vt-order-number', extractAs: 'orderNumber' },
        { action: 'screenshot' },
      ],
      requiresApproval: false,
      timeout: 45000,
    },
    {
      name: 'download_documents',
      description: 'Download order documents from ValueTrac',
      steps: [
        { action: 'navigate', value: '{{loginUrl}}' },
        { action: 'fill', selector: '#UserName', value: '{{username}}' },
        { action: 'fill', selector: '#Password', value: '{{password}}' },
        { action: 'click', selector: '#btnLogin' },
        { action: 'wait', timeout: 3000 },
        { action: 'navigate', value: '{{orderUrl}}' },
        { action: 'wait', timeout: 2000 },
        { action: 'click', selector: '.tab-documents, #documentsTab' },
        { action: 'wait', timeout: 1000 },
        { action: 'click', selector: '.btn-download-all, #btnDownloadAll' },
        { action: 'wait', timeout: 5000 },
        { action: 'screenshot' },
      ],
      requiresApproval: false,
      timeout: 90000,
    },
    {
      name: 'submit_report',
      description: 'Submit completed report on ValueTrac',
      steps: [
        { action: 'navigate', value: '{{loginUrl}}' },
        { action: 'fill', selector: '#UserName', value: '{{username}}' },
        { action: 'fill', selector: '#Password', value: '{{password}}' },
        { action: 'click', selector: '#btnLogin' },
        { action: 'wait', timeout: 3000 },
        { action: 'navigate', value: '{{orderUrl}}' },
        { action: 'wait', timeout: 2000 },
        { action: 'click', selector: '.tab-upload, #uploadTab' },
        { action: 'wait', timeout: 1000 },
        { action: 'screenshot' },
        // File upload would happen here via parameters
        { action: 'click', selector: '#btnSubmit' },
        { action: 'wait', timeout: 1000 },
        { action: 'click', selector: '.btn-confirm-yes', optional: true },
        { action: 'wait', timeout: 3000 },
        { action: 'screenshot' },
      ],
      requiresApproval: true, // Always require approval for submissions
      timeout: 120000,
    },
  ],
  defaultRateLimits: {
    maxJobsPerHour: 30,
    maxJobsPerDay: 150,
    minDelayBetweenJobsMs: 3000,
    maxConcurrentJobs: 1,
  },
  urlPatterns: {
    base: 'https://www.valuetrac.com',
    login: '/Account/Login',
    orderList: '/Orders',
    orderDetail: '/Orders/Detail/{orderId}',
  },
};

/**
 * Get ValueTrac-specific URLs
 */
export function getValuetracUrls(baseUrl: string = 'https://www.valuetrac.com'): {
  login: string;
  orderList: string;
  orderDetail: (orderId: string) => string;
  dashboard: string;
} {
  const base = baseUrl.replace(/\/$/, '');
  return {
    login: `${base}/Account/Login`,
    orderList: `${base}/Orders`,
    orderDetail: (orderId: string) => `${base}/Orders/Detail/${orderId}`,
    dashboard: `${base}/Dashboard`,
  };
}

/**
 * Parse ValueTrac order status
 */
export function parseValuetracStatus(statusText: string): {
  status: string;
  isActionable: boolean;
  needsAcceptance: boolean;
} {
  const normalized = statusText.toLowerCase().trim();

  const statusMap: Record<string, { status: string; isActionable: boolean; needsAcceptance: boolean }> = {
    'new': { status: 'new', isActionable: true, needsAcceptance: true },
    'pending': { status: 'pending', isActionable: true, needsAcceptance: true },
    'assigned': { status: 'assigned', isActionable: true, needsAcceptance: false },
    'accepted': { status: 'accepted', isActionable: true, needsAcceptance: false },
    'in progress': { status: 'in_progress', isActionable: true, needsAcceptance: false },
    'completed': { status: 'completed', isActionable: false, needsAcceptance: false },
    'submitted': { status: 'submitted', isActionable: false, needsAcceptance: false },
    'delivered': { status: 'delivered', isActionable: false, needsAcceptance: false },
    'cancelled': { status: 'cancelled', isActionable: false, needsAcceptance: false },
    'declined': { status: 'declined', isActionable: false, needsAcceptance: false },
  };

  return statusMap[normalized] || {
    status: normalized,
    isActionable: false,
    needsAcceptance: false,
  };
}

/**
 * Extract order details from ValueTrac page
 */
export function extractValuetracOrderData(extractedData: Record<string, unknown>): {
  orderNumber?: string;
  propertyAddress?: string;
  clientName?: string;
  fee?: number;
  dueDate?: string;
  status?: string;
} {
  return {
    orderNumber: extractedData.orderNumber as string | undefined,
    propertyAddress: extractedData.propertyAddress as string | undefined,
    clientName: extractedData.clientName as string | undefined,
    fee: extractedData.fee ? parseFloat(String(extractedData.fee).replace(/[$,]/g, '')) : undefined,
    dueDate: extractedData.dueDate as string | undefined,
    status: extractedData.status as string | undefined,
  };
}
