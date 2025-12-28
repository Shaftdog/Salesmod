/**
 * Production Dashboard Metrics API Route
 * GET /api/production/dashboard-metrics - Fetch all production dashboard metrics
 */

import { createClient } from '@/lib/supabase/server';
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

  // Turn time metrics
  avgTurnTime1Week: { weeks: number; days: number; hours: number } | null;
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
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Run all queries in parallel for better performance
    const [
      // Files Due to Client - Orders in READY_FOR_DELIVERY stage
      filesDueToClientResult,

      // All Due - Orders with due_date = today
      allDueResult,

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

      // Orders delivered past 7 days
      deliveredPast7DaysResult,

      // Value delivered past 7 days
      valueDeliveredPast7DaysResult,

      // Average turn time calculations - orders delivered in last week
      avgTurnTime1WeekResult,

      // Average turn time calculations - orders delivered in last 30 days
      avgTurnTime30DaysResult,
    ] = await Promise.all([
      // Files Due to Client
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'READY_FOR_DELIVERY'),

      // All Due today
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('due_date', todayStr)
        .not('status', 'in', '(DELIVERED,cancelled)'),

      // Files Overdue
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .lt('due_date', todayStr)
        .not('status', 'in', '(DELIVERED,cancelled)'),

      // Production Due
      supabase
        .from('production_cards')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('due_date', todayStr)
        .is('completed_at', null),

      // Files in Review
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['CORRECTION', 'REVISION']),

      // Files Not in Review
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .not('status', 'in', '(CORRECTION,REVISION,DELIVERED,cancelled)'),

      // Files with Issues (corrections pending or in_progress)
      supabase
        .from('correction_requests')
        .select('production_card_id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'in_progress', 'rejected']),

      // Files with Correction
      supabase
        .from('correction_requests')
        .select('production_card_id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('request_type', 'correction')
        .not('status', 'eq', 'approved'),

      // Correction Review
      supabase
        .from('correction_requests')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'review'),

      // Cases in Progress
      supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'in_progress'),

      // Cases Impeded (open/pending cases)
      supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['open', 'pending']),

      // Cases in Review (we'll use 'pending' as a proxy for review)
      supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'pending'),

      // Cases Delivered (resolved or closed)
      supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['resolved', 'closed']),

      // Ready for Delivery
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'READY_FOR_DELIVERY'),

      // Orders delivered today
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'DELIVERED')
        .gte('delivered_date', todayStr)
        .lt('delivered_date', new Date(today.getTime() + 86400000).toISOString().split('T')[0]),

      // Value delivered today
      supabase
        .from('orders')
        .select('total_amount')
        .eq('tenant_id', tenantId)
        .eq('status', 'DELIVERED')
        .gte('delivered_date', todayStr)
        .lt('delivered_date', new Date(today.getTime() + 86400000).toISOString().split('T')[0]),

      // Orders delivered past 7 days
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'DELIVERED')
        .gte('delivered_date', sevenDaysAgoStr),

      // Value delivered past 7 days
      supabase
        .from('orders')
        .select('total_amount')
        .eq('tenant_id', tenantId)
        .eq('status', 'DELIVERED')
        .gte('delivered_date', sevenDaysAgoStr),

      // Turn time - orders delivered in last 7 days
      supabase
        .from('orders')
        .select('ordered_date, delivered_date')
        .eq('tenant_id', tenantId)
        .eq('status', 'DELIVERED')
        .gte('delivered_date', sevenDaysAgoStr)
        .not('ordered_date', 'is', null)
        .not('delivered_date', 'is', null),

      // Turn time - orders delivered in last 30 days
      supabase
        .from('orders')
        .select('ordered_date, delivered_date')
        .eq('tenant_id', tenantId)
        .eq('status', 'DELIVERED')
        .gte('delivered_date', thirtyDaysAgoStr)
        .not('ordered_date', 'is', null)
        .not('delivered_date', 'is', null),
    ]);

    // Log any query errors (graceful degradation - continue with available data)
    const queryNames = [
      'filesDueToClient', 'allDue', 'filesOverdue', 'productionDue',
      'filesInReview', 'filesNotInReview', 'filesWithIssues', 'filesWithCorrection',
      'correctionReview', 'casesInProgress', 'casesImpeded', 'casesInReview',
      'casesDelivered', 'readyForDelivery', 'ordersDeliveredToday',
      'valueDeliveredToday', 'deliveredPast7Days', 'valueDeliveredPast7Days',
      'avgTurnTime1Week', 'avgTurnTime30Days'
    ];
    const allResults = [
      filesDueToClientResult, allDueResult, filesOverdueResult, productionDueResult,
      filesInReviewResult, filesNotInReviewResult, filesWithIssuesResult, filesWithCorrectionResult,
      correctionReviewResult, casesInProgressResult, casesImpededResult, casesInReviewResult,
      casesDeliveredResult, readyForDeliveryResult, ordersDeliveredTodayResult,
      valueDeliveredTodayResult, deliveredPast7DaysResult, valueDeliveredPast7DaysResult,
      avgTurnTime1WeekResult, avgTurnTime30DaysResult
    ];
    allResults.forEach((result, i) => {
      if (result.error) {
        console.warn(`Dashboard metrics query '${queryNames[i]}' failed:`, result.error.message);
      }
    });

    // Calculate value delivered today
    const valueDeliveredToday = (valueDeliveredTodayResult.data || [])
      .reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);

    // Calculate value delivered past 7 days
    const valueDeliveredPast7Days = (valueDeliveredPast7DaysResult.data || [])
      .reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);

    // Calculate average turn time for 1 week
    let avgTurnTime1Week: { weeks: number; days: number; hours: number } | null = null;
    if (avgTurnTime1WeekResult.data && avgTurnTime1WeekResult.data.length > 0) {
      const totalMinutes = avgTurnTime1WeekResult.data.reduce((sum, order) => {
        const ordered = new Date(order.ordered_date);
        const delivered = new Date(order.delivered_date);
        const diffMinutes = (delivered.getTime() - ordered.getTime()) / (1000 * 60);
        return sum + diffMinutes;
      }, 0);
      const avgMinutes = totalMinutes / avgTurnTime1WeekResult.data.length;
      avgTurnTime1Week = formatDuration(avgMinutes);
    }

    // Calculate average turn time for 30 days
    let avgTurnTime30Days: { weeks: number; days: number; hours: number } | null = null;
    if (avgTurnTime30DaysResult.data && avgTurnTime30DaysResult.data.length > 0) {
      const totalMinutes = avgTurnTime30DaysResult.data.reduce((sum, order) => {
        const ordered = new Date(order.ordered_date);
        const delivered = new Date(order.delivered_date);
        const diffMinutes = (delivered.getTime() - ordered.getTime()) / (1000 * 60);
        return sum + diffMinutes;
      }, 0);
      const avgMinutes = totalMinutes / avgTurnTime30DaysResult.data.length;
      avgTurnTime30Days = formatDuration(avgMinutes);
    }

    const metrics: ProductionMetrics = {
      filesDueToClient: filesDueToClientResult.count || 0,
      allDue: allDueResult.count || 0,
      filesOverdue: filesOverdueResult.count || 0,
      productionDue: productionDueResult.count || 0,
      filesInReview: filesInReviewResult.count || 0,
      filesNotInReview: filesNotInReviewResult.count || 0,
      filesWithIssues: filesWithIssuesResult.count || 0,
      filesWithCorrection: filesWithCorrectionResult.count || 0,
      correctionReview: correctionReviewResult.count || 0,
      casesInProgress: casesInProgressResult.count || 0,
      casesImpeded: casesImpededResult.count || 0,
      casesInReview: casesInReviewResult.count || 0,
      casesDelivered: casesDeliveredResult.count || 0,
      readyForDelivery: readyForDeliveryResult.count || 0,
      ordersDeliveredToday: ordersDeliveredTodayResult.count || 0,
      valueDeliveredToday,
      deliveredPast7Days: deliveredPast7DaysResult.count || 0,
      valueDeliveredPast7Days,
      avgTurnTime1Week,
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
