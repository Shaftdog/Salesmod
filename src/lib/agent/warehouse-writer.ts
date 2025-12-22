/**
 * P2.1: Data Warehouse Writer
 * Captures and stores events for pattern detection and analytics
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface WarehouseEvent {
  eventType: string;
  eventSource: string;
  sourceId?: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  clientId?: string;
  contactId?: string;
  orderId?: string;
  dealId?: string;
  runId?: string;
}

export interface WarehouseEventRecord extends WarehouseEvent {
  id: string;
  tenantId: string;
  occurredAt: string;
  processedAt: string | null;
  eventDay: string;
  createdAt: string;
}

export interface QueryOptions {
  eventType?: string;
  eventTypes?: string[];
  eventSource?: string;
  clientId?: string;
  contactId?: string;
  orderId?: string;
  dealId?: string;
  runId?: string;
  startDate?: Date;
  endDate?: Date;
  processed?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'asc' | 'desc';
}

export interface EventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySource: Record<string, number>;
  eventsToday: number;
  unprocessedCount: number;
}

// ============================================================================
// Event Types Constants
// ============================================================================

export const EVENT_TYPES = {
  // Order lifecycle
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  ORDER_ACCEPTED: 'order_accepted',
  ORDER_COMPLETED: 'order_completed',
  ORDER_CANCELLED: 'order_cancelled',

  // Deal/Opportunity lifecycle
  DEAL_CREATED: 'deal_created',
  DEAL_STAGE_CHANGED: 'deal_stage_changed',
  DEAL_WON: 'deal_won',
  DEAL_LOST: 'deal_lost',
  DEAL_STALLED: 'deal_stalled',

  // Quote/Bid lifecycle
  QUOTE_CREATED: 'quote_created',
  QUOTE_SENT: 'quote_sent',
  QUOTE_VIEWED: 'quote_viewed',
  QUOTE_ACCEPTED: 'quote_accepted',
  QUOTE_REJECTED: 'quote_rejected',

  // Engagement
  EMAIL_SENT: 'email_sent',
  EMAIL_OPENED: 'email_opened',
  EMAIL_CLICKED: 'email_clicked',
  EMAIL_REPLIED: 'email_replied',
  EMAIL_BOUNCED: 'email_bounced',

  // Card execution
  CARD_CREATED: 'card_created',
  CARD_EXECUTED: 'card_executed',
  CARD_FAILED: 'card_failed',
  CARD_BLOCKED: 'card_blocked',

  // Autonomous cycle
  CYCLE_STARTED: 'cycle_started',
  CYCLE_COMPLETED: 'cycle_completed',
  CYCLE_FAILED: 'cycle_failed',

  // Compliance
  COMPLIANCE_DUE: 'compliance_due',
  COMPLIANCE_SENT: 'compliance_sent',
  COMPLIANCE_COMPLETED: 'compliance_completed',
  COMPLIANCE_ESCALATED: 'compliance_escalated',

  // Feedback
  FEEDBACK_REQUESTED: 'feedback_requested',
  FEEDBACK_RECEIVED: 'feedback_received',
  FEEDBACK_POSITIVE: 'feedback_positive',
  FEEDBACK_NEGATIVE: 'feedback_negative',

  // Browser automation
  BROWSER_JOB_STARTED: 'browser_job_started',
  BROWSER_JOB_COMPLETED: 'browser_job_completed',
  BROWSER_JOB_FAILED: 'browser_job_failed',

  // Sandbox execution
  SANDBOX_EXECUTED: 'sandbox_executed',
  SANDBOX_FAILED: 'sandbox_failed',

  // Signals
  SIGNAL_DETECTED: 'signal_detected',
  SIGNAL_ACTIONED: 'signal_actioned',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export const EVENT_SOURCES = {
  AUTONOMOUS_CYCLE: 'autonomous_cycle',
  USER_ACTION: 'user_action',
  WEBHOOK: 'webhook',
  BROWSER_AUTOMATION: 'browser_automation',
  SANDBOX: 'sandbox',
  EMAIL_PROVIDER: 'email_provider',
  GMAIL_POLLER: 'gmail_poller',
  CRON: 'cron',
} as const;

export type EventSource = (typeof EVENT_SOURCES)[keyof typeof EVENT_SOURCES];

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Capture a single warehouse event
 */
export async function captureEvent(
  tenantId: string,
  event: WarehouseEvent
): Promise<string> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('warehouse_events')
    .insert({
      tenant_id: tenantId,
      event_type: event.eventType,
      event_source: event.eventSource,
      source_id: event.sourceId,
      payload: event.payload,
      metadata: event.metadata || {},
      client_id: event.clientId,
      contact_id: event.contactId,
      order_id: event.orderId,
      deal_id: event.dealId,
      run_id: event.runId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[warehouse-writer] Failed to capture event:', error);
    throw new Error(`Failed to capture warehouse event: ${error.message}`);
  }

  return data.id;
}

