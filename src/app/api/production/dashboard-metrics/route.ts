/**
 * Production Dashboard Metrics API Route
 * GET /api/production/dashboard-metrics - Fetch all production dashboard metrics
 */

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export interface ProductionMetrics {
  // Files metrics
  filesDueToClient: number;
  allDue: number;
  filesOverdue: number;
  productionDue: number;
  filesInReview: number;
  filesNotInReview: number;
  filesWithIssues: number;
  filesWithCorrection: number;
  correctionReview: number;

  // Cases metrics
  casesInProgress: number;
  casesImpeded: number;
  casesInReview: number;
  casesDelivered: number;

  // Delivery metrics
  readyForDelivery: number;
  ordersDeliveredToday: number;
  valueDeliveredToday: number;
  deliveredPast7Days: number;
  valueDeliveredPast7Days: number;
  deliveredPast30Days: number;
  valueDeliveredPast30Days: number;

  // Turn time metrics (production card created_at to completed_at)
  avgTurnTime7Days: { weeks: number; days: number; hours: number } | null;
  avgTurnTime30Days: { weeks: number; days: number; hours: number } | null;
}

function formatDuration(minutes: number): { weeks: number; days: number; hours: number } {
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  return {
    weeks,
    days: days % 7,
    hours: hours % 24,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for queries to bypass RLS
    // RLS was causing issues with delivered orders not showing up
    const supabase = createServiceRoleClient();

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User has no tenant_id assigned' }, { status: 403 });
    }

    const tenantId = profile.tenant_id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Excluded statuses for active work metrics
    // Note: Include both cases to handle any data inconsistencies
    const excludedOrderStatuses = '(DELIVERED,REVISION,on_hold,ON_HOLD,WORKFILE,cancelled,CANCELLED)';
    const excludedCardStages = '(DELIVERED,REVISION,ON_HOLD,WORKFILE,CANCELLED)';

    // Run all queries in parallel for better performance
    const [
      // Files Due to Client - Orders with due_date <= today (includes overdue)
      filesDueToClientResult,

      // All Due - Orders + Production cards with due_date = today
      allDueOrdersResult,
      allDueCardsResult,

      // Files Overdue - Orders past due date and not completed
      filesOverdueResult,

      // Production Due - Production cards due today
      productionDueResult,

      // Files in Review - Orders in CORRECTION or REVISION stage
      filesInReviewResult,

      // Files Not in Review - Active orders NOT in review stages
      filesNotInReviewResult,

      // Files with Issues - Orders with pending/in_progress corrections
      filesWithIssuesResult,

      // Files with Correction - Orders with correction_requests of type 'correction'
      filesWithCorrectionResult,

      // Correction Review - Corrections in review status
      correctionReviewResult,

      // Cases metrics
      casesInProgressResult,
      casesImpededResult,
      casesInReviewResult,
      casesDeliveredResult,

      // Ready for Delivery - Orders with status READY_FOR_DELIVERY
      readyForDeliveryResult,

      // Orders delivered today
      ordersDeliveredTodayResult,

      // Value delivered today
      valueDeliveredTodayResult,

      // Production cards delivered past 7 days
      deliveredPast7DaysResult,

      // Value delivered past 7 days (from production cards)
      valueDeliveredPast7DaysResult,

      // Production cards delivered past 30 days
      deliveredPast30DaysResult,

      // Value delivered past 30 days (from production cards)
      valueDeliveredPast30DaysResult,

      // Average turn time - production cards delivered in last 7 days
      avgTurnTime7DaysResult,

      // Average turn time - production cards delivered in last 30 days
      avgTurnTime30DaysResult,
    ] = await Promise.all([
      // Files Due to Client - Orders with due_date <= today (excludes delivered, revision, on_hold, workfile, cancelled)
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .lte('due_date', todayStr)
        .not('status', 'in', excludedOrderStatuses),

      // All Due today - Orders (excludes delivered, revision, on_hold, workfile, cancelled)
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('due_date', todayStr)
        .not('status', 'in', excludedOrderStatuses),

      // All Due today - Production Cards (excludes delivered, revision, on_hold, workfile, cancelled)
      supabase
        .from('production_cards')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('due_date', todayStr)
        .is('completed_at', null)
        .not('current_stage', 'in', excludedCardStages),

      // Files Overdue - Orders past due (excludes delivered, revision, on_hold, workfile, cancelled)
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .lt('due_date', todayStr)
        .not('status', 'in', excludedOrderStatuses),

      // Production Due - Production cards with due_date <= today (excludes delivered, revision, on_hold, workfile, cancelled)
      supabase
        .from('production_cards')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .lte('due_date', todayStr)
        .is('completed_at', null)
        .not('current_stage', 'in', excludedCardStages),

      // Files in Review - Production cards in FINALIZATION stage
      supabase
        .from('production_cards')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('current_stage', 'FINALIZATION'),

      // Files Not in Review - Production cards NOT in FINALIZATION, DELIVERED, CANCELLED, ON_HOLD, WORKFILE, REVISION
      supabase
        .from('production_cards')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .not('current_stage', 'in', '(FINALIZATION,DELIVERED,CANCELLED,ON_HOLD,WORKFILE,REVISION)'),

      // Files with Issues - Production cards with parent tasks that have has_issue = true
      // We need to get distinct production_card_ids from tasks where has_issue = true and parent_task_id is null
      supabase
        .from('production_tasks')
        .select('production_card_id, production_card:production_cards!inner(tenant_id)')
        .eq('has_issue', true)
        .is('parent_task_id', null)
        .eq('production_card.tenant_id', tenantId),

      // Files with Correction - Production cards in CORRECTION stage
      supabase
        .from('production_cards')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('current_stage', 'CORRECTION'),

      // Correction Review
      supabase
        .from('correction_requests')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'review'),

      // Cases in Progress - Count active cases (not deliver, completed, resolved, closed)
      supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .not('status', 'in', '(deliver,completed,resolved,closed)'),

      // Cases Impeded - Cases with status 'impeded' or 'blocked' or 'on_hold'
      supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['impeded', 'blocked', 'on_hold']),

      // Cases in Review - Cases with status 'in_review' or 'pending'
      supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['in_review', 'pending']),

      // Cases Delivered - Production cards with cases, moved to DELIVERED today
      // First get orders that have cases, then count production cards for those orders
      (async () => {
        // Get order IDs that have cases
        const { data: casesData } = await supabase
          .from('cases')
          .select('order_id')
          .eq('tenant_id', tenantId)
          .not('order_id', 'is', null);

        const orderIdsWithCases = [...new Set((casesData || []).map(c => c.order_id).filter(Boolean))];

        if (orderIdsWithCases.length === 0) {
          return { count: 0, data: null, error: null };
        }

        return supabase
          .from('production_cards')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('current_stage', 'DELIVERED')
          .gte('completed_at', todayStr)
          .lt('completed_at', new Date(today.getTime() + 86400000).toISOString())
          .in('order_id', orderIdsWithCases);
      })(),

      // Ready for Delivery - Production cards in READY_FOR_DELIVERY stage
      supabase
        .from('production_cards')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('current_stage', 'READY_FOR_DELIVERY'),

      // Orders delivered today - Production cards moved to DELIVERED today
      supabase
        .from('production_cards')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('current_stage', 'DELIVERED')
        .gte('completed_at', todayStr)
        .lt('completed_at', new Date(today.getTime() + 86400000).toISOString()),

      // Value delivered today - Total from orders linked to production cards delivered today
      supabase
        .from('production_cards')
        .select('order:orders(total_amount)')
        .eq('tenant_id', tenantId)
        .eq('current_stage', 'DELIVERED')
        .gte('completed_at', todayStr)
        .lt('completed_at', new Date(today.getTime() + 86400000).toISOString()),

      // Production cards delivered past 7 days
      supabase
        .from('production_cards')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('current_stage', 'DELIVERED')
        .gte('completed_at', sevenDaysAgoStr),

      // Value delivered past 7 days (from production cards)
      supabase
        .from('production_cards')
        .select('order:orders(total_amount)')
        .eq('tenant_id', tenantId)
        .eq('current_stage', 'DELIVERED')
        .gte('completed_at', sevenDaysAgoStr),

      // Production cards delivered past 30 days
      supabase
        .from('production_cards')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('current_stage', 'DELIVERED')
        .gte('completed_at', thirtyDaysAgoStr),

      // Value delivered past 30 days (from production cards)
      supabase
        .from('production_cards')
        .select('order:orders(total_amount)')
        .eq('tenant_id', tenantId)
        .eq('current_stage', 'DELIVERED')
        .gte('completed_at', thirtyDaysAgoStr),

      // Turn time - production cards delivered in last 7 days (created_at to completed_at)
      supabase
        .from('production_cards')
        .select('created_at, completed_at')
        .eq('tenant_id', tenantId)
        .eq('current_stage', 'DELIVERED')
        .gte('completed_at', sevenDaysAgoStr)
        .not('completed_at', 'is', null),

      // Turn time - production cards delivered in last 30 days (created_at to completed_at)
      supabase
        .from('production_cards')
        .select('created_at, completed_at')
        .eq('tenant_id', tenantId)
        .eq('current_stage', 'DELIVERED')
        .gte('completed_at', thirtyDaysAgoStr)
        .not('completed_at', 'is', null),
    ]);

    // Log any query errors (graceful degradation - continue with available data)
    const queryNames = [
      'filesDueToClient', 'allDueOrders', 'allDueCards', 'filesOverdue', 'productionDue',
      'filesInReview', 'filesNotInReview', 'filesWithIssues', 'filesWithCorrection',
      'correctionReview', 'casesInProgress', 'casesImpeded', 'casesInReview',
      'casesDelivered', 'readyForDelivery', 'ordersDeliveredToday',
      'valueDeliveredToday', 'deliveredPast7Days', 'valueDeliveredPast7Days',
      'deliveredPast30Days', 'valueDeliveredPast30Days',
      'avgTurnTime7Days', 'avgTurnTime30Days'
    ];
    const allResults = [
      filesDueToClientResult, allDueOrdersResult, allDueCardsResult, filesOverdueResult, productionDueResult,
      filesInReviewResult, filesNotInReviewResult, filesWithIssuesResult, filesWithCorrectionResult,
      correctionReviewResult, casesInProgressResult, casesImpededResult, casesInReviewResult,
      casesDeliveredResult, readyForDeliveryResult, ordersDeliveredTodayResult,
      valueDeliveredTodayResult, deliveredPast7DaysResult, valueDeliveredPast7DaysResult,
      deliveredPast30DaysResult, valueDeliveredPast30DaysResult,
      avgTurnTime7DaysResult, avgTurnTime30DaysResult
    ];
    allResults.forEach((result, i) => {
      if (result.error) {
        console.warn(`Dashboard metrics query '${queryNames[i]}' failed:`, result.error.message);
      }
    });

    // Cases metrics use direct counts from the cases table
    const casesInProgressCount = casesInProgressResult.count || 0;
    const casesImpededCount = casesImpededResult.count || 0;
    const casesInReviewCount = casesInReviewResult.count || 0;

    // Calculate value delivered today from production cards
    const valueDeliveredToday = (valueDeliveredTodayResult.data || [])
      .reduce((sum, card: { order: { total_amount: string | null } | null }) => {
        const amount = card.order?.total_amount;
        return sum + (amount ? parseFloat(amount) : 0);
      }, 0);

    // Calculate value delivered past 7 days (from production cards with joined orders)
    const valueDeliveredPast7Days = (valueDeliveredPast7DaysResult.data || [])
      .reduce((sum, card: { order: { total_amount: string | null } | null }) => {
        const amount = card.order?.total_amount;
        return sum + (amount ? parseFloat(amount) : 0);
      }, 0);

    // Calculate value delivered past 30 days (from production cards with joined orders)
    const valueDeliveredPast30Days = (valueDeliveredPast30DaysResult.data || [])
      .reduce((sum, card: { order: { total_amount: string | null } | null }) => {
        const amount = card.order?.total_amount;
        return sum + (amount ? parseFloat(amount) : 0);
      }, 0);

    // Calculate average turn time for 7 days (production card created_at to completed_at)
    let avgTurnTime7Days: { weeks: number; days: number; hours: number } | null = null;
    if (avgTurnTime7DaysResult.data && avgTurnTime7DaysResult.data.length > 0) {
      const totalMinutes = avgTurnTime7DaysResult.data.reduce((sum, card) => {
        const created = new Date(card.created_at);
        const completed = new Date(card.completed_at);
        const diffMinutes = (completed.getTime() - created.getTime()) / (1000 * 60);
        return sum + diffMinutes;
      }, 0);
      const avgMinutes = totalMinutes / avgTurnTime7DaysResult.data.length;
      avgTurnTime7Days = formatDuration(avgMinutes);
    }

    // Calculate average turn time for 30 days (production card created_at to completed_at)
    let avgTurnTime30Days: { weeks: number; days: number; hours: number } | null = null;
    if (avgTurnTime30DaysResult.data && avgTurnTime30DaysResult.data.length > 0) {
      const totalMinutes = avgTurnTime30DaysResult.data.reduce((sum, card) => {
        const created = new Date(card.created_at);
        const completed = new Date(card.completed_at);
        const diffMinutes = (completed.getTime() - created.getTime()) / (1000 * 60);
        return sum + diffMinutes;
      }, 0);
      const avgMinutes = totalMinutes / avgTurnTime30DaysResult.data.length;
      avgTurnTime30Days = formatDuration(avgMinutes);
    }

    // Count distinct production cards with issues
    const filesWithIssuesCount = filesWithIssuesResult.data
      ? new Set(filesWithIssuesResult.data.map((t: { production_card_id: string }) => t.production_card_id)).size
      : 0;

    const metrics: ProductionMetrics = {
      filesDueToClient: filesDueToClientResult.count || 0,
      allDue: (allDueOrdersResult.count || 0) + (allDueCardsResult.count || 0),
      filesOverdue: filesOverdueResult.count || 0,
      productionDue: productionDueResult.count || 0,
      filesInReview: filesInReviewResult.count || 0,
      filesNotInReview: filesNotInReviewResult.count || 0,
      filesWithIssues: filesWithIssuesCount,
      filesWithCorrection: filesWithCorrectionResult.count || 0,
      correctionReview: correctionReviewResult.count || 0,
      casesInProgress: casesInProgressCount,
      casesImpeded: casesImpededCount,
      casesInReview: casesInReviewCount,
      casesDelivered: casesDeliveredResult.count || 0,
      readyForDelivery: readyForDeliveryResult.count || 0,
      ordersDeliveredToday: ordersDeliveredTodayResult.count || 0,
      valueDeliveredToday,
      deliveredPast7Days: deliveredPast7DaysResult.count || 0,
      valueDeliveredPast7Days,
      deliveredPast30Days: deliveredPast30DaysResult.count || 0,
      valueDeliveredPast30Days,
      avgTurnTime7Days,
      avgTurnTime30Days,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error in GET /api/production/dashboard-metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
