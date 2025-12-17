/**
 * Order Processing Workflow
 * Automatically validates and processes new orders
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface OrderProcessingResult {
  success: boolean;
  orderId: string;
  status: 'processed' | 'exception' | 'skipped';
  pricingValid: boolean;
  creditApproved: boolean;
  requirementsMet: boolean;
  exceptions: OrderException[];
  autoFixAttempted: boolean;
  autoFixSuccessful: boolean;
  message: string;
}

export interface OrderException {
  type: 'pricing_error' | 'credit_hold' | 'missing_requirements' | 'validation_error' | 'system_error';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  details: any;
  canAutoFix: boolean;
}

export interface PricingValidationResult {
  valid: boolean;
  errors: PricingError[];
  warnings: string[];
  suggestedCorrections?: PricingCorrection[];
}

export interface PricingError {
  field: string;
  expected: number | string;
  actual: number | string;
  message: string;
}

export interface PricingCorrection {
  field: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;
}

export interface CreditCheckResult {
  approved: boolean;
  status: 'approved' | 'hold' | 'denied' | 'unknown';
  creditLimit?: number;
  currentBalance?: number;
  availableCredit?: number;
  reason?: string;
}

export interface RequirementCheckResult {
  complete: boolean;
  missing: MissingRequirement[];
}

export interface MissingRequirement {
  requirement: string;
  description: string;
  isCritical: boolean;
}

// ============================================================================
// Main Processing Function
// ============================================================================

/**
 * Process a new order with full validation
 */
