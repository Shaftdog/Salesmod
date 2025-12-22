/**
 * P2.3: Mercury Network Portal Configuration
 * Portal-specific selectors and workflows for Mercury Network
 */

import type { PortalConfigTemplate } from './generic';

/**
 * Mercury Network portal configuration template
 */
export const mercuryNetworkPortalConfig: PortalConfigTemplate = {
  portalType: 'mercury',
  name: 'Mercury Network',
  defaultSelectors: {
    // Login selectors
    usernameField: '#username, input[name="username"], #txtUsername',
    passwordField: '#password, input[name="password"], #txtPassword',
    loginButton: '#btnLogin, button.login-btn, input[type="submit"]',
    loginSuccessIndicator: '.mn-dashboard, #dashboard, .welcome-panel',

    // Order list selectors
    orderTable: '#orderGrid, .order-list-table, table.mn-orders',
    orderRow: 'tr.order-item, .mn-order-row, [data-order]',
    orderIdCell: 'td.mn-order-id, .order-number-cell',
    orderStatusCell: 'td.mn-status, .status-cell',
    orderActionsCell: 'td.mn-actions, .actions-cell',

    // Order action selectors
    acceptButton: '.btn-accept-order, #acceptOrder, button[data-action="accept"]',
    rejectButton: '.btn-decline-order, #declineOrder, button[data-action="decline"]',
    downloadButton: '.btn-download, #downloadDocs, a.download',
    submitButton: '#submitOrder, .btn-submit-report',

    // Custom selectors
    custom: {
      feeDisplay: '.fee-amount, #orderFee',
      dueDateDisplay: '.due-date, #dueDate',
      propertyAddress: '.property-info .address, #propertyAddress',
      clientInfo: '.client-info, #clientDetails',
      orderDetails: '.order-details-panel, #orderDetails',
      documentList: '.document-list, #docList',
      notificationBadge: '.notification-badge, .alert-count',
      filterDropdown: '#statusFilter, .filter-status',
      searchInput: '#searchOrders, .order-search input',
      paginationNext: '.pagination .next, #nextPage',
      paginationPrev: '.pagination .prev, #prevPage',
    },
  },
  defaultWorkflows: [
    {
      name: 'accept_order',
      description: 'Accept an order on Mercury Network',
      steps: [
        { action: 'navigate', value: '{{loginUrl}}' },
        { action: 'fill', selector: '#username', value: '{{username}}' },
        { action: 'fill', selector: '#password', value: '{{password}}' },
        { action: 'click', selector: '#btnLogin' },
        { action: 'wait', timeout: 4000 },
        { action: 'assert', selector: '.mn-dashboard', assertCondition: 'visible' },
        { action: 'navigate', value: '{{orderUrl}}' },
        { action: 'wait', timeout: 3000 },
        { action: 'screenshot' },
        { action: 'extract', selector: '.fee-amount', extractAs: 'fee' },
        { action: 'extract', selector: '.due-date', extractAs: 'dueDate' },
        { action: 'click', selector: '.btn-accept-order' },
        { action: 'wait', timeout: 2000 },
        // Mercury often has a terms acceptance modal
        { action: 'click', selector: '#acceptTerms, .terms-checkbox', optional: true },
        { action: 'click', selector: '#confirmAccept, .btn-confirm', optional: true },
        { action: 'wait', timeout: 3000 },
        { action: 'screenshot' },
        { action: 'extract', selector: '.mn-status', extractAs: 'newStatus' },
      ],
      requiresApproval: false,
      timeout: 75000,
    },
    {
      name: 'check_status',
      description: 'Check order status on Mercury Network',
      steps: [
        { action: 'navigate', value: '{{loginUrl}}' },
        { action: 'fill', selector: '#username', value: '{{username}}' },
        { action: 'fill', selector: '#password', value: '{{password}}' },
        { action: 'click', selector: '#btnLogin' },
        { action: 'wait', timeout: 4000 },
        { action: 'navigate', value: '{{orderListUrl}}' },
        { action: 'wait', timeout: 2000 },
        { action: 'fill', selector: '#searchOrders', value: '{{orderNumber}}' },
        { action: 'wait', timeout: 500 },
        { action: 'click', selector: '.btn-search, #btnSearch', optional: true },
        { action: 'wait', timeout: 2000 },
        { action: 'extract', selector: '.mn-status', extractAs: 'status' },
        { action: 'extract', selector: '.mn-order-id', extractAs: 'orderNumber' },
        { action: 'extract', selector: '.due-date', extractAs: 'dueDate' },
        { action: 'screenshot' },
      ],
      requiresApproval: false,
      timeout: 45000,
    },
    {
      name: 'download_documents',
      description: 'Download order documents from Mercury Network',
      steps: [
        { action: 'navigate', value: '{{loginUrl}}' },
        { action: 'fill', selector: '#username', value: '{{username}}' },
        { action: 'fill', selector: '#password', value: '{{password}}' },
        { action: 'click', selector: '#btnLogin' },
        { action: 'wait', timeout: 4000 },
        { action: 'navigate', value: '{{orderUrl}}' },
        { action: 'wait', timeout: 2000 },
        { action: 'click', selector: '.tab-documents, #documentsTab, [data-tab="documents"]' },
        { action: 'wait', timeout: 1500 },
        { action: 'extract', selector: '.document-list', extractAs: 'documentList' },
        { action: 'screenshot' },
        { action: 'click', selector: '.btn-download-all, #downloadAll' },
        { action: 'wait', timeout: 8000 },
        { action: 'screenshot' },
      ],
      requiresApproval: false,
      timeout: 120000,
    },
    {
      name: 'submit_report',
      description: 'Submit completed report on Mercury Network',
      steps: [
        { action: 'navigate', value: '{{loginUrl}}' },
        { action: 'fill', selector: '#username', value: '{{username}}' },
        { action: 'fill', selector: '#password', value: '{{password}}' },
        { action: 'click', selector: '#btnLogin' },
        { action: 'wait', timeout: 4000 },
        { action: 'navigate', value: '{{orderUrl}}' },
        { action: 'wait', timeout: 2000 },
        { action: 'click', selector: '.tab-upload, #uploadTab, [data-tab="upload"]' },
        { action: 'wait', timeout: 1500 },
        { action: 'screenshot' },
        // File upload handled externally
        { action: 'click', selector: '#submitOrder, .btn-submit-report' },
        { action: 'wait', timeout: 2000 },
        // Confirmation dialog
        { action: 'click', selector: '#confirmSubmit, .btn-confirm-submit', optional: true },
        { action: 'wait', timeout: 5000 },
        { action: 'screenshot' },
        { action: 'extract', selector: '.submission-confirmation', extractAs: 'confirmation' },
      ],
      requiresApproval: true,
      timeout: 150000,
    },
    {
      name: 'get_new_orders',
      description: 'Get list of new orders from Mercury Network',
      steps: [
        { action: 'navigate', value: '{{loginUrl}}' },
        { action: 'fill', selector: '#username', value: '{{username}}' },
        { action: 'fill', selector: '#password', value: '{{password}}' },
        { action: 'click', selector: '#btnLogin' },
        { action: 'wait', timeout: 4000 },
        { action: 'navigate', value: '{{orderListUrl}}' },
        { action: 'wait', timeout: 2000 },
        { action: 'select', selector: '#statusFilter', value: 'New' },
        { action: 'wait', timeout: 2000 },
        { action: 'extract', selector: '.order-list-table', extractAs: 'orderList' },
        { action: 'screenshot' },
      ],
      requiresApproval: false,
      timeout: 60000,
    },
  ],
  defaultRateLimits: {
    maxJobsPerHour: 25,
    maxJobsPerDay: 120,
    minDelayBetweenJobsMs: 4000,
    maxConcurrentJobs: 1,
  },
  urlPatterns: {
    base: 'https://www.mercurynetwork.com',
    login: '/mercury/login.aspx',
    orderList: '/mercury/orders/list.aspx',
    orderDetail: '/mercury/orders/detail.aspx?id={orderId}',
  },
};

