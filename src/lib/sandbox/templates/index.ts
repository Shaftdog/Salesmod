/**
 * P2.2: Sandbox Template Registry
 * Registry and execution dispatcher for pre-approved templates
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { FileReference, TemplateType, ScriptTemplate } from '../types';

// Import template implementations
import { executeParsePdf } from './parse-pdf';
import { executeParseDocx } from './parse-docx';
import { executeExtractContacts } from './extract-contacts';
import { executeCleanCsv } from './clean-csv';
import { executeNormalizeOrders } from './normalize-orders';
import { executeBidComparison } from './bid-comparison';
import { executeEngagementReport } from './engagement-report';
import { executeInvoiceExtractor } from './invoice-extractor';

// ============================================================================
// Template Registry
// ============================================================================

export interface TemplateExecutor {
  (
    inputParams: Record<string, unknown>,
    inputFileRefs: FileReference[]
  ): Promise<{
    outputData: Record<string, unknown>;
    outputFileRefs?: FileReference[];
    memoryUsedMb?: number;
  }>;
}

const TEMPLATE_EXECUTORS: Record<TemplateType, TemplateExecutor> = {
  parse_pdf: executeParsePdf,
  parse_docx: executeParseDocx,
  extract_contacts: executeExtractContacts,
  clean_csv: executeCleanCsv,
  normalize_orders: executeNormalizeOrders,
  bid_comparison: executeBidComparison,
  engagement_report: executeEngagementReport,
  invoice_extractor: executeInvoiceExtractor,
};

// ============================================================================
// Template Execution
// ============================================================================

/**
 * Execute a template by type
 */
export async function executeTemplate(
  templateType: TemplateType,
  inputParams: Record<string, unknown>,
  inputFileRefs: FileReference[]
): Promise<{
  outputData: Record<string, unknown>;
  outputFileRefs?: FileReference[];
  memoryUsedMb?: number;
}> {
  const executor = TEMPLATE_EXECUTORS[templateType];

  if (!executor) {
    throw new Error(`Unknown template type: ${templateType}`);
  }

  return executor(inputParams, inputFileRefs);
}

/**
 * Get template by name from database
 */
export async function getTemplateByName(
  templateName: string
): Promise<ScriptTemplate | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('sandbox_script_templates')
    .select('*')
    .eq('template_name', templateName)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    templateName: data.template_name,
    templateType: data.template_type as TemplateType,
    description: data.description,
    language: data.language,
    scriptCode: data.script_code,
    parameters: data.parameters,
    allowedImports: data.allowed_imports,
    resourceLimits: data.resource_limits,
    version: data.version,
    isActive: data.is_active,
  };
}

/**
 * Get template by type from database
 */
export async function getTemplateByType(
  templateType: TemplateType
): Promise<ScriptTemplate | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('sandbox_script_templates')
    .select('*')
    .eq('template_type', templateType)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    templateName: data.template_name,
    templateType: data.template_type as TemplateType,
    description: data.description,
    language: data.language,
    scriptCode: data.script_code,
    parameters: data.parameters,
    allowedImports: data.allowed_imports,
    resourceLimits: data.resource_limits,
    version: data.version,
    isActive: data.is_active,
  };
}

/**
 * List all available template types
 */
export function getAvailableTemplateTypes(): TemplateType[] {
  return Object.keys(TEMPLATE_EXECUTORS) as TemplateType[];
}

/**
 * Check if a template type is supported
 */
export function isTemplateSupported(templateType: string): templateType is TemplateType {
  return templateType in TEMPLATE_EXECUTORS;
}

// Re-export individual template executors for direct use
export {
  executeParsePdf,
  executeParseDocx,
  executeExtractContacts,
  executeCleanCsv,
  executeNormalizeOrders,
  executeBidComparison,
  executeEngagementReport,
  executeInvoiceExtractor,
};
