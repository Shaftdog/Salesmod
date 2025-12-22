/**
 * Order Processor - Automated order validation
 *
 * Validates new orders for:
 * - Pricing (fee amount, total, tech fee)
 * - Credit approval (for bill orders)
 * - Requirements (property address, borrower info, property contact)
 *
 * Auto-fixes safe issues and creates exceptions for human review.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

export interface OrderValidation {
  orderId: string;
  isValid: boolean;
  pricingValid: boolean;
  creditValid: boolean;
  requirementsValid: boolean;
  autoFixes: AutoFix[];
  exceptions: OrderException[];
}

export interface AutoFix {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
}

export interface OrderException {
  type: 'pricing' | 'credit' | 'requirements' | 'other';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details?: Record<string, unknown>;
}

interface OrderData {
  id: string;
  tenantId: string;
  clientId: string;
  productId: string | null;
  status: string;
  feeAmount: number;
  totalAmount: number;
  techFee: number;
  paymentMethod: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyState: string | null;
  propertyZip: string | null;
  borrowerName: string | null;
  borrowerEmail: string | null;
  borrowerPhone: string | null;
  propertyContactName: string | null;
  propertyContactPhone: string | null;
}

// ============================================================================
// Order Processing
// ============================================================================

/**
 * Process new orders in the queue
 */
export async function processNewOrders(tenantId: string): Promise<{
  processed: number;
  validated: number;
  exceptions: number;
}> {
  const supabase = createServiceRoleClient();

  // Get pending orders from queue
  const { data: queueItems } = await supabase
    .from('order_processing_queue')
    .select('order_id')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .limit(20);

  if (!queueItems || queueItems.length === 0) {
    return { processed: 0, validated: 0, exceptions: 0 };
  }

  let validated = 0;
  let exceptions = 0;

  for (const item of queueItems) {
    const result = await validateOrder(item.order_id);
    if (result.isValid) {
      validated++;
    } else {
      exceptions++;
    }
  }

  return {
    processed: queueItems.length,
    validated,
    exceptions,
  };
}

/**
 * Queue a new order for processing
 */
export async function queueOrderForProcessing(
  orderId: string,
  tenantId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from('order_processing_queue').upsert({
    tenant_id: tenantId,
    order_id: orderId,
    status: 'pending',
    queued_at: new Date().toISOString(),
  }, {
    onConflict: 'order_id',
  });

  if (error) {
    console.error('[OrderProcessor] Failed to queue order:', error);
    return false;
  }

  return true;
}

/**
 * Validate a single order
 */
export async function validateOrder(orderId: string): Promise<OrderValidation> {
  const supabase = createServiceRoleClient();

  // Get order data
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, tenant_id, client_id, product_id, status,
      fee_amount, total_amount, tech_fee, payment_method,
      property_address, property_city, property_state, property_zip,
      borrower_name, borrower_email, borrower_phone,
      property_contact_name, property_contact_phone
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return {
      orderId,
      isValid: false,
      pricingValid: false,
      creditValid: false,
      requirementsValid: false,
      autoFixes: [],
      exceptions: [
        {
          type: 'other',
          severity: 'error',
          message: 'Order not found',
          details: { error: error?.message },
        },
      ],
    };
  }

  const orderData: OrderData = {
    id: order.id,
    tenantId: order.tenant_id,
    clientId: order.client_id,
    productId: order.product_id,
    status: order.status,
    feeAmount: order.fee_amount || 0,
    totalAmount: order.total_amount || 0,
    techFee: order.tech_fee || 0,
    paymentMethod: order.payment_method,
    propertyAddress: order.property_address,
    propertyCity: order.property_city,
    propertyState: order.property_state,
    propertyZip: order.property_zip,
    borrowerName: order.borrower_name,
    borrowerEmail: order.borrower_email,
    borrowerPhone: order.borrower_phone,
    propertyContactName: order.property_contact_name,
    propertyContactPhone: order.property_contact_phone,
  };

  // Run validations
  const pricingResult = await validatePricing(orderData);
  const creditResult = await validateCredit(orderData);
  const requirementsResult = validateRequirements(orderData);

  // Collect all results
  const allAutoFixes = [
    ...pricingResult.autoFixes,
    ...creditResult.autoFixes,
    ...requirementsResult.autoFixes,
  ];

  const allExceptions = [
    ...pricingResult.exceptions,
    ...creditResult.exceptions,
    ...requirementsResult.exceptions,
  ];

  // Apply auto-fixes
  if (allAutoFixes.length > 0) {
    await applyAutoFixes(orderId, allAutoFixes);
  }

  // Store exceptions
  if (allExceptions.length > 0) {
    await storeExceptions(orderId, orderData.tenantId, allExceptions);
  }

  // Update queue status
  const isValid = pricingResult.isValid && creditResult.isValid && requirementsResult.isValid;
  await supabase.from('order_processing_queue').update({
    status: isValid ? 'validated' : 'exception',
    processed_at: new Date().toISOString(),
    pricing_valid: pricingResult.isValid,
    credit_valid: creditResult.isValid,
    requirements_valid: requirementsResult.isValid,
    auto_fixes: allAutoFixes,
  }).eq('order_id', orderId);

  return {
    orderId,
    isValid,
    pricingValid: pricingResult.isValid,
    creditValid: creditResult.isValid,
    requirementsValid: requirementsResult.isValid,
    autoFixes: allAutoFixes,
    exceptions: allExceptions,
  };
}