/**
 * Get Mercury Network-specific URLs
 */
export function getMercuryNetworkUrls(baseUrl: string = 'https://www.mercurynetwork.com'): {
  login: string;
  orderList: string;
  orderDetail: (orderId: string) => string;
  dashboard: string;
  newOrders: string;
} {
  const base = baseUrl.replace(/\/$/, '');
  return {
    login: `${base}/mercury/login.aspx`,
    orderList: `${base}/mercury/orders/list.aspx`,
    orderDetail: (orderId: string) => `${base}/mercury/orders/detail.aspx?id=${orderId}`,
    dashboard: `${base}/mercury/dashboard.aspx`,
    newOrders: `${base}/mercury/orders/list.aspx?status=new`,
  };
}

/**
 * Parse Mercury Network order status
 */
export function parseMercuryNetworkStatus(statusText: string): {
  status: string;
  isActionable: boolean;
  needsAcceptance: boolean;
  canDownload: boolean;
  canSubmit: boolean;
} {
  const normalized = statusText.toLowerCase().trim();

  const statusMap: Record<string, {
    status: string;
    isActionable: boolean;
    needsAcceptance: boolean;
    canDownload: boolean;
    canSubmit: boolean;
  }> = {
    'new': { status: 'new', isActionable: true, needsAcceptance: true, canDownload: true, canSubmit: false },
    'pending acceptance': { status: 'pending_acceptance', isActionable: true, needsAcceptance: true, canDownload: true, canSubmit: false },
    'accepted': { status: 'accepted', isActionable: true, needsAcceptance: false, canDownload: true, canSubmit: true },
    'in progress': { status: 'in_progress', isActionable: true, needsAcceptance: false, canDownload: true, canSubmit: true },
    'inspection scheduled': { status: 'inspection_scheduled', isActionable: true, needsAcceptance: false, canDownload: true, canSubmit: true },
    'inspection complete': { status: 'inspection_complete', isActionable: true, needsAcceptance: false, canDownload: true, canSubmit: true },
    'submitted': { status: 'submitted', isActionable: false, needsAcceptance: false, canDownload: true, canSubmit: false },
    'delivered': { status: 'delivered', isActionable: false, needsAcceptance: false, canDownload: true, canSubmit: false },
    'revision requested': { status: 'revision_requested', isActionable: true, needsAcceptance: false, canDownload: true, canSubmit: true },
    'on hold': { status: 'on_hold', isActionable: false, needsAcceptance: false, canDownload: true, canSubmit: false },
    'cancelled': { status: 'cancelled', isActionable: false, needsAcceptance: false, canDownload: false, canSubmit: false },
    'declined': { status: 'declined', isActionable: false, needsAcceptance: false, canDownload: false, canSubmit: false },
  };

  return statusMap[normalized] || {
    status: normalized,
    isActionable: false,
    needsAcceptance: false,
    canDownload: false,
    canSubmit: false,
  };
}

