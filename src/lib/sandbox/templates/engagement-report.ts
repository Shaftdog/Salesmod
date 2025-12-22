/**
 * P2.2 Template: Engagement Report
 * Generates compliance/engagement reports from order data
 */

import type { FileReference } from '../types';

interface EngagementReportParams {
  orders: OrderInput[];
  reportPeriod: {
    start: string;
    end: string;
  };
  reportType?: 'compliance' | 'performance' | 'full';
  clientFilter?: string[];
  includeDetails?: boolean;
}

interface OrderInput {
  orderId: string;
  clientName: string;
  propertyAddress: string;
  orderDate: string;
  dueDate?: string;
  completedDate?: string;
  fee: number;
  status: string;
  orderType: string;
  appraiser?: string;
  revisions?: number;
  turnaroundDays?: number;
}

interface EngagementMetrics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  completionRate: number;
  totalRevenue: number;
  averageFee: number;
  averageTurnaround: number;
  onTimeDeliveryRate: number;
  revisionRate: number;
}

interface ClientBreakdown {
  clientName: string;
  orderCount: number;
  revenue: number;
  averageFee: number;
  completionRate: number;
  onTimeRate: number;
  revisionRate: number;
}

interface ComplianceItem {
  category: string;
  status: 'compliant' | 'warning' | 'non-compliant';
  message: string;
  details?: string;
}

interface EngagementReportResult {
  reportPeriod: { start: string; end: string };
  generatedAt: string;
  metrics: EngagementMetrics;
  clientBreakdown: ClientBreakdown[];
  topClients: { name: string; orders: number; revenue: number }[];
  compliance: ComplianceItem[];
  ordersByType: Record<string, number>;
  ordersByStatus: Record<string, number>;
  trends?: {
    revenueChange: number;
    orderCountChange: number;
    turnaroundChange: number;
  };
  detailedOrders?: OrderInput[];
}

/**
 * Execute engagement report template
 */
export async function executeEngagementReport(
  inputParams: Record<string, unknown>,
  inputFileRefs: FileReference[]
): Promise<{
  outputData: Record<string, unknown>;
  outputFileRefs?: FileReference[];
  memoryUsedMb?: number;
}> {
  const params: EngagementReportParams = {
    reportType: 'full',
    includeDetails: false,
    ...inputParams,
  } as EngagementReportParams;

  if (!params.orders || params.orders.length === 0) {
    throw new Error('No order data provided');
  }

  if (!params.reportPeriod?.start || !params.reportPeriod?.end) {
    throw new Error('Report period required');
  }

  const result = generateReport(params);

  return {
    outputData: {
      success: true,
      result,
      processingTime: Date.now(),
    },
    memoryUsedMb: 2,
  };
}

/**
 * Generate engagement report
 */
function generateReport(params: EngagementReportParams): EngagementReportResult {
  let orders = params.orders;

  // Filter by client if specified
  if (params.clientFilter && params.clientFilter.length > 0) {
    orders = orders.filter((o) =>
      params.clientFilter!.some(
        (c) => o.clientName.toLowerCase().includes(c.toLowerCase())
      )
    );
  }

  // Filter by date range
  orders = orders.filter((o) => {
    const orderDate = new Date(o.orderDate);
    const start = new Date(params.reportPeriod.start);
    const end = new Date(params.reportPeriod.end);
    return orderDate >= start && orderDate <= end;
  });

  // Calculate metrics
  const completedOrders = orders.filter((o) =>
    ['completed', 'delivered', 'accepted'].includes(o.status.toLowerCase())
  );
  const pendingOrders = orders.filter((o) =>
    ['pending', 'in_progress', 'assigned'].includes(o.status.toLowerCase())
  );
  const cancelledOrders = orders.filter((o) =>
    ['cancelled', 'canceled'].includes(o.status.toLowerCase())
  );

  // On-time delivery
  const ordersWithDueDates = completedOrders.filter(
    (o) => o.dueDate && o.completedDate
  );
  const onTimeOrders = ordersWithDueDates.filter((o) => {
    const due = new Date(o.dueDate!);
    const completed = new Date(o.completedDate!);
    return completed <= due;
  });

  // Turnaround calculation
  const turnarounds = completedOrders
    .filter((o) => o.turnaroundDays !== undefined)
    .map((o) => o.turnaroundDays!);

  // Revision rate
  const ordersWithRevisions = orders.filter((o) => (o.revisions || 0) > 0);

  const metrics: EngagementMetrics = {
    totalOrders: orders.length,
    completedOrders: completedOrders.length,
    pendingOrders: pendingOrders.length,
    cancelledOrders: cancelledOrders.length,
    completionRate: orders.length > 0 ? completedOrders.length / orders.length : 0,
    totalRevenue: orders.reduce((sum, o) => sum + o.fee, 0),
    averageFee: orders.length > 0 ? orders.reduce((sum, o) => sum + o.fee, 0) / orders.length : 0,
    averageTurnaround: turnarounds.length > 0
      ? turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length
      : 0,
    onTimeDeliveryRate: ordersWithDueDates.length > 0
      ? onTimeOrders.length / ordersWithDueDates.length
      : 0,
    revisionRate: completedOrders.length > 0
      ? ordersWithRevisions.length / completedOrders.length
      : 0,
  };

  // Client breakdown
  const clientMap = new Map<string, OrderInput[]>();
  for (const order of orders) {
    const existing = clientMap.get(order.clientName) || [];
    existing.push(order);
    clientMap.set(order.clientName, existing);
  }

  const clientBreakdown: ClientBreakdown[] = Array.from(clientMap.entries()).map(
    ([clientName, clientOrders]) => {
      const completed = clientOrders.filter((o) =>
        ['completed', 'delivered', 'accepted'].includes(o.status.toLowerCase())
      );
      const withDueDates = completed.filter((o) => o.dueDate && o.completedDate);
      const onTime = withDueDates.filter((o) => {
        const due = new Date(o.dueDate!);
        const comp = new Date(o.completedDate!);
        return comp <= due;
      });
      const withRevisions = clientOrders.filter((o) => (o.revisions || 0) > 0);

      return {
        clientName,
        orderCount: clientOrders.length,
        revenue: clientOrders.reduce((sum, o) => sum + o.fee, 0),
        averageFee: clientOrders.reduce((sum, o) => sum + o.fee, 0) / clientOrders.length,
        completionRate: clientOrders.length > 0 ? completed.length / clientOrders.length : 0,
        onTimeRate: withDueDates.length > 0 ? onTime.length / withDueDates.length : 0,
        revisionRate: completed.length > 0 ? withRevisions.length / completed.length : 0,
      };
    }
  );

  // Sort by revenue
  clientBreakdown.sort((a, b) => b.revenue - a.revenue);

  // Top clients
  const topClients = clientBreakdown.slice(0, 5).map((c) => ({
    name: c.clientName,
    orders: c.orderCount,
    revenue: c.revenue,
  }));

  // Orders by type and status
  const ordersByType: Record<string, number> = {};
  const ordersByStatus: Record<string, number> = {};

  for (const order of orders) {
    ordersByType[order.orderType] = (ordersByType[order.orderType] || 0) + 1;
    ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
  }

  // Compliance checks
  const compliance = generateComplianceChecks(orders, metrics);

  return {
    reportPeriod: params.reportPeriod,
    generatedAt: new Date().toISOString(),
    metrics,
    clientBreakdown,
    topClients,
    compliance,
    ordersByType,
    ordersByStatus,
    detailedOrders: params.includeDetails ? orders : undefined,
  };
}