export async function processNewOrder(
  tenantId: string,
  orderId: string
): Promise<OrderProcessingResult> {
  const supabase = createServiceRoleClient();
  const exceptions: OrderException[] = [];
  let autoFixAttempted = false;
  let autoFixSuccessful = false;

  try {
    // Get the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        clients!orders_client_id_fkey(
          id,
          company_name,
          credit_limit,
          payment_terms,
          is_active
        )
      `)
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (orderError || !order) {
      return {
        success: false,
        orderId,
        status: 'exception',
        pricingValid: false,
        creditApproved: false,
        requirementsMet: false,
        exceptions: [{
          type: 'system_error',
          severity: 'critical',
          message: 'Order not found',
          details: { error: orderError?.message },
          canAutoFix: false,
        }],
        autoFixAttempted: false,
        autoFixSuccessful: false,
        message: 'Order not found',
      };
    }

    console.log(`[OrderProcessor] Processing order ${order.order_number} for client ${order.clients?.company_name}`);

    // Check if order is already processed
    const { data: existingQueue } = await supabase
      .from('order_processing_queue')
      .select('status')
      .eq('order_id', orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (existingQueue?.status === 'completed') {
      return {
        success: true,
        orderId,
        status: 'skipped',
        pricingValid: true,
        creditApproved: true,
        requirementsMet: true,
        exceptions: [],
        autoFixAttempted: false,
        autoFixSuccessful: false,
        message: 'Order already processed',
      };
    }

    // Step 1: Validate pricing
    console.log(`[OrderProcessor] Validating pricing...`);
    const pricingResult = await validatePricing(order, tenantId);

    if (!pricingResult.valid) {
      for (const error of pricingResult.errors) {
        exceptions.push({
          type: 'pricing_error',
          severity: 'error',
          message: error.message,
          details: error,
          canAutoFix: !!pricingResult.suggestedCorrections?.find(c => c.field === error.field),
        });
      }

      // Attempt auto-fix for pricing issues
      if (pricingResult.suggestedCorrections && pricingResult.suggestedCorrections.length > 0) {
        autoFixAttempted = true;
        const fixResult = await attemptPricingAutoFix(order, pricingResult.suggestedCorrections, tenantId);
        autoFixSuccessful = fixResult.success;

        if (fixResult.success) {
          console.log(`[OrderProcessor] Auto-fixed pricing for order ${order.order_number}`);
        }
      }
    }

    // Step 2: Check credit approval (for bill orders)
    console.log(`[OrderProcessor] Checking credit...`);
    let creditResult: CreditCheckResult = { approved: true, status: 'approved' };

    if (isBillOrder(order)) {
      creditResult = await checkCreditApproval(order, tenantId);

      if (!creditResult.approved) {
        exceptions.push({
          type: 'credit_hold',
          severity: 'error',
          message: `Credit ${creditResult.status}: ${creditResult.reason || 'No reason provided'}`,
          details: creditResult,
          canAutoFix: false,
        });
      }
    }

    // Step 3: Validate requirements
    console.log(`[OrderProcessor] Checking requirements...`);
    const requirementsResult = await validateRequirements(order, tenantId);

    if (!requirementsResult.complete) {
      for (const missing of requirementsResult.missing) {
        exceptions.push({
          type: 'missing_requirements',
          severity: missing.isCritical ? 'error' : 'warning',
          message: missing.description,
          details: missing,
          canAutoFix: false,
        });
      }
    }

    // Determine overall result
    const hasBlockingExceptions = exceptions.some(e => e.severity === 'error' || e.severity === 'critical');
    const success = !hasBlockingExceptions || (autoFixAttempted && autoFixSuccessful);

    // Update or create queue record
    await supabase
      .from('order_processing_queue')
      .upsert({
        tenant_id: tenantId,
        order_id: orderId,
        status: success ? 'completed' : 'failed',
        pricing_valid: pricingResult.valid || autoFixSuccessful,
        pricing_errors: pricingResult.errors,
        credit_approved: creditResult.approved,
        credit_details: creditResult,
        requirements_met: requirementsResult.complete,
        missing_requirements: requirementsResult.missing,
        auto_fix_attempted: autoFixAttempted,
        auto_fix_successful: autoFixSuccessful,
        processed_by: 'agent',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,order_id',
      });

    // Create exception records for unresolved issues
    if (exceptions.length > 0 && !autoFixSuccessful) {
      for (const exception of exceptions.filter(e => e.severity !== 'warning')) {
        await supabase.from('order_processing_exceptions').insert({
          tenant_id: tenantId,
          order_id: orderId,
          exception_type: exception.type,
          exception_data: exception,
          severity: exception.severity,
        });
      }
    }

    const message = success
      ? `Order ${order.order_number} processed successfully`
      : `Order ${order.order_number} has ${exceptions.filter(e => e.severity !== 'warning').length} issues requiring attention`;

    console.log(`[OrderProcessor] ${message}`);

    return {
      success,
      orderId,
      status: success ? 'processed' : 'exception',
      pricingValid: pricingResult.valid || autoFixSuccessful,
      creditApproved: creditResult.approved,
      requirementsMet: requirementsResult.complete,
      exceptions,
      autoFixAttempted,
      autoFixSuccessful,
      message,
    };
  } catch (error: any) {
    console.error(`[OrderProcessor] Error processing order ${orderId}:`, error);

    return {
      success: false,
      orderId,
      status: 'exception',
      pricingValid: false,
      creditApproved: false,
      requirementsMet: false,
      exceptions: [{
        type: 'system_error',
        severity: 'critical',
        message: error.message,
        details: { stack: error.stack },
        canAutoFix: false,
      }],
      autoFixAttempted,
      autoFixSuccessful,
      message: `Processing error: ${error.message}`,
    };
  }
}

/**
 * Process all pending orders for a tenant
 */
export async function processAllPendingOrders(
  tenantId: string
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const supabase = createServiceRoleClient();

  // Get orders in INTAKE status that haven't been processed
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('status', 'INTAKE')
    .order('created_at', { ascending: true })
    .limit(50);

  if (error || !orders) {
    console.error('[OrderProcessor] Error fetching pending orders:', error);
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const order of orders) {
    const result = await processNewOrder(tenantId, order.id);
    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }
  }

  console.log(`[OrderProcessor] Processed ${orders.length} orders: ${succeeded} succeeded, ${failed} failed`);

  return {
    processed: orders.length,
    succeeded,
    failed,
  };
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate order pricing against rate cards and product catalog
 */
async function validatePricing(order: any, tenantId: string): Promise<PricingValidationResult> {
  const supabase = createServiceRoleClient();
  const errors: PricingError[] = [];
  const warnings: string[] = [];
  const suggestedCorrections: PricingCorrection[] = [];

  // Get products for this order type
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  // Check if fee amount is reasonable
  const feeAmount = parseFloat(order.fee_amount || 0);
  const totalAmount = parseFloat(order.total_amount || 0);

  // Basic sanity checks
  if (feeAmount <= 0) {
    errors.push({
      field: 'fee_amount',
      expected: '> 0',
      actual: feeAmount,
      message: 'Fee amount must be greater than zero',
    });
  }

  if (totalAmount < feeAmount) {
    errors.push({
      field: 'total_amount',
      expected: `>= ${feeAmount}`,
      actual: totalAmount,
      message: 'Total amount cannot be less than fee amount',
    });

    suggestedCorrections.push({
      field: 'total_amount',
      currentValue: totalAmount,
      suggestedValue: feeAmount,
      reason: 'Total should at minimum equal the fee amount',
    });
  }

  // Match against product catalog if available
  if (products && products.length > 0 && order.order_type) {
    const matchingProduct = products.find(
      (p) => p.name.toLowerCase().includes(order.order_type.toLowerCase()) ||
             order.order_type.toLowerCase().includes(p.name.toLowerCase())
    );

    if (matchingProduct) {
      const expectedPrice = parseFloat(matchingProduct.base_price || 0);

      // Check if fee is within 20% of expected
      if (expectedPrice > 0 && Math.abs(feeAmount - expectedPrice) / expectedPrice > 0.2) {
        warnings.push(
          `Fee amount (${feeAmount}) differs significantly from catalog price (${expectedPrice}) for ${matchingProduct.name}`
        );
      }
    }
  }

  // Check for tech fee
  const techFee = parseFloat(order.tech_fee || 0);
  if (techFee < 0) {
    errors.push({
      field: 'tech_fee',
      expected: '>= 0',
      actual: techFee,
      message: 'Tech fee cannot be negative',
    });

    suggestedCorrections.push({
      field: 'tech_fee',
      currentValue: techFee,
      suggestedValue: 0,
      reason: 'Tech fee should be zero or positive',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestedCorrections: suggestedCorrections.length > 0 ? suggestedCorrections : undefined,
  };
}

/**
 * Check credit approval for a client
 */
async function checkCreditApproval(order: any, tenantId: string): Promise<CreditCheckResult> {
  const client = order.clients;

  if (!client) {
    return {
      approved: false,
      status: 'unknown',
      reason: 'Client information not available',
    };
  }

  // Check if client is active
  if (!client.is_active) {
    return {
      approved: false,
      status: 'denied',
      reason: 'Client account is inactive',
    };
  }

  // Check credit limit if set
  const creditLimit = parseFloat(client.credit_limit || 0);
  const orderAmount = parseFloat(order.total_amount || 0);

  if (creditLimit > 0) {
    const supabase = createServiceRoleClient();

    // Get current outstanding balance
    const { data: outstandingOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('client_id', client.id)
      .eq('tenant_id', tenantId)
      .in('status', ['DELIVERED', 'WORKFILE', 'FINALIZATION'])
      .is('invoiced_at', null);

    const currentBalance = (outstandingOrders || []).reduce(
      (sum, o) => sum + parseFloat(o.total_amount || 0),
      0
    );

    const availableCredit = creditLimit - currentBalance;

    if (orderAmount > availableCredit) {
      return {
        approved: false,
        status: 'hold',
        creditLimit,
        currentBalance,
        availableCredit,
        reason: `Order amount ($${orderAmount.toFixed(2)}) exceeds available credit ($${availableCredit.toFixed(2)})`,
      };
    }

    return {
      approved: true,
      status: 'approved',
      creditLimit,
      currentBalance,
      availableCredit,
    };
  }

  // No credit limit set - approved by default
  return {
    approved: true,
    status: 'approved',
    reason: 'No credit limit configured',
  };
}

/**
 * Validate order requirements (attachments, insurance, etc.)
 */
async function validateRequirements(order: any, tenantId: string): Promise<RequirementCheckResult> {
  const missing: MissingRequirement[] = [];

  // Check for property address
  if (!order.property_address) {
    missing.push({
      requirement: 'property_address',
      description: 'Property address is required',
      isCritical: true,
    });
  }

  // Check for borrower contact information
  if (!order.borrower_email && !order.borrower_phone) {
    missing.push({
      requirement: 'borrower_contact',
      description: 'Borrower email or phone number is required for scheduling',
      isCritical: false,
    });
  }

  // Check for property contact for inspections
  if (order.order_type?.toLowerCase().includes('inspection')) {
    if (!order.property_contact_phone && !order.property_contact_email) {
      missing.push({
        requirement: 'property_contact',
        description: 'Property contact information required for inspection scheduling',
        isCritical: true,
      });
    }
  }

  // Check for special instructions acknowledgment for complex orders
  if (order.special_instructions && order.special_instructions.length > 100) {
    // Just a warning, not blocking
  }

  return {
    complete: missing.filter(m => m.isCritical).length === 0,
    missing,
  };
}

// ============================================================================
// Auto-Fix Functions
// ============================================================================

/**
 * Attempt to auto-fix pricing issues
 */
async function attemptPricingAutoFix(
  order: any,
  corrections: PricingCorrection[],
  tenantId: string
): Promise<{ success: boolean; appliedCorrections: PricingCorrection[] }> {
  const supabase = createServiceRoleClient();
  const appliedCorrections: PricingCorrection[] = [];

  const updates: Record<string, any> = {};

  for (const correction of corrections) {
    // Only auto-fix safe corrections
    if (['total_amount', 'tech_fee'].includes(correction.field)) {
      updates[correction.field] = correction.suggestedValue;
      appliedCorrections.push(correction);
    }
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, appliedCorrections: [] };
  }

  const { error } = await supabase
    .from('orders')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[OrderProcessor] Auto-fix failed:', error);
    return { success: false, appliedCorrections: [] };
  }

  return { success: true, appliedCorrections };
}

// ============================================================================
// Helper Functions
// ============================================================================

function isBillOrder(order: any): boolean {
  // Determine if order is a bill (to be invoiced) vs pre-paid
  const paymentTerms = order.clients?.payment_terms?.toLowerCase() || '';

  // If client has net terms, it's a bill order
  return paymentTerms.includes('net') ||
         paymentTerms.includes('invoice') ||
         paymentTerms.includes('bill');
}