/**
 * Extract order details from Mercury Network page
 */
export function extractMercuryNetworkOrderData(extractedData: Record<string, unknown>): {
  orderNumber?: string;
  propertyAddress?: string;
  clientName?: string;
  fee?: number;
  dueDate?: string;
  status?: string;
  loanNumber?: string;
  orderType?: string;
} {
  const feeStr = extractedData.fee as string | undefined;

  return {
    orderNumber: extractedData.orderNumber as string | undefined,
    propertyAddress: extractedData.propertyAddress as string | undefined,
    clientName: extractedData.clientName as string | undefined,
    fee: feeStr ? parseFloat(feeStr.replace(/[$,]/g, '')) : undefined,
    dueDate: extractedData.dueDate as string | undefined,
    status: extractedData.status as string | undefined,
    loanNumber: extractedData.loanNumber as string | undefined,
    orderType: extractedData.orderType as string | undefined,
  };
}

/**
 * Parse document list from Mercury Network
 */
export function parseMercuryNetworkDocuments(documentListHtml: string): {
  name: string;
  type: string;
  size?: string;
  uploadDate?: string;
}[] {
  // This would parse the HTML of the document list
  // For now, return empty array as placeholder
  console.log('[mercury-network] Parsing document list:', documentListHtml.substring(0, 100));
  return [];
}
