/**
 * Production Dashboard Drill-Down API
 * GET /api/production/dashboard-metrics/drill-down?type={metricType}
 *
 * Returns detailed orders/cases for a specific metric type
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Type definitions
type DrillDownType =
  | 'filesDueToClient'
  | 'allDue'
  | 'filesOverdue'
  | 'productionDue'
  | 'filesInReview'
  | 'filesNotInReview'
  | 'filesWithIssues'
  | 'filesWithCorrection'
  | 'correctionReview'
  | 'casesInProgress'
  | 'casesImpeded'
  | 'casesInReview'
  | 'casesDelivered'
  | 'readyForDelivery'
  | 'ordersDeliveredToday'
  | 'valueDeliveredToday'
  | 'deliveredPast7Days'
  | 'valueDeliveredPast7Days'
  | 'avgTurnTime1Week'
  | 'avgTurnTime30Days';

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  client_name: string;
  property_address: string;
  due_date: string | null;
  delivered_date: string | null;
  fee_amount: number | null;
  current_stage: string | null;
  created_at: string;
}

interface CaseDetail {
  id: string;
  case_number: string;
  status: string;
  client_name: string;
  order_number: string | null;
  created_at: string;
}

// Helper to enrich orders with client/property names
// Note: Using separate queries instead of Supabase joins due to RLS compatibility
async function enrichOrdersWithDetails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orders: any[]
): Promise<OrderDetail[]> {
  if (orders.length === 0) return [];

  // Batch fetch all unique client IDs
  const clientIds = [...new Set(orders.map(o => o.client_id).filter(Boolean))];
  const propertyIds = [...new Set(orders.map(o => o.property_id).filter(Boolean))];

  const [clientsResult, propertiesResult] = await Promise.all([
    clientIds.length > 0
      ? supabase.from('clients').select('id, company_name').in('id', clientIds)
      : Promise.resolve({ data: [] }),
    propertyIds.length > 0
      ? supabase.from('properties').select('id, street_address, city, state').in('id', propertyIds)
      : Promise.resolve({ data: [] }),
  ]);

  const clientsMap = new Map((clientsResult.data || []).map(c => [c.id, c.company_name]));
  const propertiesMap = new Map(
    (propertiesResult.data || []).map(p => [
      p.id,
      `${p.street_address}, ${p.city}, ${p.state}`,
    ])
  );

  return orders.map(o => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    client_name: clientsMap.get(o.client_id) || 'Unknown',
    property_address: propertiesMap.get(o.property_id) || 'Unknown',
    due_date: o.due_date,
    delivered_date: o.delivered_date,
    fee_amount: o.fee_amount,
    current_stage: o.current_stage || null,
    created_at: o.created_at,
  }));
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

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User has no tenant_id assigned' }, { status: 403 });
    }

    const tenantId = profile.tenant_id;
    console.log('Drill-down API - User:', user.id, 'Tenant:', tenantId);

    // Get the metric type from query params
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as DrillDownType | null;

    if (!type) {
      return NextResponse.json({ error: 'Missing type parameter' }, { status: 400 });
    }

    // Date calculations - MUST match main dashboard-metrics route exactly
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    let orders: OrderDetail[] = [];
    let cases: CaseDetail[] = [];

    // Query based on type
    switch (type) {
      case 'filesDueToClient':
      case 'allDue': {
        const { data } = await supabase
          .from('orders')
          .select('id, order_number, status, due_date, delivered_date, fee_amount, created_at, client_id, property_id')
          .eq('tenant_id', tenantId)
          .not('status', 'in', '(DELIVERED,cancelled)')
          .not('due_date', 'is', null)
          .lte('due_date', new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('due_date', { ascending: true })
          .limit(100);

        orders = await enrichOrdersWithDetails(supabase, data || []);
        break;
      }

      case 'filesOverdue': {
        const { data } = await supabase
          .from('orders')
          .select('id, order_number, status, due_date, delivered_date, fee_amount, created_at, client_id, property_id')
          .eq('tenant_id', tenantId)
          .not('status', 'in', '(DELIVERED,cancelled)')
          .lt('due_date', todayStr)
          .order('due_date', { ascending: true })
          .limit(100);

        orders = await enrichOrdersWithDetails(supabase, data || []);
        break;
      }

      case 'productionDue': {
        // Get production cards
        const { data: cards } = await supabase
          .from('production_cards')
          .select('id, current_stage, created_at, order_id')
          .eq('tenant_id', tenantId)
          .not('current_stage', 'in', '("DELIVERED","CANCELLED")')
          .order('created_at', { ascending: false })
          .limit(100);

        if (cards && cards.length > 0) {
          // Get related orders
          const orderIds = cards.map(c => c.order_id).filter(Boolean);
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id, order_number, status, due_date, fee_amount, created_at, client_id, property_id')
            .in('id', orderIds);

          const ordersMap = new Map((ordersData || []).map(o => [o.id, o]));
          const enrichedOrders = await enrichOrdersWithDetails(supabase, ordersData || []);
          const enrichedMap = new Map(enrichedOrders.map(o => [o.id, o]));

          orders = cards
            .filter(c => c.order_id && enrichedMap.has(c.order_id))
            .map(c => {
              const order = enrichedMap.get(c.order_id)!;
              return {
                ...order,
                current_stage: c.current_stage,
                created_at: c.created_at,
              };
            });
        }
        break;
      }

      case 'filesInReview':
      case 'filesNotInReview': {
        const isInReview = type === 'filesInReview';
        const stages = isInReview
          ? ['FINALIZATION', 'READY_FOR_DELIVERY']
          : ['INTAKE', 'SCHEDULING', 'SCHEDULED', 'INSPECTED'];

        const { data: cards } = await supabase
          .from('production_cards')
          .select('id, current_stage, created_at, order_id')
          .eq('tenant_id', tenantId)
          .in('current_stage', stages)
          .order('created_at', { ascending: false })
          .limit(100);

        if (cards && cards.length > 0) {
          const orderIds = cards.map(c => c.order_id).filter(Boolean);
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id, order_number, status, due_date, fee_amount, created_at, client_id, property_id')
            .in('id', orderIds);

          const enrichedOrders = await enrichOrdersWithDetails(supabase, ordersData || []);
          const enrichedMap = new Map(enrichedOrders.map(o => [o.id, o]));

          orders = cards
            .filter(c => c.order_id && enrichedMap.has(c.order_id))
            .map(c => {
              const order = enrichedMap.get(c.order_id)!;
              return {
                ...order,
                current_stage: c.current_stage,
                created_at: c.created_at,
              };
            });
        }
        break;
      }

      case 'filesWithIssues':
      case 'filesWithCorrection':
      case 'correctionReview': {
        const { data: cards } = await supabase
          .from('production_cards')
          .select('id, current_stage, created_at, order_id')
          .eq('tenant_id', tenantId)
          .in('current_stage', ['CORRECTION', 'REVISION'])
          .order('created_at', { ascending: false })
          .limit(100);

        if (cards && cards.length > 0) {
          const orderIds = cards.map(c => c.order_id).filter(Boolean);
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id, order_number, status, due_date, fee_amount, created_at, client_id, property_id')
            .in('id', orderIds);

          const enrichedOrders = await enrichOrdersWithDetails(supabase, ordersData || []);
          const enrichedMap = new Map(enrichedOrders.map(o => [o.id, o]));

          orders = cards
            .filter(c => c.order_id && enrichedMap.has(c.order_id))
            .map(c => {
              const order = enrichedMap.get(c.order_id)!;
              return {
                ...order,
                current_stage: c.current_stage,
                created_at: c.created_at,
              };
            });
        }
        break;
      }

      case 'casesInProgress':
      case 'casesImpeded':
      case 'casesInReview':
      case 'casesDelivered': {
        const statusMap: Record<string, string[]> = {
          casesInProgress: ['in_progress', 'active'],
          casesImpeded: ['impeded', 'blocked', 'on_hold'],
          casesInReview: ['pending', 'in_review'],
          casesDelivered: ['completed', 'delivered', 'resolved'],
        };

        const statuses = statusMap[type] || ['pending'];

        const { data: casesData } = await supabase
          .from('cases')
          .select('id, case_number, status, created_at, client_id, production_card_id')
          .eq('tenant_id', tenantId)
          .in('status', statuses)
          .order('created_at', { ascending: false })
          .limit(100);

        if (casesData && casesData.length > 0) {
          // Fetch client names
          const clientIds = [...new Set(casesData.map(c => c.client_id).filter(Boolean))];
          const { data: clients } = clientIds.length > 0
            ? await supabase.from('clients').select('id, company_name').in('id', clientIds)
            : { data: [] };
          const clientsMap = new Map((clients || []).map(c => [c.id, c.company_name]));

          // Fetch production cards and their orders for order_number
          const cardIds = [...new Set(casesData.map(c => c.production_card_id).filter(Boolean))];
          let orderNumbersMap = new Map<string, string>();
          if (cardIds.length > 0) {
            const { data: cards } = await supabase
              .from('production_cards')
              .select('id, order_id')
              .in('id', cardIds);

            const orderIds = (cards || []).map(c => c.order_id).filter(Boolean);
            if (orderIds.length > 0) {
              const { data: ordersForCards } = await supabase
                .from('orders')
                .select('id, order_number')
                .in('id', orderIds);
              const ordersMap = new Map((ordersForCards || []).map(o => [o.id, o.order_number]));
              (cards || []).forEach(c => {
                if (c.order_id && ordersMap.has(c.order_id)) {
                  orderNumbersMap.set(c.id, ordersMap.get(c.order_id)!);
                }
              });
            }
          }

          cases = casesData.map((c: any) => ({
            id: c.id,
            case_number: c.case_number || `CASE-${c.id.substring(0, 8)}`,
            status: c.status,
            client_name: clientsMap.get(c.client_id) || 'Unknown',
            order_number: c.production_card_id ? orderNumbersMap.get(c.production_card_id) || null : null,
            created_at: c.created_at,
          }));
        }
        break;
      }

      case 'readyForDelivery': {
        const { data: cards } = await supabase
          .from('production_cards')
          .select('id, current_stage, created_at, order_id')
          .eq('tenant_id', tenantId)
          .eq('current_stage', 'READY_FOR_DELIVERY')
          .order('created_at', { ascending: false })
          .limit(100);

        if (cards && cards.length > 0) {
          const orderIds = cards.map(c => c.order_id).filter(Boolean);
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id, order_number, status, due_date, fee_amount, created_at, client_id, property_id')
            .in('id', orderIds);

          const enrichedOrders = await enrichOrdersWithDetails(supabase, ordersData || []);
          const enrichedMap = new Map(enrichedOrders.map(o => [o.id, o]));

          orders = cards
            .filter(c => c.order_id && enrichedMap.has(c.order_id))
            .map(c => {
              const order = enrichedMap.get(c.order_id)!;
              return {
                ...order,
                current_stage: c.current_stage,
                created_at: c.created_at,
              };
            });
        }
        break;
      }

      case 'ordersDeliveredToday':
      case 'valueDeliveredToday': {
        const { data } = await supabase
          .from('orders')
          .select('id, order_number, status, due_date, delivered_date, fee_amount, created_at, client_id, property_id')
          .eq('tenant_id', tenantId)
          .eq('status', 'DELIVERED')
          .gte('delivered_date', todayStr)
          .order('delivered_date', { ascending: false })
          .limit(100);

        const enriched = await enrichOrdersWithDetails(supabase, data || []);
        orders = enriched.map(o => ({ ...o, current_stage: 'DELIVERED' }));
        break;
      }

      case 'deliveredPast7Days':
      case 'valueDeliveredPast7Days': {
        const { data } = await supabase
          .from('orders')
          .select('id, order_number, status, due_date, delivered_date, fee_amount, created_at, client_id, property_id')
          .eq('tenant_id', tenantId)
          .eq('status', 'DELIVERED')
          .gte('delivered_date', sevenDaysAgoStr)
          .order('delivered_date', { ascending: false })
          .limit(100);

        const enriched = await enrichOrdersWithDetails(supabase, data || []);
        orders = enriched.map(o => ({ ...o, current_stage: 'DELIVERED' }));
        break;
      }

      case 'avgTurnTime1Week':
      case 'avgTurnTime30Days': {
        const dateLimitStr = type === 'avgTurnTime1Week' ? sevenDaysAgoStr : thirtyDaysAgoStr;

        const { data } = await supabase
          .from('orders')
          .select('id, order_number, status, due_date, delivered_date, fee_amount, created_at, client_id, property_id')
          .eq('tenant_id', tenantId)
          .eq('status', 'DELIVERED')
          .gte('delivered_date', dateLimitStr)
          .order('delivered_date', { ascending: false })
          .limit(100);

        const enriched = await enrichOrdersWithDetails(supabase, data || []);
        orders = enriched.map(o => ({ ...o, current_stage: 'DELIVERED' }));
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    return NextResponse.json({
      orders,
      cases,
      totalValue: orders.reduce((sum, o) => sum + (o.fee_amount || 0), 0),
    });
  } catch (error) {
    console.error('Production drill-down API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
