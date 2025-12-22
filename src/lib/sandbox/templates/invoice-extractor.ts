/**
 * P2.2 Template: Invoice Extractor
 * Extracts structured line items from invoice documents
 */

import type { FileReference } from '../types';

interface InvoiceExtractorParams {
  invoiceText?: string;
  extractVendorInfo?: boolean;
  extractTotals?: boolean;
  extractDates?: boolean;
  extractPaymentTerms?: boolean;
}

interface LineItem {
  lineNumber: number;
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  category?: string;
}

interface VendorInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

interface InvoiceExtractorResult {
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  vendor?: VendorInfo;
  lineItems: LineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  paymentTerms?: string;
  notes?: string;
  confidence: number;
  warnings: string[];
}

/**
 * Execute invoice extraction template
 */
export async function executeInvoiceExtractor(
  inputParams: Record<string, unknown>,
  inputFileRefs: FileReference[]
): Promise<{
  outputData: Record<string, unknown>;
  outputFileRefs?: FileReference[];
  memoryUsedMb?: number;
}> {
  const params: InvoiceExtractorParams = {
    extractVendorInfo: true,
    extractTotals: true,
    extractDates: true,
    extractPaymentTerms: true,
    ...inputParams,
  };

  // Get invoice text from params or file
  let invoiceText = params.invoiceText as string | undefined;

  if (!invoiceText && inputFileRefs.length > 0) {
    // Would parse PDF/image here
    invoiceText = `[Invoice content from ${inputFileRefs[0].fileName}]`;
  }

  if (!invoiceText) {
    throw new Error('No invoice content provided');
  }

  const result = extractInvoiceData(invoiceText, params);

  return {
    outputData: {
      success: true,
      result,
      processingTime: Date.now(),
    },
    memoryUsedMb: 1,
  };
}

/**
 * Extract invoice data from text
 */
function extractInvoiceData(
  text: string,
  params: InvoiceExtractorParams
): InvoiceExtractorResult {
  const warnings: string[] = [];
  let confidence = 0.5;

  // Extract invoice number
  const invoiceNumber = extractInvoiceNumber(text);
  if (invoiceNumber) confidence += 0.1;

  // Extract dates
  let invoiceDate: string | undefined;
  let dueDate: string | undefined;
  if (params.extractDates) {
    const dates = extractDates(text);
    invoiceDate = dates.invoiceDate;
    dueDate = dates.dueDate;
    if (invoiceDate) confidence += 0.1;
  }

  // Extract vendor info
  let vendor: VendorInfo | undefined;
  if (params.extractVendorInfo) {
    vendor = extractVendorInfo(text);
    if (vendor?.name) confidence += 0.1;
  }

  // Extract line items
  const lineItems = extractLineItems(text);
  if (lineItems.length > 0) confidence += 0.1;

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxTotal = lineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);

  // Try to extract actual totals from text
  let total = subtotal + taxTotal;
  if (params.extractTotals) {
    const extractedTotal = extractTotal(text);
    if (extractedTotal !== null) {
      if (Math.abs(extractedTotal - total) > 0.01) {
        warnings.push(
          `Calculated total ($${total.toFixed(2)}) differs from extracted total ($${extractedTotal.toFixed(2)})`
        );
      }
      total = extractedTotal;
      confidence += 0.1;
    }
  }

  // Extract payment terms
  let paymentTerms: string | undefined;
  if (params.extractPaymentTerms) {
    paymentTerms = extractPaymentTerms(text);
  }

  // Detect currency
  const currency = detectCurrency(text);

  return {
    invoiceNumber,
    invoiceDate,
    dueDate,
    vendor,
    lineItems,
    subtotal,
    taxTotal,
    total,
    currency,
    paymentTerms,
    confidence: Math.min(confidence, 1),
    warnings,
  };
}

/**
 * Extract invoice number
 */
