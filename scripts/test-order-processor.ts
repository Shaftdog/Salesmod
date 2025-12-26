/**
 * Test Order Processing Validation
 * Tests pricing validation, credit checks, and requirement validation
 */

import { createClient } from '@supabase/supabase-js';
import { processNewOrder, type OrderProcessingResult } from '../src/lib/agent/order-processor';

// Environment setup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface TestResult {
  testName: string;
  passed: boolean;
  details: any;
  error?: string;
}

async function runTests() {
  console.log('========================================');
  console.log('Order Processing Validation Tests');
  console.log('========================================\n');

  const results: TestResult[] = [];

  // Get a tenant ID and sample order
  const { tenantId, orderId } = await getSampleOrder();

  if (!tenantId || !orderId) {
    console.error('❌ Could not find sample order for testing');
    process.exit(1);
  }

  console.log(`Testing with tenant: ${tenantId}`);
  console.log(`Testing with order: ${orderId}\n`);

  // Test 1: Basic Order Processing
  console.log('Test 1: Basic Order Processing');
  console.log('-----------------------------------');
  try {
    const result = await processNewOrder(tenantId, orderId);
    const passed = result !== null;

    results.push({
      testName: 'Basic Order Processing',
      passed,
      details: {
        orderId: result.orderId,
        status: result.status,
        success: result.success,
        message: result.message,
      },
    });

    console.log(`✓ Order processed: ${result.message}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Success: ${result.success}`);
  } catch (error: any) {
    results.push({
      testName: 'Basic Order Processing',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Test 2: Pricing Validation
  console.log('Test 2: Pricing Validation');
  console.log('-----------------------------------');
  try {
    const result = await processNewOrder(tenantId, orderId);
    const passed = typeof result.pricingValid === 'boolean';

    results.push({
      testName: 'Pricing Validation',
      passed,
      details: {
        pricingValid: result.pricingValid,
        pricingErrors: result.exceptions.filter(e => e.type === 'pricing_error'),
        autoFixAttempted: result.autoFixAttempted,
        autoFixSuccessful: result.autoFixSuccessful,
      },
    });

    console.log(`✓ Pricing validation: ${result.pricingValid ? 'VALID' : 'INVALID'}`);

    const pricingErrors = result.exceptions.filter(e => e.type === 'pricing_error');
    if (pricingErrors.length > 0) {
      console.log(`  Pricing errors found: ${pricingErrors.length}`);
      pricingErrors.forEach(err => {
        console.log(`    - ${err.message}`);
      });
    }

    if (result.autoFixAttempted) {
      console.log(`  Auto-fix attempted: ${result.autoFixSuccessful ? 'SUCCESS' : 'FAILED'}`);
    }
  } catch (error: any) {
    results.push({
      testName: 'Pricing Validation',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Test 3: Credit Approval Check
  console.log('Test 3: Credit Approval Check');
  console.log('-----------------------------------');
  try {
    const result = await processNewOrder(tenantId, orderId);
    const passed = typeof result.creditApproved === 'boolean';

    results.push({
      testName: 'Credit Approval Check',
      passed,
      details: {
        creditApproved: result.creditApproved,
        creditHolds: result.exceptions.filter(e => e.type === 'credit_hold'),
      },
    });

    console.log(`✓ Credit check: ${result.creditApproved ? 'APPROVED' : 'HOLD/DENIED'}`);

    const creditHolds = result.exceptions.filter(e => e.type === 'credit_hold');
    if (creditHolds.length > 0) {
      console.log(`  Credit holds found: ${creditHolds.length}`);
      creditHolds.forEach(hold => {
        console.log(`    - ${hold.message}`);
      });
    }
  } catch (error: any) {
    results.push({
      testName: 'Credit Approval Check',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Test 4: Requirements Validation
  console.log('Test 4: Requirements Validation');
  console.log('-----------------------------------');
  try {
    const result = await processNewOrder(tenantId, orderId);
    const passed = typeof result.requirementsMet === 'boolean';

    results.push({
      testName: 'Requirements Validation',
      passed,
      details: {
        requirementsMet: result.requirementsMet,
        missingRequirements: result.exceptions.filter(e => e.type === 'missing_requirements'),
      },
    });

    console.log(`✓ Requirements check: ${result.requirementsMet ? 'COMPLETE' : 'INCOMPLETE'}`);

    const missingReqs = result.exceptions.filter(e => e.type === 'missing_requirements');
    if (missingReqs.length > 0) {
      console.log(`  Missing requirements: ${missingReqs.length}`);
      missingReqs.forEach(req => {
        console.log(`    - [${req.severity}] ${req.message}`);
      });
    }
  } catch (error: any) {
    results.push({
      testName: 'Requirements Validation',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Test 5: Exception Handling
  console.log('Test 5: Exception Handling');
  console.log('-----------------------------------');
  try {
    const result = await processNewOrder(tenantId, orderId);
    const passed = Array.isArray(result.exceptions);

    results.push({
      testName: 'Exception Handling',
      passed,
      details: {
        totalExceptions: result.exceptions.length,
        exceptionsBySeverity: {
          critical: result.exceptions.filter(e => e.severity === 'critical').length,
          error: result.exceptions.filter(e => e.severity === 'error').length,
          warning: result.exceptions.filter(e => e.severity === 'warning').length,
        },
        exceptionsByType: {
          pricing_error: result.exceptions.filter(e => e.type === 'pricing_error').length,
          credit_hold: result.exceptions.filter(e => e.type === 'credit_hold').length,
          missing_requirements: result.exceptions.filter(e => e.type === 'missing_requirements').length,
          validation_error: result.exceptions.filter(e => e.type === 'validation_error').length,
          system_error: result.exceptions.filter(e => e.type === 'system_error').length,
        },
      },
    });

    console.log(`✓ Total exceptions: ${result.exceptions.length}`);
    console.log(`  Critical: ${result.exceptions.filter(e => e.severity === 'critical').length}`);
    console.log(`  Errors: ${result.exceptions.filter(e => e.severity === 'error').length}`);
    console.log(`  Warnings: ${result.exceptions.filter(e => e.severity === 'warning').length}`);
  } catch (error: any) {
    results.push({
      testName: 'Exception Handling',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Test 6: Test Pricing Rules (fee > 0, total >= fee)
  console.log('Test 6: Pricing Rules Validation');
  console.log('-----------------------------------');
  try {
    // Get the order details to check pricing
    const { data: order } = await supabase
      .from('orders')
      .select('fee_amount, total_amount, tech_fee')
      .eq('id', orderId)
      .single();

    if (order) {
      const feeAmount = parseFloat(order.fee_amount || 0);
      const totalAmount = parseFloat(order.total_amount || 0);
      const techFee = parseFloat(order.tech_fee || 0);

      const feePositive = feeAmount > 0;
      const totalValid = totalAmount >= feeAmount;
      const techFeeValid = techFee >= 0;

      const passed = feePositive && totalValid && techFeeValid;

      results.push({
        testName: 'Pricing Rules Validation',
        passed,
        details: {
          feeAmount,
          totalAmount,
          techFee,
          rules: {
            feePositive,
            totalValid,
            techFeeValid,
          },
        },
      });

      console.log(`  Fee amount: $${feeAmount.toFixed(2)} ${feePositive ? '✓' : '✗'} (must be > 0)`);
      console.log(`  Total amount: $${totalAmount.toFixed(2)} ${totalValid ? '✓' : '✗'} (must be >= fee)`);
      console.log(`  Tech fee: $${techFee.toFixed(2)} ${techFeeValid ? '✓' : '✗'} (must be >= 0)`);
    }
  } catch (error: any) {
    results.push({
      testName: 'Pricing Rules Validation',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Test 7: Database Record Creation
  console.log('Test 7: Database Record Creation');
  console.log('-----------------------------------');
  try {
    const result = await processNewOrder(tenantId, orderId);

    // Check if queue record was created
    const { data: queueRecord } = await supabase
      .from('order_processing_queue')
      .select('*')
      .eq('order_id', orderId)
      .eq('tenant_id', tenantId)
      .single();

    const passed = queueRecord !== null;

    results.push({
      testName: 'Database Record Creation',
      passed,
      details: {
        queueRecordCreated: !!queueRecord,
        queueStatus: queueRecord?.status,
        processedAt: queueRecord?.processed_at,
        processedBy: queueRecord?.processed_by,
      },
    });

    console.log(`✓ Queue record created: ${passed ? 'YES' : 'NO'}`);
    if (queueRecord) {
      console.log(`  Status: ${queueRecord.status}`);
      console.log(`  Processed by: ${queueRecord.processed_by || 'N/A'}`);
    }
  } catch (error: any) {
    results.push({
      testName: 'Database Record Creation',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Print Summary
  console.log('========================================');
  console.log('Test Summary');
  console.log('========================================\n');

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Pass Rate: ${passRate}%\n`);

  results.forEach(result => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${result.testName}`);
    if (!result.passed && result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  console.log('');

  // Return exit code based on results
  process.exit(passedTests === totalTests ? 0 : 1);
}

async function getSampleOrder(): Promise<{ tenantId: string; orderId: string }> {
  // Get a sample order from the database - prefer DELIVERED orders as they have complete data
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, tenant_id, order_number, status, property_address, fee_amount, total_amount')
    .eq('status', 'DELIVERED')
    .not('property_address', 'is', null)
    .gt('fee_amount', 0)
    .limit(1)
    .maybeSingle();

  if (error || !order) {
    console.log('No DELIVERED orders found, trying any order...');

    const { data: anyOrder, error: anyError } = await supabase
      .from('orders')
      .select('id, tenant_id, order_number, status, property_address, fee_amount, total_amount')
      .not('property_address', 'is', null)
      .limit(1)
      .maybeSingle();

    if (anyError || !anyOrder) {
      return { tenantId: '', orderId: '' };
    }

    return { tenantId: anyOrder.tenant_id, orderId: anyOrder.id };
  }

  return { tenantId: order.tenant_id, orderId: order.id };
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
