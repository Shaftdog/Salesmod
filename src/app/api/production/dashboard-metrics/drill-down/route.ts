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
  | 'deliveredPast30Days'
  | 'valueDeliveredPast30Days'
  | 'avgTurnTime7Days'
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
  turn_time_days?: number; // Turn time in days (for delivered items)
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

    // Excluded statuses for active work metrics - MUST match main dashboard-metrics route
    // Note: Include both cases to handle any data inconsistencies
    const excludedOrderStatuses = '(DELIVERED,REVISION,on_hold,ON_HOLD,WORKFILE,cancelled,CANCELLED)';
    const excludedCardStages = '(DELIVERED,REVISION,ON_HOLD,WORKFILE,CANCELLED)';

    let orders: OrderDetail[] = [];
    let cases: CaseDetail[] = [];

    // Query based on type
    switch (type) {
      case 'filesDueToClient': {
        // Orders with due_date <= today (excludes delivered, revision, on_hold, workfile, cancelled)
        const { data } = await supabase
          .from('orders')
          .select('id, order_number, status, due_date, delivered_date, fee_amount, created_at, client_id, property_id')
          .eq('tenant_id', tenantId)
          .not('status', 'in', excludedOrderStatuses)
          .lte('due_date', todayStr)
          .order('due_date', { ascending: true })
          .limit(100);

        orders = await enrichOrdersWithDetails(supabase, data || []);
        break;
      }

      case 'allDue': {
        // Orders + Production cards due today (excludes delivered, revision, on_hold, workfile, cancelled)
        const [ordersResult, cardsResult] = await Promise.all([
          supabase
            .from('orders')
            .select('id, order_number, status, due_date, delivered_date, fee_amount, created_at, client_id, property_id')
            .eq('tenant_id', tenantId)
            .not('status', 'in', excludedOrderStatuses)
            .eq('due_date', todayStr)
            .order('due_date', { ascending: true })
            .limit(100),
          supabase
            .from('production_cards')
            .select('id, current_stage, created_at, due_date, order_id')
            .eq('tenant_id', tenantId)
            .eq('due_date', todayStr)
            .is('completed_at', null)
            .not('current_stage', 'in', excludedCardStages)
            .order('created_at', { ascending: false })
            .limit(100),
        ]);

        // Enrich orders
        const enrichedOrders = await enrichOrdersWithDetails(supabase, ordersResult.data || []);

        // For production cards, get their associated orders
        if (cardsResult.data && cardsResult.data.length > 0) {
          const cardOrderIds = cardsResult.data.map(c => c.order_id).filter(Boolean);
          const { data: cardOrdersData } = cardOrderIds.length > 0
            ? await supabase
                .from('orders')
                .select('id, order_number, status, due_date, fee_amount, created_at, client_id, property_id')
                .in('id', cardOrderIds)
            : { data: [] };

          const cardEnrichedOrders = await enrichOrdersWithDetails(supabase, cardOrdersData || []);
          const cardEnrichedMap = new Map(cardEnrichedOrders.map(o => [o.id, o]));

          // Add production cards with their order info, marking them as production card due
          const cardOrders = cardsResult.data
            .filter(c => c.order_id && cardEnrichedMap.has(c.order_id))
            .map(c => {
              const order = cardEnrichedMap.get(c.order_id)!;
              return {
                ...order,
                current_stage: c.current_stage,
                due_date: c.due_date, // Use card's due date
              };
            });

          // Combine and dedupe (order might appear in both if order and card both due today)
          const seenIds = new Set(enrichedOrders.map(o => o.id));
          orders = [
            ...enrichedOrders,
            ...cardOrders.filter(o => !seenIds.has(o.id)),
          ];
        } else {
          orders = enrichedOrders;
        }
        break;
      }

      case 'filesOverdue': {
        // Orders past due (excludes delivered, revision, on_hold, workfile, cancelled)
        const { data } = await supabase
          .from('orders')
          .select('id, order_number, status, due_date, delivered_date, fee_amount, created_at, client_id, property_id')
          .eq('tenant_id', tenantId)
          .not('status', 'in', excludedOrderStatuses)
          .lt('due_date', todayStr)
          .order('due_date', { ascending: true })
          .limit(100);

        orders = await enrichOrdersWithDetails(supabase, data || []);
        break;
      }

      case 'productionDue': {
        // Get production cards due today or overdue (excludes delivered, revision, on_hold, workfile, cancelled)
        const { data: cards } = await supabase
          .from('production_cards')
          .select('id, current_stage, created_at, due_date, order_id')
          .eq('tenant_id', tenantId)
          .lte('due_date', todayStr)
          .is('completed_at', null)
          .not('current_stage', 'in', excludedCardStages)
          .order('due_date', { ascending: true })
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

      case 'filesInReview': {
        // Production cards in FINALIZATION stage
        const { data: cards } = await supabase
          .from('production_cards')
          .select('id, current_stage, created_at, order_id')
          .eq('tenant_id', tenantId)
          .eq('current_stage', 'FINALIZATION')
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

      case 'filesNotInReview': {
        // Production cards NOT in FINALIZATION, DELIVERED, CANCELLED, ON_HOLD, WORKFILE, REVISION
        const { data: cards } = await supabase
          .from('production_cards')
          .select('id, current_stage, created_at, order_id')
          .eq('tenant_id', tenantId)
          .not('current_stage', 'in', '(FINALIZATION,DELIVERED,CANCELLED,ON_HOLD,WORKFILE,REVISION)')
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

      case 'filesWithIssues': {
        // Production cards with parent tasks that have has_issue = true
        const { data: tasksWithIssues } = await supabase
          .from('production_tasks')
          .select('production_card_id, production_card:production_cards!inner(id, current_stage, created_at, order_id, tenant_id)')
          .eq('has_issue', true)
          .is('parent_task_id', null)
          .eq('production_card.tenant_id', tenantId);

        if (tasksWithIssues && tasksWithIssues.length > 0) {
          // Get unique production cards
          const uniqueCards = new Map<string, any>();
          tasksWithIssues.forEach((t: any) => {
            if (t.production_card && !uniqueCards.has(t.production_card.id)) {
              uniqueCards.set(t.production_card.id, t.production_card);
            }
          });

          const cards = Array.from(uniqueCards.values());
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

      case 'filesWithCorrection': {
        // Production cards in CORRECTION stage
        const { data: cards } = await supabase
          .from('production_cards')
          .select('id, current_stage, created_at, order_id')
          .eq('tenant_id', tenantId)
          .eq('current_stage', 'CORRECTION')
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

      case 'correctionReview': {
        // Keep existing correction_requests logic for this metric
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

      case 'casesInProgress': {
        // Show active cases (not deliver, completed, resolved, closed)
        const { data: casesData } = await supabase
          .from('cases')
          .select(`
            id,
            case_number,
            subject,
            status,
            created_at,
            order_id,
            client:clients(id, company_name),
            order:orders(id, order_number, status, due_date, fee_amount, client_id, property_id)
          `)
          .eq('tenant_id', tenantId)
          .not('status', 'in', '(deliver,completed,resolved,closed)')
          .order('created_at', { ascending: false })
          .limit(100);

        if (casesData && casesData.length > 0) {
          // Get production cards for orders that have cases
          const orderIdsWithCases = [...new Set(casesData.map((c: any) => c.order_id).filter(Boolean))];

          let cardsMap = new Map<string, any>();
          if (orderIdsWithCases.length > 0) {
            const { data: cards } = await supabase
              .from('production_cards')
              .select('id, current_stage, order_id')
              .in('order_id', orderIdsWithCases);

            (cards || []).forEach((c: any) => {
              cardsMap.set(c.order_id, c);
            });
          }

          // Build orders from cases data
          const seenOrderIds = new Set<string>();
          for (const caseItem of casesData as any[]) {
            if (caseItem.order && !seenOrderIds.has(caseItem.order.id)) {
              seenOrderIds.add(caseItem.order.id);

              // Get property address if we have client_id and property_id
              let propertyAddress = 'Unknown';
              if (caseItem.order.property_id) {
                const { data: prop } = await supabase
                  .from('properties')
                  .select('street_address, city, state')
                  .eq('id', caseItem.order.property_id)
                  .single();
                if (prop) {
                  propertyAddress = `${prop.street_address}, ${prop.city}, ${prop.state}`;
                }
              }

              const card = cardsMap.get(caseItem.order.id);
              orders.push({
                id: caseItem.order.id,
                order_number: caseItem.order.order_number || 'N/A',
                status: caseItem.order.status,
                client_name: caseItem.client?.company_name || 'Unknown',
                property_address: propertyAddress,
                due_date: caseItem.order.due_date,
                delivered_date: null,
                fee_amount: caseItem.order.fee_amount,
                current_stage: card?.current_stage || null,
                created_at: caseItem.created_at,
              });
            }
          }

          // Also return cases for the UI to display
          cases = casesData.map((c: any) => ({
            id: c.id,
            case_number: c.case_number || `CASE-${c.id.substring(0, 8)}`,
            status: c.status,
            client_name: c.client?.company_name || 'Unknown',
            order_number: c.order?.order_number || null,
            created_at: c.created_at,
          }));
        }
        break;
      }

      case 'casesImpeded': {
        // Production cards with active cases AND blocked parent tasks
        // First get orders that have active cases
        const { data: casesData } = await supabase
          .from('cases')
          .select('id, order_id, status')
          .eq('tenant_id', tenantId)
          .not('status', 'in', '(resolved,closed)');

        if (casesData && casesData.length > 0) {
          const orderIdsWithCases = [...new Set(casesData.map(c => c.order_id).filter(Boolean))];

          // Get production cards for those orders that have blocked parent tasks
          const { data: blockedTasks } = await supabase
            .from('production_tasks')
            .select('production_card_id, production_card:production_cards!inner(id, current_stage, created_at, order_id, tenant_id)')
            .eq('status', 'blocked')
            .is('parent_task_id', null)
            .eq('production_card.tenant_id', tenantId)
            .in('production_card.order_id', orderIdsWithCases);

          if (blockedTasks && blockedTasks.length > 0) {
            // Get unique production cards
            const uniqueCards = new Map<string, any>();
            blockedTasks.forEach((t: any) => {
              if (t.production_card && !uniqueCards.has(t.production_card.id)) {
                uniqueCards.set(t.production_card.id, t.production_card);
              }
            });

            const cards = Array.from(uniqueCards.values());
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
        }
        break;
      }

      case 'casesInReview': {
        // Production cards in FINALIZATION with active cases
        const { data: casesData } = await supabase
          .from('cases')
          .select('id, order_id, status')
          .eq('tenant_id', tenantId)
          .not('status', 'in', '(resolved,closed)');

        if (casesData && casesData.length > 0) {
          const orderIdsWithCases = [...new Set(casesData.map(c => c.order_id).filter(Boolean))];

          const { data: cards } = await supabase
            .from('production_cards')
            .select('id, current_stage, created_at, order_id')
            .eq('tenant_id', tenantId)
            .eq('current_stage', 'FINALIZATION')
            .in('order_id', orderIdsWithCases)
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
        }
        break;
      }

      case 'casesDelivered': {
        // Production cards with cases, moved to DELIVERED today
        // First get orders that have cases
        const { data: casesData } = await supabase
          .from('cases')
          .select('order_id')
          .eq('tenant_id', tenantId)
          .not('order_id', 'is', null);

        const orderIdsWithCases = [...new Set((casesData || []).map(c => c.order_id).filter(Boolean))];

        if (orderIdsWithCases.length > 0) {
          const { data: cards } = await supabase
            .from('production_cards')
            .select('id, current_stage, created_at, completed_at, order_id')
            .eq('tenant_id', tenantId)
            .eq('current_stage', 'DELIVERED')
            .gte('completed_at', todayStr)
            .lt('completed_at', new Date(today.getTime() + 86400000).toISOString())
            .in('order_id', orderIdsWithCases)
            .order('completed_at', { ascending: false })
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
                  delivered_date: c.completed_at,
                };
              });
          }
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
        // Production cards moved to DELIVERED today
        const { data: cards } = await supabase
          .from('production_cards')
          .select('id, current_stage, created_at, completed_at, order_id')
          .eq('tenant_id', tenantId)
          .eq('current_stage', 'DELIVERED')
          .gte('completed_at', todayStr)
          .lt('completed_at', new Date(today.getTime() + 86400000).toISOString())
          .order('completed_at', { ascending: false })
          .limit(100);

        if (cards && cards.length > 0) {
          const orderIds = cards.map(c => c.order_id).filter(Boolean);
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id, order_number, status, due_date, fee_amount, created_at, client_id, property_id, total_amount')
            .in('id', orderIds);

          const enrichedOrders = await enrichOrdersWithDetails(supabase, ordersData || []);
          const enrichedMap = new Map(enrichedOrders.map(o => [o.id, o]));
          const amountsMap = new Map((ordersData || []).map(o => [o.id, o.total_amount]));

          orders = cards
            .filter(c => c.order_id && enrichedMap.has(c.order_id))
            .map(c => {
              const order = enrichedMap.get(c.order_id)!;
              return {
                ...order,
                current_stage: c.current_stage,
                delivered_date: c.completed_at,
                fee_amount: amountsMap.get(c.order_id) ? parseFloat(amountsMap.get(c.order_id)) : order.fee_amount,
              };
            });
        }
        break;
      }

      case 'deliveredPast7Days':
      case 'valueDeliveredPast7Days': {
        // Production cards delivered in past 7 days
        const { data: cards } = await supabase
          .from('production_cards')
          .select('id, current_stage, created_at, completed_at, order_id')
          .eq('tenant_id', tenantId)
          .eq('current_stage', 'DELIVERED')
          .gte('completed_at', sevenDaysAgoStr)
          .order('completed_at', { ascending: false })
          .limit(100);

        if (cards && cards.length > 0) {
          const orderIds = cards.map(c => c.order_id).filter(Boolean);
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id, order_number, status, due_date, fee_amount, created_at, client_id, property_id, total_amount')
            .in('id', orderIds);

          const enrichedOrders = await enrichOrdersWithDetails(supabase, ordersData || []);
          const enrichedMap = new Map(enrichedOrders.map(o => [o.id, o]));
          const amountsMap = new Map((ordersData || []).map(o => [o.id, o.total_amount]));

          orders = cards
            .filter(c => c.order_id && enrichedMap.has(c.order_id))
            .map(c => {
              const order = enrichedMap.get(c.order_id)!;
              // Calculate turn time in days
              const created = new Date(c.created_at);
              const completed = new Date(c.completed_at);
              const turnTimeDays = Math.round((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
              return {
                ...order,
                current_stage: c.current_stage,
                delivered_date: c.completed_at,
                fee_amount: amountsMap.get(c.order_id) ? parseFloat(amountsMap.get(c.order_id)) : order.fee_amount,
                turn_time_days: turnTimeDays,
              };
            });
        }
        break;
      }

      case 'deliveredPast30Days':
      case 'valueDeliveredPast30Days': {
        // Production cards delivered in past 30 days
        const { data: cards } = await supabase
          .from('production_cards')
          .select('id, current_stage, created_at, completed_at, order_id')
          .eq('tenant_id', tenantId)
          .eq('current_stage', 'DELIVERED')
          .gte('completed_at', thirtyDaysAgoStr)
          .order('completed_at', { ascending: false })
          .limit(100);

        if (cards && cards.length > 0) {
          const orderIds = cards.map(c => c.order_id).filter(Boolean);
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id, order_number, status, due_date, fee_amount, created_at, client_id, property_id, total_amount')
            .in('id', orderIds);

          const enrichedOrders = await enrichOrdersWithDetails(supabase, ordersData || []);
          const enrichedMap = new Map(enrichedOrders.map(o => [o.id, o]));
          const amountsMap = new Map((ordersData || []).map(o => [o.id, o.total_amount]));

          orders = cards
            .filter(c => c.order_id && enrichedMap.has(c.order_id))
            .map(c => {
              const order = enrichedMap.get(c.order_id)!;
              // Calculate turn time in days
              const created = new Date(c.created_at);
              const completed = new Date(c.completed_at);
              const turnTimeDays = Math.round((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
              return {
                ...order,
                current_stage: c.current_stage,
                delivered_date: c.completed_at,
                fee_amount: amountsMap.get(c.order_id) ? parseFloat(amountsMap.get(c.order_id)) : order.fee_amount,
                turn_time_days: turnTimeDays,
              };
            });
        }
        break;
      }

      case 'avgTurnTime7Days':
      case 'avgTurnTime30Days': {
        const dateLimitStr = type === 'avgTurnTime7Days' ? sevenDaysAgoStr : thirtyDaysAgoStr;

        // Production cards delivered in the date range
        const { data: cards } = await supabase
          .from('production_cards')
          .select('id, current_stage, created_at, completed_at, order_id')
          .eq('tenant_id', tenantId)
          .eq('current_stage', 'DELIVERED')
          .gte('completed_at', dateLimitStr)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(100);

        if (cards && cards.length > 0) {
          const orderIds = cards.map(c => c.order_id).filter(Boolean);
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id, order_number, status, due_date, fee_amount, created_at, client_id, property_id, total_amount')
            .in('id', orderIds);

          const enrichedOrders = await enrichOrdersWithDetails(supabase, ordersData || []);
          const enrichedMap = new Map(enrichedOrders.map(o => [o.id, o]));

          orders = cards
            .filter(c => c.order_id && enrichedMap.has(c.order_id))
            .map(c => {
              const order = enrichedMap.get(c.order_id)!;
              // Calculate turn time in days
              const created = new Date(c.created_at);
              const completed = new Date(c.completed_at);
              const turnTimeDays = Math.round((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
              return {
                ...order,
                current_stage: c.current_stage,
                delivered_date: c.completed_at,
                turn_time_days: turnTimeDays,
              };
            });
        }
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
