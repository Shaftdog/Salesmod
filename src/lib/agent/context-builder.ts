import { createServiceRoleClient } from '@/lib/supabase/server';
import { Client, Order, Deal, Goal, Activity, Contact, Case } from '@/lib/types';
import { calculateGoalProgress } from '@/hooks/use-goals';

export interface AgentContext {
  goals: Array<{
    goal: Goal;
    progress: number;
    gapToTarget: number;
    daysRemaining: number;
    pressureScore: number; // 0-1, higher = more urgent
  }>;
  clients: Array<{
    client: Client;
    contacts: Contact[];
    recentOrders: Order[];
    recentActivities: Activity[];
    rfmScore: number; // Recency, Frequency, Monetary
    engagementScore: number;
    lastContactDays: number;
    priorityScore: number; // Composite score for ranking
  }>;
  properties: Array<any>; // All properties with addresses, types, etc.
  cases: Array<any>; // All support/service cases
  allOrders: Order[]; // Complete order history (up to 3000)
  signals: {
    emailOpens: number;
    emailClicks: number;
    emailReplies: number;
    meetingsBooked: number;
    ordersCreated: number;
    dealsAdvanced: number;
  };
  memories: Array<{
    key: string;
    content: any;
    importance: number;
  }>;
  orgId: string;
  currentTime: Date;
}

/**
 * Build comprehensive context for the agent to make decisions
 */
