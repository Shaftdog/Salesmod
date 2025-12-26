/**
 * Test Full Autonomous Cycle
 * Tests the complete Plan → Act → React → Reflect loop
 */

import { createClient } from '@supabase/supabase-js';
import { runAutonomousCycle, type WorkBlock } from '../src/lib/agent/autonomous-cycle';

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
  console.log('Autonomous Cycle Full Test');
  console.log('========================================\n');

  const results: TestResult[] = [];

  // Get a tenant ID
  const tenantId = await getTenantId();

  if (!tenantId) {
    console.error('❌ Could not find tenant for testing');
    process.exit(1);
  }

  console.log(`Testing with tenant: ${tenantId}\n`);

  let workBlock: WorkBlock | null = null;

  // Test 1: Cycle Execution
  console.log('Test 1: Execute Full Autonomous Cycle');
  console.log('-----------------------------------');
  try {
    const startTime = Date.now();
    workBlock = await runAutonomousCycle(tenantId);
    const duration = Date.now() - startTime;

    const passed = workBlock !== null;

    results.push({
      testName: 'Cycle Execution',
      passed,
      details: {
        cycleNumber: workBlock.cycleNumber,
        status: workBlock.status,
        duration: `${duration}ms`,
        startedAt: workBlock.startedAt,
        endedAt: workBlock.endedAt,
      },
    });

    console.log(`✓ Cycle completed: ${workBlock.status}`);
    console.log(`  Cycle number: ${workBlock.cycleNumber}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Status: ${workBlock.status}`);
  } catch (error: any) {
    results.push({
      testName: 'Cycle Execution',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  if (!workBlock) {
    console.error('❌ Cycle execution failed, cannot continue tests');
    printSummary(results);
    process.exit(1);
  }

  // Test 2: Phase Completion
  console.log('Test 2: All 4 Phases Completed');
  console.log('-----------------------------------');
  try {
    const hasPlanned = workBlock.planOutput !== undefined;
    const hasActed = workBlock.actOutput !== undefined;
    const hasReacted = workBlock.reactOutput !== undefined;
    const hasReflected = workBlock.reflectOutput !== undefined;

    const passed = hasPlanned && hasActed && hasReacted && hasReflected;

    results.push({
      testName: 'Phase Completion',
      passed,
      details: {
        planPhase: hasPlanned ? 'COMPLETED' : 'MISSING',
        actPhase: hasActed ? 'COMPLETED' : 'MISSING',
        reactPhase: hasReacted ? 'COMPLETED' : 'MISSING',
        reflectPhase: hasReflected ? 'COMPLETED' : 'MISSING',
      },
    });

    console.log(`  PLAN phase: ${hasPlanned ? '✓' : '✗'}`);
    console.log(`  ACT phase: ${hasActed ? '✓' : '✗'}`);
    console.log(`  REACT phase: ${hasReacted ? '✓' : '✗'}`);
    console.log(`  REFLECT phase: ${hasReflected ? '✓' : '✗'}`);
  } catch (error: any) {
    results.push({
      testName: 'Phase Completion',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Test 3: Work Block Record Created
  console.log('Test 3: Work Block Record Creation');
  console.log('-----------------------------------');
  try {
    const { data: run, error } = await supabase
      .from('agent_autonomous_runs')
      .select('*')
      .eq('id', workBlock.id)
      .single();

    const passed = run !== null && !error;

    results.push({
      testName: 'Work Block Record Creation',
      passed,
      details: {
        recordExists: !!run,
        runId: run?.id,
        status: run?.status,
        cycleNumber: run?.cycle_number,
      },
    });

    console.log(`✓ Work block record: ${passed ? 'EXISTS' : 'MISSING'}`);
    if (run) {
      console.log(`  Run ID: ${run.id}`);
      console.log(`  Status: ${run.status}`);
      console.log(`  Cycle: ${run.cycle_number}`);
    }
  } catch (error: any) {
    results.push({
      testName: 'Work Block Record Creation',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Test 4: Plan Output
  console.log('Test 4: Plan Output Validation');
  console.log('-----------------------------------');
  try {
    const planOutput = workBlock.planOutput;
    const passed = planOutput !== undefined && Array.isArray(planOutput.actionQueue);

    results.push({
      testName: 'Plan Output Validation',
      passed,
      details: {
        actionsPlanned: planOutput?.actionQueue.length || 0,
        goalStatusCount: planOutput?.goalStatus.length || 0,
        engagementViolations: planOutput?.engagementViolations.length || 0,
        contextSnapshot: planOutput?.contextSnapshot,
      },
    });

    if (planOutput) {
      console.log(`✓ Actions planned: ${planOutput.actionQueue.length}`);
      console.log(`  Active goals: ${planOutput.goalStatus.length}`);
      console.log(`  Engagement violations: ${planOutput.engagementViolations.length}`);
      console.log(`  Context snapshot:`);
      console.log(`    - Clients: ${planOutput.contextSnapshot.clientCount}`);
      console.log(`    - Active deals: ${planOutput.contextSnapshot.activeDealsCount}`);
      console.log(`    - Pending orders: ${planOutput.contextSnapshot.pendingOrdersCount}`);
      console.log(`    - Open cases: ${planOutput.contextSnapshot.openCasesCount}`);
    }
  } catch (error: any) {
    results.push({
      testName: 'Plan Output Validation',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Test 5: Act Output
  console.log('Test 5: Act Output Validation');
  console.log('-----------------------------------');
  try {
    const actOutput = workBlock.actOutput;
    const passed = actOutput !== undefined && Array.isArray(actOutput.results);

    results.push({
      testName: 'Act Output Validation',
      passed,
      details: {
        totalResults: actOutput?.results.length || 0,
        systemActionsExecuted: actOutput?.systemActionsExecuted || 0,
        humanActionsCreated: actOutput?.humanActionsCreated || 0,
        blockersEncountered: actOutput?.blockers.length || 0,
        summary: actOutput?.summary,
      },
    });

    if (actOutput) {
      console.log(`✓ Total action results: ${actOutput.results.length}`);
      console.log(`  System actions executed: ${actOutput.systemActionsExecuted}`);
      console.log(`  Human actions created: ${actOutput.humanActionsCreated}`);
      console.log(`  Blockers encountered: ${actOutput.blockers.length}`);
      console.log(`  Summary: ${actOutput.summary}`);

      if (actOutput.blockers.length > 0) {
        console.log(`  Blockers:`);
        actOutput.blockers.forEach(b => {
          console.log(`    - [${b.type}] ${b.reason}`);
        });
      }
    }
  } catch (error: any) {
    results.push({
      testName: 'Act Output Validation',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Test 6: React Output
  console.log('Test 6: React Output Validation');
  console.log('-----------------------------------');
  try {
    const reactOutput = workBlock.reactOutput;
    const passed = reactOutput !== undefined;

    results.push({
      testName: 'React Output Validation',
      passed,
      details: {
        statusUpdates: reactOutput?.statusUpdates.length || 0,
        nextActions: reactOutput?.nextActions.length || 0,
        metricChanges: reactOutput?.metricChanges.length || 0,
      },
    });

    if (reactOutput) {
      console.log(`✓ Status updates: ${reactOutput.statusUpdates.length}`);
      console.log(`  Next actions scheduled: ${reactOutput.nextActions.length}`);
      console.log(`  Metric changes: ${reactOutput.metricChanges.length}`);

      if (reactOutput.metricChanges.length > 0) {
        console.log(`  Metrics changed:`);
        reactOutput.metricChanges.forEach(m => {
          console.log(`    - ${m.metric}: ${m.before} → ${m.after} (${m.delta > 0 ? '+' : ''}${m.delta})`);
        });
      }
    }
  } catch (error: any) {
    results.push({
      testName: 'React Output Validation',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Test 7: Reflect Output
  console.log('Test 7: Reflect Output Validation');
  console.log('-----------------------------------');
  try {
    const reflectOutput = workBlock.reflectOutput;
    const passed = reflectOutput !== undefined && reflectOutput.whatWeDid !== undefined;

    results.push({
      testName: 'Reflect Output Validation',
      passed,
      details: {
        whatWeDid: reflectOutput?.whatWeDid,
        metricsTracked: Object.keys(reflectOutput?.whatMovedMetrics || {}).length,
        blockers: reflectOutput?.whatGotBlocked.length || 0,
        hypotheses: reflectOutput?.hypotheses.length || 0,
        insights: reflectOutput?.insights.length || 0,
      },
    });

    if (reflectOutput) {
      console.log(`✓ Reflection generated`);
      console.log(`  What we did: ${reflectOutput.whatWeDid.substring(0, 100)}...`);
      console.log(`  Metrics tracked: ${Object.keys(reflectOutput.whatMovedMetrics).length}`);
      console.log(`  Blockers recorded: ${reflectOutput.whatGotBlocked.length}`);
      console.log(`  Hypotheses generated: ${reflectOutput.hypotheses.length}`);
      console.log(`  Insights generated: ${reflectOutput.insights.length}`);

      if (reflectOutput.hypotheses.length > 0) {
        console.log(`  Hypotheses:`);
        reflectOutput.hypotheses.forEach(h => {
          console.log(`    - ${h.hypothesis} (confidence: ${(h.confidence * 100).toFixed(0)}%)`);
        });
      }
    }
  } catch (error: any) {
    results.push({
      testName: 'Reflect Output Validation',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Test 8: Metrics Collection
  console.log('Test 8: Cycle Metrics Collection');
  console.log('-----------------------------------');
  try {
    const metrics = workBlock.metrics;
    const passed = metrics !== undefined && metrics.totalDurationMs > 0;

    results.push({
      testName: 'Metrics Collection',
      passed,
      details: metrics,
    });

    console.log(`✓ Metrics collected:`);
    console.log(`  Plan duration: ${metrics.planDurationMs}ms`);
    console.log(`  Act duration: ${metrics.actDurationMs}ms`);
    console.log(`  React duration: ${metrics.reactDurationMs}ms`);
    console.log(`  Reflect duration: ${metrics.reflectDurationMs}ms`);
    console.log(`  Total duration: ${metrics.totalDurationMs}ms`);
    console.log(`  Actions planned: ${metrics.actionsPlanned}`);
    console.log(`  Actions executed: ${metrics.actionsExecuted}`);
    console.log(`  Actions failed: ${metrics.actionsFailed}`);
    console.log(`  Actions blocked: ${metrics.actionsBlocked}`);
    console.log(`  Policy violations: ${metrics.policyViolations}`);
    console.log(`  Engagement touches: ${metrics.engagementTouchesCompleted}`);
  } catch (error: any) {
    results.push({
      testName: 'Metrics Collection',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Test 9: Reflection Record in Database
  console.log('Test 9: Reflection Record in Database');
  console.log('-----------------------------------');
  try {
    const { data: reflection, error } = await supabase
      .from('agent_hourly_reflections')
      .select('*')
      .eq('run_id', workBlock.id)
      .single();

    const passed = reflection !== null && !error;

    results.push({
      testName: 'Reflection Record in Database',
      passed,
      details: {
        recordExists: !!reflection,
        runId: reflection?.run_id,
        cycleHour: reflection?.cycle_hour,
        actionsTaken: reflection?.actions_taken?.length || 0,
      },
    });

    console.log(`✓ Reflection record: ${passed ? 'EXISTS' : 'MISSING'}`);
    if (reflection) {
      console.log(`  Run ID: ${reflection.run_id}`);
      console.log(`  Cycle hour: ${reflection.cycle_hour}`);
      console.log(`  Actions recorded: ${reflection.actions_taken?.length || 0}`);
    }
  } catch (error: any) {
    results.push({
      testName: 'Reflection Record in Database',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Test 10: Action Queue Priority
  console.log('Test 10: Action Queue Prioritization');
  console.log('-----------------------------------');
  try {
    const actionQueue = workBlock.planOutput?.actionQueue || [];
    const priorities = actionQueue.map(a => a.priority);

    // Check if priorities are valid
    const validPriorities = priorities.every(p => ['high', 'medium', 'low'].includes(p));

    // Check if sorted by priority (high > medium > low)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    let isSorted = true;
    for (let i = 0; i < priorities.length - 1; i++) {
      if (priorityOrder[priorities[i] as keyof typeof priorityOrder] < priorityOrder[priorities[i + 1] as keyof typeof priorityOrder]) {
        isSorted = false;
        break;
      }
    }

    const passed = validPriorities && isSorted;

    results.push({
      testName: 'Action Queue Prioritization',
      passed,
      details: {
        totalActions: actionQueue.length,
        highPriority: priorities.filter(p => p === 'high').length,
        mediumPriority: priorities.filter(p => p === 'medium').length,
        lowPriority: priorities.filter(p => p === 'low').length,
        isSorted,
      },
    });

    console.log(`✓ Action priorities:`);
    console.log(`  High: ${priorities.filter(p => p === 'high').length}`);
    console.log(`  Medium: ${priorities.filter(p => p === 'medium').length}`);
    console.log(`  Low: ${priorities.filter(p => p === 'low').length}`);
    console.log(`  Properly sorted: ${isSorted ? 'YES' : 'NO'}`);
  } catch (error: any) {
    results.push({
      testName: 'Action Queue Prioritization',
      passed: false,
      details: null,
      error: error.message,
    });
    console.log(`✗ Error: ${error.message}`);
  }
  console.log('');

  // Print Summary
  printSummary(results);
}

function printSummary(results: TestResult[]) {
  console.log('========================================');
  console.log('Test Summary');
  console.log('========================================\n');

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';

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

async function getTenantId(): Promise<string | null> {
  // Get a tenant ID from the database
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('tenant_id')
    .limit(1)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile.tenant_id;
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
