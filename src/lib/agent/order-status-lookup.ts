/**
 * Order Status Lookup Service
 *
 * Provides intelligent order lookup and comprehensive status information
 * for automated email responses. Searches by multiple criteria and returns
 * detailed status context for high-quality responses.
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface OrderStatusResult {
  found: boolean;
  order?: OrderDetails;
  recentActivity?: ActivityItem[];
  possibleMatches?: OrderSummary[];
  searchContext: {
    searchedBy: ('order_number' | 'property_address' | 'client_email' | 'borrower_name')[];
    query: string;
  };
}

export interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  statusLabel: string;
  propertyAddress: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  fullAddress: string;
  borrowerName?: string;
  orderType: string;
  scopeOfWork?: string;
  priority: string;
  dueDate?: string;
  dueDateFormatted?: string;
  daysUntilDue?: number;
  inspectionDate?: string;
  inspectionDateFormatted?: string;
  completedDate?: string;
  assignedTo?: {
    id: string;
    name: string;
  };
  progressPercent: number;
  progressDescription: string;
  nextSteps: string[];
  estimatedCompletion?: string;
  clientName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  type: string;
  description: string;
  performedBy?: string;
  createdAt: string;
  timeAgo: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  propertyAddress: string;
  dueDate?: string;
}

// ============================================================================
// Status Mapping
// ============================================================================

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  assigned: 'Assigned to Appraiser',
  in_progress: 'In Progress',
  scheduled: 'Inspection Scheduled',
  inspection_complete: 'Inspection Complete',
  review: 'Under Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
  hold: 'On Hold',
};

const STATUS_PROGRESS: Record<string, number> = {
  pending: 10,
  assigned: 20,
  scheduled: 30,
  in_progress: 50,
  inspection_complete: 70,
  review: 85,
  completed: 100,
  cancelled: 0,
  hold: 0,
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  pending: 'Your order has been received and is awaiting assignment to an appraiser.',
  assigned: 'An appraiser has been assigned and will be scheduling the inspection soon.',
  scheduled: 'The property inspection has been scheduled.',
  in_progress: 'The appraiser is actively working on your appraisal.',
  inspection_complete: 'The property inspection is complete. The report is being prepared.',
  review: 'The appraisal report is under quality review.',
  completed: 'Your appraisal is complete and ready for delivery.',
  cancelled: 'This order has been cancelled.',
  hold: 'This order is currently on hold.',
};

const STATUS_NEXT_STEPS: Record<string, string[]> = {
  pending: [
    'We will assign an appraiser shortly',
    'You will receive confirmation once assigned',
  ],
  assigned: [
    'The appraiser will contact you to schedule the inspection',
    'Please ensure property access is available',
  ],
  scheduled: [
    'The inspection is scheduled - please ensure property access',
    'The appraiser will complete the site visit as scheduled',
  ],
  in_progress: [
    'The appraiser is completing the analysis',
    'Report will be submitted for review upon completion',
  ],
  inspection_complete: [
    'The appraiser is preparing the report',
    'Quality review will follow',
  ],
  review: [
    'Quality assurance review in progress',
    'You will be notified once the report is finalized',
  ],
  completed: [
    'The report has been delivered',
    'Please contact us if you have any questions',
  ],
  cancelled: [
    'Please contact us if you have questions about this order',
  ],
  hold: [
    'Please contact us for information about the hold status',
  ],
};

// ============================================================================
// Main Lookup Function
// ============================================================================

/**
 * Looks up order status using intelligent multi-criteria search
 * Searches by: order number, property address, client email, borrower name
 */
