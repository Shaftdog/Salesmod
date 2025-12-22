/**
 * P2.2 Template: Clean CSV
 * Normalizes and cleans CSV data
 */

import type { FileReference } from '../types';

interface CleanCsvParams {
  csvContent?: string;
  removeEmptyRows?: boolean;
  removeEmptyColumns?: boolean;
  trimWhitespace?: boolean;
  normalizeHeaders?: boolean;
  removeDuplicates?: boolean;
  dateFormat?: string;
  numberFormat?: 'us' | 'eu';
}

interface CleanCsvResult {
  headers: string[];
  rows: Record<string, string>[];
  originalRowCount: number;
  cleanedRowCount: number;
  removedRows: number;
  removedColumns: string[];
  duplicatesRemoved: number;
  warnings: string[];
}

/**
 * Execute CSV cleaning template
 */
export async function executeCleanCsv(
  inputParams: Record<string, unknown>,
  inputFileRefs: FileReference[]
): Promise<{
  outputData: Record<string, unknown>;
  outputFileRefs?: FileReference[];
  memoryUsedMb?: number;
}> {
  const params: CleanCsvParams = {
    removeEmptyRows: true,
    removeEmptyColumns: true,
    trimWhitespace: true,
    normalizeHeaders: true,
    removeDuplicates: false,
    numberFormat: 'us',
    ...inputParams,
  };

  // Get CSV content from params or file
  let csvContent = params.csvContent as string | undefined;

  if (!csvContent && inputFileRefs.length > 0) {
    // Would load file content here
    csvContent = `[CSV content from ${inputFileRefs[0].fileName}]`;
  }

  if (!csvContent) {
    throw new Error('No CSV content provided');
  }

  const result = cleanCsvContent(csvContent, params);

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
 * Clean CSV content
 */
function cleanCsvContent(content: string, params: CleanCsvParams): CleanCsvResult {
  const warnings: string[] = [];
  const removedColumns: string[] = [];
  let duplicatesRemoved = 0;

  // Parse CSV
  const lines = content.split('\n').map((line) => line.trim());
  if (lines.length === 0) {
    throw new Error('Empty CSV content');
  }

  // Parse header row
  let headers = parseCSVLine(lines[0]);
  const originalRowCount = lines.length - 1;

  // Normalize headers if requested
  if (params.normalizeHeaders) {
    headers = headers.map((h) => normalizeHeader(h));
  }

  // Parse data rows
  let rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;

    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};

    for (let j = 0; j < headers.length; j++) {
      let value = values[j] || '';

      // Trim whitespace
      if (params.trimWhitespace) {
        value = value.trim();
      }

      row[headers[j]] = value;
    }

    rows.push(row);
  }

  // Remove empty rows
  if (params.removeEmptyRows) {
    const before = rows.length;
    rows = rows.filter((row) => {
      return Object.values(row).some((v) => v !== '');
    });
    if (rows.length < before) {
      warnings.push(`Removed ${before - rows.length} empty rows`);
    }
  }

  // Find and remove empty columns
  if (params.removeEmptyColumns) {
    const emptyColumns = headers.filter((header) => {
      return rows.every((row) => !row[header] || row[header] === '');
    });

    for (const col of emptyColumns) {
      removedColumns.push(col);
      headers = headers.filter((h) => h !== col);
      rows = rows.map((row) => {
        const { [col]: _, ...rest } = row;
        return rest;
      });
    }

    if (emptyColumns.length > 0) {
      warnings.push(`Removed ${emptyColumns.length} empty columns`);
    }
  }

  // Remove duplicates
  if (params.removeDuplicates) {
    const seen = new Set<string>();
    const deduped: Record<string, string>[] = [];

    for (const row of rows) {
      const key = JSON.stringify(row);
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(row);
      } else {
        duplicatesRemoved++;
      }
    }

    rows = deduped;
    if (duplicatesRemoved > 0) {
      warnings.push(`Removed ${duplicatesRemoved} duplicate rows`);
    }
  }

  return {
    headers,
    rows,
    originalRowCount,
    cleanedRowCount: rows.length,
    removedRows: originalRowCount - rows.length,
    removedColumns,
    duplicatesRemoved,
    warnings,
  };
}

/**
 * Parse a single CSV line (handles quoted values)
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
 * Normalize header name
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Estimate memory usage
 */
function estimateMemoryUsage(contentLength: number): number {
  return Math.ceil((contentLength * 3 + 1024 * 1024) / (1024 * 1024));
}