function extractInvoiceNumber(text: string): string | undefined {
  const patterns = [
    /Invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    /Invoice\s+Number\s*:?\s*([A-Z0-9-]+)/i,
    /Inv\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    /Reference\s*#?\s*:?\s*([A-Z0-9-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return undefined;
}

/**
 * Extract dates
 */
function extractDates(text: string): { invoiceDate?: string; dueDate?: string } {
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g;
  const dates = text.match(datePattern) || [];

  const invoiceDatePatterns = [
    /Invoice\s+Date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /Date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ];

  const dueDatePatterns = [
    /Due\s+Date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /Payment\s+Due\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ];

  let invoiceDate: string | undefined;
  let dueDate: string | undefined;

  for (const pattern of invoiceDatePatterns) {
    const match = text.match(pattern);
    if (match) {
      invoiceDate = parseDate(match[1]);
      break;
    }
  }

  for (const pattern of dueDatePatterns) {
    const match = text.match(pattern);
    if (match) {
      dueDate = parseDate(match[1]);
      break;
    }
  }

  return { invoiceDate, dueDate };
}

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr: string): string | undefined {
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  return undefined;
}

/**
 * Extract vendor information
 */
function extractVendorInfo(text: string): VendorInfo {
  const vendor: VendorInfo = {};

  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) vendor.email = emailMatch[0];

  // Extract phone
  const phoneMatch = text.match(/(?:\+1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
  if (phoneMatch) vendor.phone = phoneMatch[0];

  // Extract tax ID (EIN format)
  const taxIdMatch = text.match(/(?:Tax\s*ID|EIN)\s*:?\s*(\d{2}-\d{7})/i);
  if (taxIdMatch) vendor.taxId = taxIdMatch[1];

  return vendor;
}

/**
 * Extract line items from invoice text
 */
function extractLineItems(text: string): LineItem[] {
  const lineItems: LineItem[] = [];

  // Look for common line item patterns
  // Pattern: Description ... Qty ... Unit Price ... Amount
  const linePattern = /(.+?)\s+(\d+)\s+\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)/g;

  let match;
  let lineNumber = 1;

  while ((match = linePattern.exec(text)) !== null) {
    const description = match[1].trim();
    const quantity = parseInt(match[2], 10);
    const unitPrice = parseFloat(match[3].replace(/,/g, ''));
    const amount = parseFloat(match[4].replace(/,/g, ''));

    // Skip if values don't make sense
    if (isNaN(quantity) || isNaN(amount)) continue;
    if (description.length < 3) continue;

    lineItems.push({
      lineNumber: lineNumber++,
      description,
      quantity,
      unitPrice,
      amount,
    });
  }

  // If no structured items found, try simpler pattern
  if (lineItems.length === 0) {
    const simplePattern = /(.{10,50})\s+\$?([\d,]+\.?\d*)\s*$/gm;

    while ((match = simplePattern.exec(text)) !== null) {
      const description = match[1].trim();
      const amount = parseFloat(match[2].replace(/,/g, ''));

      if (isNaN(amount)) continue;
      if (amount <= 0) continue;

      lineItems.push({
        lineNumber: lineNumber++,
        description,
        amount,
      });
    }
  }

  return lineItems;
}

/**
 * Extract total amount
 */
function extractTotal(text: string): number | null {
  const patterns = [
    /Total\s*:?\s*\$?([\d,]+\.?\d*)/i,
    /Amount\s+Due\s*:?\s*\$?([\d,]+\.?\d*)/i,
    /Grand\s+Total\s*:?\s*\$?([\d,]+\.?\d*)/i,
    /Balance\s+Due\s*:?\s*\$?([\d,]+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount)) return amount;
    }
  }

  return null;
}

/**
 * Extract payment terms
 */
function extractPaymentTerms(text: string): string | undefined {
  const patterns = [
    /(?:Payment\s+)?Terms\s*:?\s*(.+?)(?:\n|$)/i,
    /(?:Net\s+)?(\d+)\s+days/i,
    /Due\s+(?:upon|on)\s+receipt/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  return undefined;
}

/**
 * Detect currency
 */
function detectCurrency(text: string): string {
  if (text.includes('€')) return 'EUR';
  if (text.includes('£')) return 'GBP';
  if (text.includes('¥')) return 'JPY';
  if (text.includes('$')) return 'USD';
  return 'USD'; // Default
}