// ============================================================================
// Pricing Validation
// ============================================================================

async function validatePricing(order: OrderData): Promise<{
  isValid: boolean;
  autoFixes: AutoFix[];
  exceptions: OrderException[];
}> {
  const autoFixes: AutoFix[] = [];
  const exceptions: OrderException[] = [];
  let isValid = true;

  // Check fee amount > 0
  if (order.feeAmount <= 0) {
    exceptions.push({
      type: 'pricing',
      severity: 'error',
      message: 'Fee amount must be greater than 0',
      details: { feeAmount: order.feeAmount },
    });
    isValid = false;
  }

  // Check total >= fee
  if (order.totalAmount < order.feeAmount) {
    // Auto-fix: Set total to fee amount
    autoFixes.push({
      field: 'total_amount',
      oldValue: order.totalAmount,
      newValue: order.feeAmount,
      reason: 'Total amount was less than fee amount',
    });
  }

  // Check tech fee >= 0
  if (order.techFee < 0) {
    autoFixes.push({
      field: 'tech_fee',
      oldValue: order.techFee,
      newValue: 0,
      reason: 'Tech fee cannot be negative',
    });
  }

  // Compare against product catalog (if product specified)
  if (order.productId) {
    const supabase = createServiceRoleClient();
    const { data: product } = await supabase
      .from('products')
      .select('price, min_price, max_price')
      .eq('id', order.productId)
      .single();

    if (product) {
      if (product.min_price && order.feeAmount < product.min_price) {
        exceptions.push({
          type: 'pricing',
          severity: 'warning',
          message: `Fee amount below minimum price for product`,
          details: {
            feeAmount: order.feeAmount,
            minPrice: product.min_price,
            productId: order.productId,
          },
        });
      }
      if (product.max_price && order.feeAmount > product.max_price) {
        exceptions.push({
          type: 'pricing',
          severity: 'warning',
          message: `Fee amount above maximum price for product`,
          details: {
            feeAmount: order.feeAmount,
            maxPrice: product.max_price,
            productId: order.productId,
          },
        });
      }
    }
  }

  return { isValid, autoFixes, exceptions };
}

// ============================================================================
// Credit Validation (for bill orders)
// ============================================================================

async function validateCredit(order: OrderData): Promise<{
  isValid: boolean;
  autoFixes: AutoFix[];
  exceptions: OrderException[];
}> {
  const exceptions: OrderException[] = [];
  let isValid = true;

  // Only validate credit for "bill" payment method
  if (order.paymentMethod !== 'bill') {
    return { isValid: true, autoFixes: [], exceptions: [] };
  }

  const supabase = createServiceRoleClient();

  // Get client info
  const { data: client } = await supabase
    .from('clients')
    .select('is_active, credit_limit, balance')
    .eq('id', order.clientId)
    .single();

  if (!client) {
    exceptions.push({
      type: 'credit',
      severity: 'error',
      message: 'Client not found for credit check',
      details: { clientId: order.clientId },
    });
    return { isValid: false, autoFixes: [], exceptions };
  }

  // Check client is active
  if (!client.is_active) {
    exceptions.push({
      type: 'credit',
      severity: 'critical',
      message: 'Client account is not active',
      details: { clientId: order.clientId },
    });
    isValid = false;
  }

  // Check credit limit
  const creditLimit = client.credit_limit || 0;
  const currentBalance = client.balance || 0;
  const availableCredit = creditLimit - currentBalance;

  if (order.totalAmount > availableCredit) {
    exceptions.push({
      type: 'credit',
      severity: 'error',
      message: 'Order exceeds available credit',
      details: {
        orderAmount: order.totalAmount,
        availableCredit,
        creditLimit,
        currentBalance,
      },
    });
    isValid = false;
  }

  // Warning if using > 80% of available credit
  if (creditLimit > 0 && (currentBalance + order.totalAmount) / creditLimit > 0.8) {
    exceptions.push({
      type: 'credit',
      severity: 'warning',
      message: 'Order will use > 80% of credit limit',
      details: {
        utilizationAfterOrder: ((currentBalance + order.totalAmount) / creditLimit * 100).toFixed(1) + '%',
      },
    });
  }

  return { isValid, autoFixes: [], exceptions };
}

