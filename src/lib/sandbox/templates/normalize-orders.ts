/**
 * P2.2 Template: Normalize Orders
 * Cleans and normalizes order export data from various vendor portals
 */

import type { FileReference } from '../types';

interface NormalizeOrdersParams {
  csvContent?: string;
  sourcePortal?: 'valuetrac' | 'mercury' | 'alamode' | 'generic';
  dateFormat?: string;
  addressFormat?: 'full' | 'components';
  includeRawData?: boolean;
}

interface NormalizedOrder {
  orderId: string;
  orderNumber?: string;
  externalOrderId?: string;
  propertyAddress: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
    county?: string;
    full: string;
  };
  client: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
  };
  orderType: string;
  productType?: string;
  fee: number;
  dueDate?: string;
  orderedDate?: string;
  status: string;
  assignedAppraiser?: string;
  notes?: string;
  rawData?: Record<string, string>;
}

interface NormalizeOrdersResult {
  orders: NormalizedOrder[];
  totalProcessed: number;
  successfullyNormalized: number;
  warnings: string[];
  errors: string[];
  portalDetected: string;
}

/**
 * Execute order normalization template
 */
export async function executeNormalizeOrders(
  inputParams: Record<string, unknown>,
  inputFileRefs: FileReference[]
): Promise<{
  outputData: Record<string, unknown>;
  outputFileRefs?: FileReference[];
  memoryUsedMb?: number;
}> {
  const params: NormalizeOrdersParams = {
    addressFormat: 'components',
    includeRawData: false,
    ...inputParams,
  };

  // Get CSV content from params or file
  let csvContent = params.csvContent as string | undefined;

  if (!csvContent && inputFileRefs.length > 0) {
    // Would load file content here
    csvContent = `[CSV content from ${inputFileRefs[0].fileName}]`;
  }

  if (!csvContent) {
    throw new Error('No order data provided');
  }

  const result = normalizeOrderData(csvContent, params);

  return {
    outputData: {
      success: true,
      result,
      processingTime: Date.now(),
    },
    memoryUsedMb: estimateMemoryUsage(csvContent.length),
  };
}

/**
 * Normalize order data from various portals
 */
function normalizeOrderData(
  content: string,
  params: NormalizeOrdersParams
): NormalizeOrdersResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const orders: NormalizedOrder[] = [];

  // Parse CSV
  const lines = content.split('\n').map((line) => line.trim());
  if (lines.length < 2) {
    throw new Error('Invalid order data: need header and at least one row');
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  // Detect portal based on headers
  const portalDetected = params.sourcePortal || detectPortal(headers);

  // Get field mappings for portal
  const mappings = getFieldMappings(portalDetected);

  // Process each row
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;

    try {
      const values = parseCSVLine(lines[i]);
      const rawRow: Record<string, string> = {};

      for (let j = 0; j < headers.length; j++) {
        rawRow[headers[j]] = values[j] || '';
      }

      const order = normalizeOrderRow(rawRow, mappings, params, i);
      if (order) {
        orders.push(order);
      }
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    orders,
    totalProcessed: lines.length - 1,
    successfullyNormalized: orders.length,
    warnings,
    errors,
    portalDetected,
  };
}

/**
 * Detect portal from headers
 */
function detectPortal(headers: string[]): string {
  const headerSet = new Set(headers);

  if (headerSet.has('valuetrac_order_id') || headerSet.has('vt_order_number')) {
    return 'valuetrac';
  }

  if (headerSet.has('mercury_id') || headerSet.has('mn_order_number')) {
    return 'mercury';
  }

  if (headerSet.has('alamode_id') || headerSet.has('wc_order_number')) {
    return 'alamode';
  }

  return 'generic';
}

/**
 * Get field mappings for portal
 */
function getFieldMappings(portal: string): Record<string, string[]> {
  const commonMappings = {
    orderId: ['order_id', 'orderid', 'id'],
    orderNumber: ['order_number', 'ordernumber', 'order_no', 'order#'],
    street: ['property_address', 'address', 'street_address', 'property_street'],
    city: ['property_city', 'city'],
    state: ['property_state', 'state'],
    zip: ['property_zip', 'zip', 'zipcode', 'postal_code'],
    clientName: ['client_name', 'lender_name', 'client', 'customer_name'],
    clientEmail: ['client_email', 'lender_email', 'email'],
    fee: ['fee', 'amount', 'price', 'order_fee'],
    dueDate: ['due_date', 'duedate', 'due'],
    orderedDate: ['ordered_date', 'order_date', 'created_date'],
    status: ['status', 'order_status'],
    orderType: ['order_type', 'product', 'report_type', 'appraisal_type'],
  };

  // Portal-specific overrides
  if (portal === 'valuetrac') {
    return {
      ...commonMappings,
      orderId: ['valuetrac_order_id', 'vt_id', ...commonMappings.orderId],
      orderNumber: ['vt_order_number', ...commonMappings.orderNumber],
    };
  }

  if (portal === 'mercury') {
    return {
      ...commonMappings,
      orderId: ['mercury_id', 'mn_id', ...commonMappings.orderId],
      orderNumber: ['mn_order_number', ...commonMappings.orderNumber],
    };
  }

  return commonMappings;
}

/**
 * Normalize a single order row
 */
function normalizeOrderRow(
  row: Record<string, string>,
  mappings: Record<string, string[]>,
  params: NormalizeOrdersParams,
  rowIndex: number
): NormalizedOrder | null {
  const getValue = (fieldMappings: string[]): string => {
    for (const field of fieldMappings) {
      if (row[field]) return row[field].trim();
    }
    return '';
  };

  const orderId = getValue(mappings.orderId) || `row_${rowIndex}`;
  const street = getValue(mappings.street);
  const city = getValue(mappings.city);
  const state = getValue(mappings.state);
  const zip = getValue(mappings.zip);

  if (!street || !city) {
    return null; // Skip rows without address
  }

  const feeStr = getValue(mappings.fee);
  const fee = parseFloat(feeStr.replace(/[$,]/g, '')) || 0;

  return {
    orderId,
    orderNumber: getValue(mappings.orderNumber),
    propertyAddress: {
      street,
      city,
      state,
      zip,
      full: `${street}, ${city}, ${state} ${zip}`.trim(),
    },
    client: {
      name: getValue(mappings.clientName) || 'Unknown',
      email: getValue(mappings.clientEmail),
    },
    orderType: getValue(mappings.orderType) || 'Appraisal',
    fee,
    dueDate: parseDate(getValue(mappings.dueDate)),
    orderedDate: parseDate(getValue(mappings.orderedDate)),
    status: getValue(mappings.status) || 'new',
    rawData: params.includeRawData ? row : undefined,
  };
}

/**
 * Parse various date formats
 */
function parseDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;

  // Try parsing various formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  return undefined;
}

/**
 * Parse CSV line
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Estimate memory usage
 */
function estimateMemoryUsage(contentLength: number): number {
  return Math.ceil((contentLength * 4 + 2 * 1024 * 1024) / (1024 * 1024));
}