export async function buildContext(orgId: string): Promise<AgentContext> {
  const supabase = createServiceRoleClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get user's tenant_id for multi-tenant isolation
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', orgId)
    .single();

  const tenantId = profile?.tenant_id;
  if (!tenantId) {
    throw new Error(`User ${orgId} has no tenant_id assigned`);
  }

  // Fetch active goals
  const { data: goalsData, error: goalsError } = await supabase
    .from('goals')
    .select('*')
    .eq('is_active', true)
    .gte('period_end', now.toISOString());

  if (goalsError) throw goalsError;

  // Fetch clients with relationships - MUST filter by tenant_id for multi-tenant isolation
  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .select(`
      *,
      contacts:contacts!contacts_client_id_fkey(*),
      orders:orders(*)
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (clientsError) throw clientsError;

  console.log(`[Context] Found ${clientsData?.length || 0} clients for tenant ${tenantId}`);

  // Fetch orders for goal calculations (up to 3000 most recent)
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .order('ordered_date', { ascending: false })
    .limit(3000);

  if (ordersError) throw ordersError;

  // Fetch recent activities for signal extraction
  const { data: activitiesData, error: activitiesError } = await supabase
    .from('activities')
    .select('*')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (activitiesError) throw activitiesError;

  // Fetch deals for pipeline context
  const { data: dealsData, error: dealsError } = await supabase
    .from('deals')
    .select('*')
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (dealsError) throw dealsError;

  // Fetch properties (with pagination for large datasets)
  let allProperties: any[] = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data: propertiesPage, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (propertiesError) throw propertiesError;

    if (!propertiesPage || propertiesPage.length === 0) break;

    allProperties = allProperties.concat(propertiesPage);

    if (propertiesPage.length < pageSize) break; // Last page
    page++;
  }

  // Fetch cases (up to 1000 most recent)
  const { data: casesData, error: casesError } = await supabase
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (casesError) throw casesError;

  // Fetch agent memories - using tenant_id for multi-tenant isolation
  // First, fetch ALL card_feedback memories (learning rules) - these are critical
  const { data: feedbackMemories, error: feedbackError } = await supabase
    .from('agent_memories')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('scope', 'card_feedback')
    .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`)
    .order('importance', { ascending: false })
    .limit(100); // Allow up to 100 learning rules

  if (feedbackError) throw feedbackError;

  // Then fetch other memories (client_context, chat, etc.)
  const { data: otherMemories, error: otherError } = await supabase
    .from('agent_memories')
    .select('*')
    .eq('tenant_id', tenantId)
    .neq('scope', 'card_feedback')
    .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`)
    .order('importance', { ascending: false })
    .limit(50);

  if (otherError) throw otherError;

  // Combine: all feedback rules + top 50 other memories
  const memoriesData = [...(feedbackMemories || []), ...(otherMemories || [])];

  // Process goals with progress
  const goals = (goalsData || []).map((goal: any) => {
    const goalObj: Goal = {
      id: goal.id,
      metricType: goal.metric_type,
      targetValue: parseFloat(goal.target_value),
      periodType: goal.period_type,
      periodStart: goal.period_start,
      periodEnd: goal.period_end,
      assignedTo: goal.assigned_to,
      description: goal.description,
      isActive: goal.is_active,
      createdBy: goal.created_by,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
    };

    const progress = calculateGoalProgress(goalObj, ordersData || [], dealsData || [], clientsData || []);
    const gapToTarget = Math.max(0, goalObj.targetValue - progress.currentValue);
    const pressureScore = calculatePressureScore(progress.progress, progress.periodProgressPct, progress.daysRemaining);

    return {
      goal: goalObj,
      progress: progress.progress,
      gapToTarget,
      daysRemaining: progress.daysRemaining,
      pressureScore,
    };
  });

  // Process clients with engagement scores
  const clients = (clientsData || []).map((client: any) => {
    const clientOrders = (ordersData || []).filter((o: any) => o.client_id === client.id);
    const recentOrders = clientOrders.filter((o: any) => new Date(o.ordered_date) >= sevenDaysAgo);
    const clientActivities = (activitiesData || []).filter((a: any) => a.client_id === client.id);

    const rfmScore = calculateRFMScore(client, clientOrders, now);
    const engagementScore = calculateEngagementScore(clientActivities);
    const lastContactDays = calculateLastContactDays(clientActivities, now);

    return {
      client: {
        id: client.id,
        companyName: client.company_name,
        primaryContact: client.primary_contact,
        email: client.email,
        phone: client.phone,
        address: client.address,
        billingAddress: client.billing_address,
        paymentTerms: client.payment_terms,
        isActive: client.is_active,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      },
      contacts: (client.contacts || []).map((c: any) => ({
        id: c.id,
        clientId: c.client_id,
        firstName: c.first_name,
        lastName: c.last_name,
        title: c.title,
        email: c.email,
        phone: c.phone,
        mobile: c.mobile,
        isPrimary: c.is_primary,
        department: c.department,
        notes: c.notes,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
      recentOrders: recentOrders.map((o: any) => transformOrder(o)),
      recentActivities: clientActivities.map((a: any) => transformActivity(a)),
      rfmScore,
      engagementScore,
      lastContactDays,
    };
  });

  // Extract signals from activities
  const signals = extractSignals(activitiesData || []);

  // Transform memories
  const memories = (memoriesData || []).map((m: any) => ({
    key: m.key,
    content: m.content,
    importance: parseFloat(m.importance || 0.5),
  }));

  return {
    goals,
    clients: rankClients(clients, goals),
    properties: allProperties || [],
    cases: casesData || [],
    allOrders: (ordersData || []).map(transformOrder),
    signals,
    memories,
    orgId,
    currentTime: now,
  };
}

/**
 * Calculate pressure score based on progress vs time elapsed
 * Returns 0-1, where 1 = maximum pressure (far behind schedule)
 */
function calculatePressureScore(progress: number, periodProgressPct: number, daysRemaining: number): number {
  // If on track or ahead, low pressure
  if (progress >= periodProgressPct) {
    return Math.max(0, (periodProgressPct - progress) / 100 * 0.3);
  }

  // Behind schedule - increase pressure
  const gap = periodProgressPct - progress;
  const urgencyMultiplier = daysRemaining <= 7 ? 1.5 : daysRemaining <= 14 ? 1.2 : 1.0;

  return Math.min(1, (gap / 100) * urgencyMultiplier);
}

/**
 * Calculate RFM score (Recency, Frequency, Monetary)
 */
function calculateRFMScore(client: any, orders: any[], now: Date): number {
  if (orders.length === 0) return 0;

  // Recency: days since last order (inverse - lower is better)
  const lastOrder = orders.reduce((latest, o) => {
    const orderDate = new Date(o.ordered_date);
    return orderDate > latest ? orderDate : latest;
  }, new Date(0));
  const daysSinceLastOrder = Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24));
  const recencyScore = Math.max(0, 1 - daysSinceLastOrder / 90); // 0-1, normalize to 90 days

  // Frequency: number of orders in last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentOrders = orders.filter(o => new Date(o.ordered_date) >= thirtyDaysAgo);
  const frequencyScore = Math.min(1, recentOrders.length / 10); // Normalize to 10 orders

  // Monetary: total revenue in last 30 days
  const recentRevenue = recentOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const monetaryScore = Math.min(1, recentRevenue / 50000); // Normalize to $50k

  // Weighted average
  return (recencyScore * 0.4 + frequencyScore * 0.3 + monetaryScore * 0.3);
}

/**
 * Calculate engagement score based on activities
 */
function calculateEngagementScore(activities: any[]): number {
  if (activities.length === 0) return 0;

  let score = 0;
  activities.forEach(activity => {
    switch (activity.activity_type) {
      case 'email':
        score += activity.outcome === 'reply' ? 0.5 : 0.2;
        break;
      case 'call':
        score += 0.7;
        break;
      case 'meeting':
        score += 1.0;
        break;
      case 'research':
        score += 0.3; // Research counts as engagement
        break;
      case 'task':
        score += 0.2;
        break;
      default:
        score += 0.1;
    }
  });

  return Math.min(1, score / 5); // Normalize
}

/**
 * Calculate days since last contact/engagement
 * Includes all meaningful agent interactions, not just direct contact
 */
function calculateLastContactDays(activities: any[], now: Date): number {
  if (activities.length === 0) return 999;

  // Include ALL agent activities that represent engagement with the client
  // This prevents the agent from spamming the same client with repeated actions
  const engagementActivities = activities.filter(a =>
    ['email', 'call', 'meeting', 'research', 'task', 'note'].includes(a.activity_type)
  );

  if (engagementActivities.length === 0) return 999;

  const lastActivity = engagementActivities[0]; // Already sorted by created_at DESC
  const lastDate = new Date(lastActivity.created_at);
  return Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Extract engagement signals from activities
 */
function extractSignals(activities: any[]) {
  return {
    emailOpens: activities.filter(a => a.activity_type === 'email' && a.outcome?.includes('open')).length,
    emailClicks: activities.filter(a => a.activity_type === 'email' && a.outcome?.includes('click')).length,
    emailReplies: activities.filter(a => a.activity_type === 'email' && a.outcome === 'reply').length,
    meetingsBooked: activities.filter(a => a.activity_type === 'meeting' && a.status === 'scheduled').length,
    ordersCreated: activities.filter(a => a.activity_type === 'note' && a.description?.includes('order created')).length,
    dealsAdvanced: activities.filter(a => a.description?.includes('stage changed')).length,
  };
}

/**
 * Rank clients by priority for agent attention
 */
function rankClients(
  clients: Array<any>,
  goals: Array<any>
): Array<any> {
  // Calculate composite score for each client
  const scoredClients = clients.map(c => {
    // Base score from RFM (clients with orders)
    let score = c.rfmScore * 40;

    // Boost for engagement
    score += c.engagementScore * 20;

    // NEW: Boost for clients with no contacts (need research to find contacts)
    const hasContactsWithEmail = c.contacts.some((ct: any) => ct.email);
    if (!hasContactsWithEmail) {
      score += 15; // Boost to prioritize finding contacts
    }

    // Penalty for recent contact (avoid spam)
    if (c.lastContactDays < 3) {
      score *= 0.3;
    } else if (c.lastContactDays < 7) {
      score *= 0.7;
    }

    // Boost for staleness (need re-engagement)
    if (c.lastContactDays > 14 && c.rfmScore > 0.5) {
      score *= 1.3;
    }

    // NEW: Boost for clients never contacted (completely untouched)
    if (c.lastContactDays >= 999) {
      score += 10; // These are opportunities
    }

    // Boost based on goal pressure
    const avgPressure = goals.reduce((sum, g) => sum + g.pressureScore, 0) / Math.max(1, goals.length);
    score *= (1 + avgPressure * 0.5); // Up to 50% boost

    // NEW: Add small random factor to break ties and add variety (0-5 points)
    score += Math.random() * 5;

    return { ...c, priorityScore: score, hasContactsWithEmail };
  });

  // Sort by priority score descending
  const sorted = scoredClients.sort((a, b) => b.priorityScore - a.priorityScore);

  // NEW: Return more clients (up to 50) to give planner more options
  // The planner will still only show top 15 in prompt but has more to choose from
  return sorted.slice(0, 50);
}

/**
 * Helper to transform database order to Order type
 */
function transformOrder(o: any): Order {
  return {
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    priority: o.priority,
    orderType: o.order_type,
    propertyAddress: o.property_address,
    propertyCity: o.property_city,
    propertyState: o.property_state,
    propertyZip: o.property_zip,
    propertyType: o.property_type,
    loanNumber: o.loan_number,
    loanType: o.loan_type,
    loanAmount: o.loan_amount,
    clientId: o.client_id,
    lenderName: o.lender_name,
    loanOfficer: o.loan_officer,
    loanOfficerEmail: o.loan_officer_email,
    loanOfficerPhone: o.loan_officer_phone,
    processorName: o.processor_name,
    processorEmail: o.processor_email,
    processorPhone: o.processor_phone,
    borrowerName: o.borrower_name,
    borrowerEmail: o.borrower_email,
    borrowerPhone: o.borrower_phone,
    propertyContactName: o.property_contact_name,
    propertyContactPhone: o.property_contact_phone,
    propertyContactEmail: o.property_contact_email,
    accessInstructions: o.access_instructions,
    specialInstructions: o.special_instructions,
    dueDate: o.due_date,
    orderedDate: o.ordered_date,
    completedDate: o.completed_date,
    deliveredDate: o.delivered_date,
    feeAmount: parseFloat(o.fee_amount || 0),
    techFee: parseFloat(o.tech_fee || 0),
    totalAmount: parseFloat(o.total_amount || 0),
    assignedTo: o.assigned_to,
    assignedDate: o.assigned_date,
    createdBy: o.created_by,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    metadata: o.metadata,
  };
}

/**
 * Helper to transform database activity to Activity type
 */
function transformActivity(a: any): Activity {
  return {
    id: a.id,
    clientId: a.client_id,
    contactId: a.contact_id,
    orderId: a.order_id,
    activityType: a.activity_type,
    subject: a.subject,
    description: a.description,
    status: a.status,
    scheduledAt: a.scheduled_at,
    completedAt: a.completed_at,
    durationMinutes: a.duration_minutes,
    outcome: a.outcome,
    createdBy: a.created_by,
    assignedTo: a.assigned_to,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}


