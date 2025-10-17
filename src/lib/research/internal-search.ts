import { createClient } from '@/lib/supabase/server';

export interface ClientIntel {
  client: any;
  orders: any[];
  activities: any[];
  contacts: any[];
  deals: any[];
  metrics: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    lastOrderDate: string | null;
    daysSinceLastOrder: number;
    lastContactDate: string | null;
    daysSinceLastContact: number;
    activeDeals: number;
    totalDealValue: number;
  };
}

/**
 * Gather comprehensive internal data about a client
 */
export async function gatherClientIntel(clientId: string): Promise<ClientIntel> {
  const supabase = await createClient();

  // Parallel queries for speed
  const [clientResult, ordersResult, activitiesResult, contactsResult, dealsResult] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    supabase.from('orders').select('*').eq('client_id', clientId).order('ordered_date', { ascending: false }),
    supabase.from('activities').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    supabase.from('contacts').select('*').eq('client_id', clientId),
    supabase.from('deals').select('*').eq('client_id', clientId),
  ]);

  const client = clientResult.data;
  const orders = ordersResult.data || [];
  const activities = activitiesResult.data || [];
  const contacts = contactsResult.data || [];
  const deals = dealsResult.data || [];

  // Calculate metrics
  const now = new Date();
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const lastOrder = orders[0];
  const lastOrderDate = lastOrder?.ordered_date || null;
  const daysSinceLastOrder = lastOrderDate
    ? Math.floor((now.getTime() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const lastActivity = activities[0];
  const lastContactDate = lastActivity?.created_at || null;
  const daysSinceLastContact = lastContactDate
    ? Math.floor((now.getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage)).length;
  const totalDealValue = deals
    .filter(d => !['lost'].includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);

  return {
    client,
    orders,
    activities,
    contacts,
    deals,
    metrics: {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      lastOrderDate,
      daysSinceLastOrder,
      lastContactDate,
      daysSinceLastContact,
      activeDeals,
      totalDealValue,
    },
  };
}

/**
 * Format client intel into readable text for AI summarization
 */
export function formatClientIntel(intel: ClientIntel): string {
  const { client, metrics, orders, activities, contacts, deals } = intel;

  return `
CLIENT: ${client.company_name}

CONTACT INFORMATION:
- Primary Contact: ${client.primary_contact}
- Email: ${client.email}
- Phone: ${client.phone}
- Address: ${client.address}

BUSINESS RELATIONSHIP:
- Account Status: ${client.is_active ? 'Active' : 'Inactive'}
- Payment Terms: Net ${client.payment_terms} days
- Special Requirements: ${client.special_requirements || 'None'}
- Created: ${new Date(client.created_at).toLocaleDateString()}

PERFORMANCE METRICS:
- Total Orders: ${metrics.totalOrders}
- Total Revenue: $${metrics.totalRevenue.toFixed(2)}
- Average Order Value: $${metrics.avgOrderValue.toFixed(2)}
- Last Order: ${metrics.lastOrderDate ? new Date(metrics.lastOrderDate).toLocaleDateString() : 'Never'}
- Days Since Last Order: ${metrics.daysSinceLastOrder}
- Days Since Last Contact: ${metrics.daysSinceLastContact}

CONTACTS (${contacts.length}):
${contacts.map(c => `- ${c.first_name} ${c.last_name}${c.title ? ` (${c.title})` : ''}${c.email ? ` - ${c.email}` : ''}`).join('\n')}

RECENT ORDERS (Last 5):
${orders.slice(0, 5).map(o => 
  `- ${new Date(o.ordered_date).toLocaleDateString()}: ${o.order_number} - $${parseFloat(o.total_amount).toFixed(2)} (${o.status})`
).join('\n') || 'No recent orders'}

RECENT ACTIVITIES (Last 5):
${activities.slice(0, 5).map(a => 
  `- ${new Date(a.created_at).toLocaleDateString()}: ${a.activity_type} - ${a.subject} (${a.outcome || a.status})`
).join('\n') || 'No recent activities'}

ACTIVE DEALS:
${deals.filter(d => !['won', 'lost'].includes(d.stage)).map(d =>
  `- ${d.title}: $${d.value || 0} (${d.stage})`
).join('\n') || 'No active deals'}

TOTAL PIPELINE VALUE: $${metrics.totalDealValue.toFixed(2)}
  `.trim();
}