/**
 * Generate compliance check items
 */
function generateComplianceChecks(
  orders: OrderInput[],
  metrics: EngagementMetrics
): ComplianceItem[] {
  const items: ComplianceItem[] = [];

  // On-time delivery compliance
  if (metrics.onTimeDeliveryRate >= 0.95) {
    items.push({
      category: 'On-Time Delivery',
      status: 'compliant',
      message: `${(metrics.onTimeDeliveryRate * 100).toFixed(1)}% on-time delivery rate`,
    });
  } else if (metrics.onTimeDeliveryRate >= 0.85) {
    items.push({
      category: 'On-Time Delivery',
      status: 'warning',
      message: `${(metrics.onTimeDeliveryRate * 100).toFixed(1)}% on-time delivery rate (target: 95%)`,
    });
  } else {
    items.push({
      category: 'On-Time Delivery',
      status: 'non-compliant',
      message: `${(metrics.onTimeDeliveryRate * 100).toFixed(1)}% on-time delivery rate is below minimum`,
    });
  }

  // Revision rate compliance
  if (metrics.revisionRate <= 0.1) {
    items.push({
      category: 'Quality - Revisions',
      status: 'compliant',
      message: `${(metrics.revisionRate * 100).toFixed(1)}% revision rate`,
    });
  } else if (metrics.revisionRate <= 0.2) {
    items.push({
      category: 'Quality - Revisions',
      status: 'warning',
      message: `${(metrics.revisionRate * 100).toFixed(1)}% revision rate (target: <10%)`,
    });
  } else {
    items.push({
      category: 'Quality - Revisions',
      status: 'non-compliant',
      message: `${(metrics.revisionRate * 100).toFixed(1)}% revision rate exceeds acceptable threshold`,
    });
  }

  // Completion rate
  if (metrics.completionRate >= 0.9) {
    items.push({
      category: 'Completion Rate',
      status: 'compliant',
      message: `${(metrics.completionRate * 100).toFixed(1)}% completion rate`,
    });
  } else if (metrics.completionRate >= 0.75) {
    items.push({
      category: 'Completion Rate',
      status: 'warning',
      message: `${(metrics.completionRate * 100).toFixed(1)}% completion rate (target: 90%)`,
    });
  } else {
    items.push({
      category: 'Completion Rate',
      status: 'non-compliant',
      message: `${(metrics.completionRate * 100).toFixed(1)}% completion rate needs improvement`,
    });
  }

  // Turnaround time
  if (metrics.averageTurnaround <= 5) {
    items.push({
      category: 'Turnaround Time',
      status: 'compliant',
      message: `${metrics.averageTurnaround.toFixed(1)} day average turnaround`,
    });
  } else if (metrics.averageTurnaround <= 7) {
    items.push({
      category: 'Turnaround Time',
      status: 'warning',
      message: `${metrics.averageTurnaround.toFixed(1)} day average turnaround (target: 5 days)`,
    });
  } else {
    items.push({
      category: 'Turnaround Time',
      status: 'non-compliant',
      message: `${metrics.averageTurnaround.toFixed(1)} day average turnaround exceeds SLA`,
    });
  }

  return items;
}