export async function lookupOrderStatus(
  tenantId: string,
  searchParams: {
    orderNumber?: string;
    propertyAddress?: string;
    senderEmail?: string;
    borrowerName?: string;
    // Raw email content for additional extraction
    emailBody?: string;
  }
): Promise<OrderStatusResult> {
  const supabase = await createClient();
  const searchedBy: OrderStatusResult['searchContext']['searchedBy'] = [];
  let query = '';

  // Build search query based on available params
  if (searchParams.orderNumber) {
    searchedBy.push('order_number');
    query = searchParams.orderNumber;
  }
  if (searchParams.propertyAddress) {
    searchedBy.push('property_address');
    query = query || searchParams.propertyAddress;
  }
  if (searchParams.senderEmail) {
    searchedBy.push('client_email');
    query = query || searchParams.senderEmail;
  }
  if (searchParams.borrowerName) {
    searchedBy.push('borrower_name');
    query = query || searchParams.borrowerName;
  }

  // Try to find order by order number (most specific)
  if (searchParams.orderNumber) {
    const order = await findOrderByNumber(supabase, tenantId, searchParams.orderNumber);
    if (order) {
      const recentActivity = await getRecentOrderActivity(supabase, tenantId, order.id);
      return {
        found: true,
        order: await enrichOrderDetails(supabase, order),
        recentActivity,
        searchContext: { searchedBy, query },
      };
    }
  }

  // Try to find by property address
  if (searchParams.propertyAddress) {
    const order = await findOrderByAddress(supabase, tenantId, searchParams.propertyAddress);
    if (order) {
      const recentActivity = await getRecentOrderActivity(supabase, tenantId, order.id);
      return {
        found: true,
        order: await enrichOrderDetails(supabase, order),
        recentActivity,
        searchContext: { searchedBy, query },
      };
    }
  }

  // Try to find by sender email (through client/contact)
  if (searchParams.senderEmail) {
    const orders = await findOrdersByClientEmail(supabase, tenantId, searchParams.senderEmail);
    if (orders.length === 1) {
      const recentActivity = await getRecentOrderActivity(supabase, tenantId, orders[0].id);
      return {
        found: true,
        order: await enrichOrderDetails(supabase, orders[0]),
        recentActivity,
        searchContext: { searchedBy, query },
      };
    } else if (orders.length > 1) {
      // Multiple orders - return summaries for clarification
      return {
        found: false,
        possibleMatches: orders.map(orderToSummary),
        searchContext: { searchedBy, query },
      };
    }
  }

  // Try by borrower name
  if (searchParams.borrowerName) {
    const order = await findOrderByBorrower(supabase, tenantId, searchParams.borrowerName);
    if (order) {
      const recentActivity = await getRecentOrderActivity(supabase, tenantId, order.id);
      return {
        found: true,
        order: await enrichOrderDetails(supabase, order),
        recentActivity,
        searchContext: { searchedBy, query },
      };
    }
  }

  // Nothing found
  return {
    found: false,
    searchContext: { searchedBy, query },
  };
}

// ============================================================================
// Search Functions
// ============================================================================