// ============================================================================
// Requirements Validation
// ============================================================================

function validateRequirements(order: OrderData): {
  isValid: boolean;
  autoFixes: AutoFix[];
  exceptions: OrderException[];
} {
  const exceptions: OrderException[] = [];
  let isValid = true;

  // Property address required
  if (!order.propertyAddress) {
    exceptions.push({
      type: 'requirements',
      severity: 'error',
      message: 'Property address is required',
    });
    isValid = false;
  }

  // City/State/Zip for property
  if (!order.propertyCity || !order.propertyState || !order.propertyZip) {
    exceptions.push({
      type: 'requirements',
      severity: 'warning',
      message: 'Property city, state, or zip is missing',
      details: {
        city: order.propertyCity,
        state: order.propertyState,
        zip: order.propertyZip,
      },
    });
  }

  // Borrower contact info (at least name + one contact method)
  if (!order.borrowerName) {
    exceptions.push({
      type: 'requirements',
      severity: 'warning',
      message: 'Borrower name is missing',
    });
  }

  if (!order.borrowerEmail && !order.borrowerPhone) {
    exceptions.push({
      type: 'requirements',
      severity: 'error',
      message: 'Borrower contact info required (email or phone)',
    });
    isValid = false;
  }

  // Property contact for inspections (at least phone)
  if (!order.propertyContactPhone) {
    exceptions.push({
      type: 'requirements',
      severity: 'warning',
      message: 'Property contact phone is missing (needed for inspection scheduling)',
    });
  }

  return { isValid, autoFixes: [], exceptions };
}

// ============================================================================
// Auto-Fix Application
// ============================================================================

async function applyAutoFixes(orderId: string, fixes: AutoFix[]): Promise<void> {
  if (fixes.length === 0) return;

  const supabase = createServiceRoleClient();

  const updateData: Record<string, unknown> = {};
  for (const fix of fixes) {
    updateData[fix.field] = fix.newValue;
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (error) {
    console.error('[OrderProcessor] Failed to apply auto-fixes:', error);
  } else {
    console.log(`[OrderProcessor] Applied ${fixes.length} auto-fixes to order ${orderId}`);
  }
}

// ============================================================================
// Exception Storage
// ============================================================================

async function storeExceptions(
  orderId: string,
  tenantId: string,
  exceptions: OrderException[]
): Promise<void> {
  const supabase = createServiceRoleClient();

  // Get queue ID
  const { data: queueItem } = await supabase
    .from('order_processing_queue')
    .select('id')
    .eq('order_id', orderId)
    .single();

  for (const exception of exceptions) {
    await supabase.from('order_processing_exceptions').insert({
      tenant_id: tenantId,
      order_id: orderId,
      queue_id: queueItem?.id,
      exception_type: exception.type,
      severity: exception.severity,
      message: exception.message,
      details: exception.details,
    });
  }
}

// ============================================================================
// Exception Resolution
// ============================================================================

/**
 * Get unresolved exceptions for tenant
 */
export async function getUnresolvedExceptions(
  tenantId: string,
  limit: number = 50
): Promise<Array<{
  id: string;
  orderId: string;
  exceptionType: string;
  severity: string;
  message: string;
  details: Record<string, unknown>;
  createdAt: Date;
}>> {
  const supabase = createServiceRoleClient();

  const { data } = await supabase
    .from('order_processing_exceptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).map((e) => ({
    id: e.id,
    orderId: e.order_id,
    exceptionType: e.exception_type,
    severity: e.severity,
    message: e.message,
    details: e.details || {},
    createdAt: new Date(e.created_at),
  }));
}

/**
 * Resolve an exception
 */
export async function resolveException(
  exceptionId: string,
  resolvedBy: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('order_processing_exceptions')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
    })
    .eq('id', exceptionId);

  return !error;
}