/**
 * Capture multiple warehouse events in batch
 */
export async function captureEvents(
  tenantId: string,
  events: WarehouseEvent[]
): Promise<number> {
  if (events.length === 0) return 0;

  const supabase = createServiceRoleClient();

  const records = events.map((event) => ({
    tenant_id: tenantId,
    event_type: event.eventType,
    event_source: event.eventSource,
    source_id: event.sourceId,
    payload: event.payload,
    metadata: event.metadata || {},
    client_id: event.clientId,
    contact_id: event.contactId,
    order_id: event.orderId,
    deal_id: event.dealId,
    run_id: event.runId,
  }));

  const { data, error } = await supabase
    .from('warehouse_events')
    .insert(records)
    .select('id');

  if (error) {
    console.error('[warehouse-writer] Failed to capture batch events:', error);
    throw new Error(`Failed to capture batch events: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Query warehouse events with filtering options
 */
export async function queryEvents(
  tenantId: string,
  options: QueryOptions = {}
): Promise<WarehouseEventRecord[]> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('warehouse_events')
    .select('*')
    .eq('tenant_id', tenantId);

  // Apply filters
  if (options.eventType) {
    query = query.eq('event_type', options.eventType);
  }

  if (options.eventTypes && options.eventTypes.length > 0) {
    query = query.in('event_type', options.eventTypes);
  }

  if (options.eventSource) {
    query = query.eq('event_source', options.eventSource);
  }

  if (options.clientId) {
    query = query.eq('client_id', options.clientId);
  }

  if (options.contactId) {
    query = query.eq('contact_id', options.contactId);
  }

  if (options.orderId) {
    query = query.eq('order_id', options.orderId);
  }

  if (options.dealId) {
    query = query.eq('deal_id', options.dealId);
  }

  if (options.runId) {
    query = query.eq('run_id', options.runId);
  }

  if (options.startDate) {
    query = query.gte('occurred_at', options.startDate.toISOString());
  }

  if (options.endDate) {
    query = query.lte('occurred_at', options.endDate.toISOString());
  }

  if (options.processed !== undefined) {
    if (options.processed) {
      query = query.not('processed_at', 'is', null);
    } else {
      query = query.is('processed_at', null);
    }
  }

  // Ordering
  const order = options.orderBy || 'desc';
  query = query.order('occurred_at', { ascending: order === 'asc' });

  // Pagination
  const limit = Math.min(options.limit || 100, 1000);
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('[warehouse-writer] Failed to query events:', error);
    throw new Error(`Failed to query warehouse events: ${error.message}`);
  }

  return (data || []).map(mapToEventRecord);
}

/**
 * Get events for a specific client
 */
export async function getClientEvents(
  tenantId: string,
  clientId: string,
  limit: number = 50
): Promise<WarehouseEventRecord[]> {
  return queryEvents(tenantId, { clientId, limit });
}

/**
 * Get events for a specific order
 */
export async function getOrderEvents(
  tenantId: string,
  orderId: string
): Promise<WarehouseEventRecord[]> {
  return queryEvents(tenantId, { orderId, limit: 100 });
}

/**
 * Get events for a specific deal
 */
export async function getDealEvents(
  tenantId: string,
  dealId: string
): Promise<WarehouseEventRecord[]> {
  return queryEvents(tenantId, { dealId, limit: 100 });
}

/**
 * Get events from a specific autonomous run
 */
export async function getRunEvents(
  tenantId: string,
  runId: string
): Promise<WarehouseEventRecord[]> {
  return queryEvents(tenantId, { runId, limit: 500 });
}

/**
 * Mark events as processed
 */
export async function markEventsProcessed(
  eventIds: string[]
): Promise<number> {
  if (eventIds.length === 0) return 0;

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('warehouse_events')
    .update({ processed_at: new Date().toISOString() })
    .in('id', eventIds)
    .select('id');

  if (error) {
    console.error('[warehouse-writer] Failed to mark events processed:', error);
    throw new Error(`Failed to mark events processed: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Get unprocessed events for insight generation
 */
export async function getUnprocessedEvents(
  tenantId: string,
  limit: number = 500
): Promise<WarehouseEventRecord[]> {
  return queryEvents(tenantId, { processed: false, limit });
}

/**
 * Get event statistics for a tenant
 */
export async function getEventStats(
  tenantId: string,
  days: number = 30
): Promise<EventStats> {
  const supabase = createServiceRoleClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get total events
  const { count: totalEvents } = await supabase
    .from('warehouse_events')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('occurred_at', startDate.toISOString());

  // Get events by type
  const { data: typeData } = await supabase
    .from('warehouse_events')
    .select('event_type')
    .eq('tenant_id', tenantId)
    .gte('occurred_at', startDate.toISOString());

  const eventsByType: Record<string, number> = {};
  (typeData || []).forEach((row) => {
    eventsByType[row.event_type] = (eventsByType[row.event_type] || 0) + 1;
  });

  // Get events by source
  const { data: sourceData } = await supabase
    .from('warehouse_events')
    .select('event_source')
    .eq('tenant_id', tenantId)
    .gte('occurred_at', startDate.toISOString());

  const eventsBySource: Record<string, number> = {};
  (sourceData || []).forEach((row) => {
    eventsBySource[row.event_source] = (eventsBySource[row.event_source] || 0) + 1;
  });

  // Get today's events
  const { count: eventsToday } = await supabase
    .from('warehouse_events')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('occurred_at', today.toISOString());

  // Get unprocessed count
  const { count: unprocessedCount } = await supabase
    .from('warehouse_events')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .is('processed_at', null);

  return {
    totalEvents: totalEvents || 0,
    eventsByType,
    eventsBySource,
    eventsToday: eventsToday || 0,
    unprocessedCount: unprocessedCount || 0,
  };
}

/**
 * Get events in a time window for pattern detection
 */
export async function getEventsInWindow(
  tenantId: string,
  eventTypes: string[],
  windowHours: number
): Promise<WarehouseEventRecord[]> {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - windowHours);

  return queryEvents(tenantId, {
    eventTypes,
    startDate,
    limit: 1000,
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapToEventRecord(row: Record<string, unknown>): WarehouseEventRecord {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    eventType: row.event_type as string,
    eventSource: row.event_source as string,
    sourceId: row.source_id as string | undefined,
    payload: row.payload as Record<string, unknown>,
    metadata: row.metadata as Record<string, unknown>,
    clientId: row.client_id as string | undefined,
    contactId: row.contact_id as string | undefined,
    orderId: row.order_id as string | undefined,
    dealId: row.deal_id as string | undefined,
    runId: row.run_id as string | undefined,
    occurredAt: row.occurred_at as string,
    processedAt: row.processed_at as string | null,
    eventDay: row.event_day as string,
    createdAt: row.created_at as string,
  };
}

// ============================================================================
// Convenience Capture Functions
// ============================================================================

/**
 * Capture an order event
 */
export async function captureOrderEvent(
  tenantId: string,
  eventType: EventType,
  orderId: string,
  payload: Record<string, unknown>,
  options?: { clientId?: string; runId?: string }
): Promise<string> {
  return captureEvent(tenantId, {
    eventType,
    eventSource: EVENT_SOURCES.AUTONOMOUS_CYCLE,
    sourceId: orderId,
    payload,
    orderId,
    clientId: options?.clientId,
    runId: options?.runId,
  });
}

/**
 * Capture a deal event
 */
export async function captureDealEvent(
  tenantId: string,
  eventType: EventType,
  dealId: string,
  payload: Record<string, unknown>,
  options?: { clientId?: string; contactId?: string; runId?: string }
): Promise<string> {
  return captureEvent(tenantId, {
    eventType,
    eventSource: EVENT_SOURCES.AUTONOMOUS_CYCLE,
    sourceId: dealId,
    payload,
    dealId,
    clientId: options?.clientId,
    contactId: options?.contactId,
    runId: options?.runId,
  });
}

/**
 * Capture an email event
 */
export async function captureEmailEvent(
  tenantId: string,
  eventType: EventType,
  emailId: string,
  payload: Record<string, unknown>,
  options?: { clientId?: string; contactId?: string; orderId?: string; runId?: string }
): Promise<string> {
  return captureEvent(tenantId, {
    eventType,
    eventSource: EVENT_SOURCES.EMAIL_PROVIDER,
    sourceId: emailId,
    payload,
    clientId: options?.clientId,
    contactId: options?.contactId,
    orderId: options?.orderId,
    runId: options?.runId,
  });
}

/**
 * Capture a card execution event
 */
export async function captureCardEvent(
  tenantId: string,
  eventType: EventType,
  cardId: string,
  payload: Record<string, unknown>,
  options?: { clientId?: string; contactId?: string; orderId?: string; dealId?: string; runId?: string }
): Promise<string> {
  return captureEvent(tenantId, {
    eventType,
    eventSource: EVENT_SOURCES.AUTONOMOUS_CYCLE,
    sourceId: cardId,
    payload,
    clientId: options?.clientId,
    contactId: options?.contactId,
    orderId: options?.orderId,
    dealId: options?.dealId,
    runId: options?.runId,
  });
}

/**
 * Capture a cycle event
 */
export async function captureCycleEvent(
  tenantId: string,
  eventType: EventType,
  runId: string,
  payload: Record<string, unknown>
): Promise<string> {
  return captureEvent(tenantId, {
    eventType,
    eventSource: EVENT_SOURCES.CRON,
    sourceId: runId,
    payload,
    runId,
  });
}