async function findOrderByNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  orderNumber: string
): Promise<any | null> {
  // Clean up order number - remove common prefixes/suffixes
  const cleanNumber = orderNumber.replace(/^(order\s*#?|#)/i, '').trim();

  const { data } = await supabase
    .from('orders')
    .select(`
      *,
      clients (id, company_name),
      assigned_appraiser:profiles!orders_assigned_to_fkey (id, name)
    `)
    .eq('tenant_id', tenantId)
    .or(`order_number.ilike.%${cleanNumber}%,order_number.eq.${cleanNumber}`)
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data;
}

async function findOrderByAddress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  address: string
): Promise<any | null> {
  // Extract key parts of address for fuzzy matching
  const cleanAddress = address.replace(/[,\.#]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

  const { data } = await supabase
    .from('orders')
    .select(`
      *,
      clients (id, company_name),
      assigned_appraiser:profiles!orders_assigned_to_fkey (id, name)
    `)
    .eq('tenant_id', tenantId)
    .ilike('property_address', `%${cleanAddress}%`)
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data;
}

async function findOrdersByClientEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  email: string
): Promise<any[]> {
  // First find the contact/client by email
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, client_id')
    .eq('tenant_id', tenantId)
    .eq('email', email.toLowerCase())
    .single();

  if (!contact?.client_id) {
    return [];
  }

  // Get active orders for this client
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      clients (id, company_name),
      assigned_appraiser:profiles!orders_assigned_to_fkey (id, name)
    `)
    .eq('tenant_id', tenantId)
    .eq('client_id', contact.client_id)
    .not('status', 'in', '(cancelled,completed)')
    .order('created_at', { ascending: false })
    .limit(5);

  return orders || [];
}

async function findOrderByBorrower(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  borrowerName: string
): Promise<any | null> {
  const cleanName = borrowerName.trim().toLowerCase();

  const { data } = await supabase
    .from('orders')
    .select(`
      *,
      clients (id, company_name),
      assigned_appraiser:profiles!orders_assigned_to_fkey (id, name)
    `)
    .eq('tenant_id', tenantId)
    .ilike('borrower_name', `%${cleanName}%`)
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data;
}

// ============================================================================
// Enrichment Functions
// ============================================================================

async function enrichOrderDetails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  order: any
): Promise<OrderDetails> {
  const status = order.status || 'pending';
  const dueDate = order.due_date ? new Date(order.due_date) : null;
  const inspectionDate = order.inspection_date ? new Date(order.inspection_date) : null;
  const now = new Date();

  // Calculate days until due
  let daysUntilDue: number | undefined;
  if (dueDate) {
    daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Build full address
  const addressParts = [
    order.property_address,
    order.property_city,
    order.property_state,
    order.property_zip,
  ].filter(Boolean);
  const fullAddress = addressParts.join(', ');

  // Estimate completion based on status and due date
  let estimatedCompletion: string | undefined;
  if (status !== 'completed' && status !== 'cancelled' && dueDate) {
    if (daysUntilDue && daysUntilDue > 0) {
      estimatedCompletion = formatDate(dueDate);
    } else if (daysUntilDue && daysUntilDue <= 0) {
      estimatedCompletion = 'Shortly (past due date)';
    }
  }

  return {
    id: order.id,
    orderNumber: order.order_number,
    status,
    statusLabel: STATUS_LABELS[status] || status,
    propertyAddress: order.property_address,
    propertyCity: order.property_city,
    propertyState: order.property_state,
    propertyZip: order.property_zip,
    fullAddress,
    borrowerName: order.borrower_name,
    orderType: order.order_type,
    scopeOfWork: order.scope_of_work,
    priority: order.priority || 'normal',
    dueDate: order.due_date,
    dueDateFormatted: dueDate ? formatDate(dueDate) : undefined,
    daysUntilDue,
    inspectionDate: order.inspection_date,
    inspectionDateFormatted: inspectionDate ? formatDateTime(inspectionDate) : undefined,
    completedDate: order.completed_date,
    assignedTo: order.assigned_appraiser ? {
      id: order.assigned_appraiser.id,
      name: order.assigned_appraiser.name,
    } : undefined,
    progressPercent: STATUS_PROGRESS[status] || 0,
    progressDescription: STATUS_DESCRIPTIONS[status] || 'Status unknown',
    nextSteps: STATUS_NEXT_STEPS[status] || [],
    estimatedCompletion,
    clientName: order.clients?.company_name,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

async function getRecentOrderActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  orderId: string
): Promise<ActivityItem[]> {
  const { data: activities } = await supabase
    .from('order_activities')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!activities) return [];

  return activities.map((a: any) => ({
    type: a.activity_type,
    description: a.description,
    performedBy: a.performed_by_name,
    createdAt: a.created_at,
    timeAgo: getTimeAgo(new Date(a.created_at)),
  }));
}

function orderToSummary(order: any): OrderSummary {
  return {
    id: order.id,
    orderNumber: order.order_number,
    status: STATUS_LABELS[order.status] || order.status,
    propertyAddress: order.property_address,
    dueDate: order.due_date,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date);
  }
}

// ============================================================================
// Context Builder for Response Generation
// ============================================================================

/**
 * Builds a comprehensive status context string for AI response generation
 */
export function buildStatusResponseContext(result: OrderStatusResult): string {
  if (!result.found || !result.order) {
    if (result.possibleMatches && result.possibleMatches.length > 0) {
      return `
MULTIPLE ORDERS FOUND for this contact. Need clarification on which order:
${result.possibleMatches.map((m, i) => `
${i + 1}. Order #${m.orderNumber}
   Property: ${m.propertyAddress}
   Status: ${m.status}
   Due: ${m.dueDate || 'Not set'}`).join('\n')}

Ask the customer to specify which order they are inquiring about.
`;
    }

    return `
ORDER NOT FOUND. No matching order found using: ${result.searchContext.searchedBy.join(', ')}.
Search query: "${result.searchContext.query}"

Apologize and ask for more details:
- Order number
- Property address
- Borrower name
`;
  }

  const order = result.order;
  let context = `
ORDER FOUND - Provide this specific status information:

ORDER DETAILS:
- Order Number: ${order.orderNumber}
- Property: ${order.fullAddress}
${order.borrowerName ? `- Borrower: ${order.borrowerName}` : ''}
- Order Type: ${order.orderType}
${order.scopeOfWork ? `- Scope: ${order.scopeOfWork}` : ''}

CURRENT STATUS:
- Status: ${order.statusLabel}
- Progress: ${order.progressPercent}% complete
- ${order.progressDescription}

`;

  if (order.dueDate) {
    context += `DUE DATE:
- Due: ${order.dueDateFormatted}
${order.daysUntilDue !== undefined ? `- ${order.daysUntilDue > 0 ? `${order.daysUntilDue} days remaining` : 'Past due'}` : ''}
${order.estimatedCompletion ? `- Estimated Completion: ${order.estimatedCompletion}` : ''}

`;
  }

  if (order.inspectionDate) {
    context += `INSPECTION:
- Scheduled: ${order.inspectionDateFormatted}

`;
  }

  if (order.assignedTo) {
    context += `ASSIGNED APPRAISER:
- ${order.assignedTo.name}

`;
  }

  if (order.nextSteps.length > 0) {
    context += `NEXT STEPS:
${order.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

`;
  }

  if (result.recentActivity && result.recentActivity.length > 0) {
    context += `RECENT ACTIVITY:
${result.recentActivity.map(a => `- ${a.timeAgo}: ${a.description}`).join('\n')}
`;
  }

  return context;
}
