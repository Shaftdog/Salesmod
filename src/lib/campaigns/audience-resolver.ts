/**
 * Audience Resolver
 * Resolves target segment to list of recipients
 */

import { createClient } from '@/lib/supabase/server';
import type { TargetSegment, Recipient } from './types';
import { daysSince } from './merge-tokens';

// =====================================================
// Main Resolver
// =====================================================

/**
 * Resolve target segment to list of recipients
 * CRITICAL: Excludes suppressed emails and validates email addresses
 */
export async function resolveTargetSegment(
  segment: TargetSegment,
  orgId: string
): Promise<Recipient[]> {
  const supabase = await createClient();

  // Get suppression list first
  const { data: suppressions } = await supabase
    .from('email_suppressions')
    .select('email_address')
    .eq('org_id', orgId);

  const suppressedEmails = new Set(
    (suppressions || []).map(s => s.email_address.toLowerCase())
  );

  let recipients: Recipient[] = [];

  if (segment.type === 'n8n_list') {
    // Fetch from N8n list
    recipients = await fetchN8nList(segment.n8n_list_id!);
  } else {
    // Build query from filters
    recipients = await resolveFromFilters(segment.filters!, orgId);
  }

  // CRITICAL: Filter out recipients with no email
  recipients = recipients.filter(r => r.email && r.email.trim().length > 0);

  // CRITICAL: Filter out suppressed emails
  const filtered = recipients.filter(r =>
    !suppressedEmails.has(r.email.toLowerCase())
  );

  console.log(`[Audience Resolver] Resolution complete:
    - ${recipients.length} total from filters
    - ${recipients.length - filtered.length} suppressed/invalid
    - ${filtered.length} final recipients
  `);

  return filtered;
}

// =====================================================
// Filter-Based Resolution
// =====================================================

async function resolveFromFilters(
  filters: any,
  orgId: string
): Promise<Recipient[]> {
  const supabase = await createClient();

  // Build SQL query from filters
  let query = supabase
    .from('clients')
    .select(`
      id,
      company_name,
      email,
      is_active,
      contacts (
        id,
        first_name,
        last_name,
        email,
        is_primary
      ),
      orders (
        id,
        created_at,
        status
      )
    `);

  // Apply filters
  if (filters.client_types?.length > 0) {
    // Note: You may need to add a 'type' column to clients table
    // For now, this is a placeholder
    // query = query.in('type', filters.client_types);
  }

  if (filters.tags?.length > 0) {
    // Note: You may need to add a 'tags' column to clients table
    // query = query.contains('tags', filters.tags);
  }

  if (filters.states?.length > 0) {
    // Note: You may need to extract state from address or add state column
    // For now, this is a placeholder
  }

  const { data: clients, error } = await query;

  if (error) {
    console.error('[Audience Resolver] Query error:', error);
    throw new Error(`Failed to resolve audience: ${error.message}`);
  }

  if (!clients || clients.length === 0) {
    return [];
  }

  // Post-process for order date filters
  let filtered = clients;

  if (filters.last_order_days_ago_min || filters.last_order_days_ago_max) {
    filtered = clients.filter(client => {
      // Sort orders by date DESC to get most recent
      const orders = (client.orders || [])
        .filter((o: any) => o.status !== 'cancelled')
        .sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      const lastOrder = orders[0]?.created_at;
      if (!lastOrder) return false;

      const daysAgo = daysSince(lastOrder);

      if (filters.last_order_days_ago_min && daysAgo < filters.last_order_days_ago_min) {
        return false;
      }
      if (filters.last_order_days_ago_max && daysAgo > filters.last_order_days_ago_max) {
        return false;
      }

      return true;
    });
  }

  // Map to recipients
  const recipients: Recipient[] = [];

  for (const client of filtered) {
    const contacts = client.contacts || [];

    // If client has contacts, use them
    if (contacts.length > 0) {
      for (const contact of contacts) {
        // Calculate stats
        const orders = (client.orders || []).filter((o: any) => o.status !== 'cancelled');
        const sortedOrders = [...orders].sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lastOrderDate = sortedOrders[0]?.created_at || null;

        recipients.push({
          contact_id: contact.id,
          client_id: client.id,
          email: contact.email || client.email,
          first_name: contact.first_name,
          last_name: contact.last_name,
          company_name: client.company_name,
          last_order_date: lastOrderDate,
          days_since_last_order: lastOrderDate ? daysSince(lastOrderDate) : null,
        });
      }
    } else {
      // No contacts, use client email
      const orders = (client.orders || []).filter((o: any) => o.status !== 'cancelled');
      const sortedOrders = [...orders].sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const lastOrderDate = sortedOrders[0]?.created_at || null;

      recipients.push({
        contact_id: null,
        client_id: client.id,
        email: client.email,
        first_name: null,
        last_name: null,
        company_name: client.company_name,
        last_order_date: lastOrderDate,
        days_since_last_order: lastOrderDate ? daysSince(lastOrderDate) : null,
      });
    }
  }

  return recipients;
}

// =====================================================
// N8n Integration
// =====================================================

async function fetchN8nList(listId: string): Promise<Recipient[]> {
  // TODO: Implement N8n API integration
  // For now, return empty array
  console.warn('[Audience Resolver] N8n integration not yet implemented');
  return [];
}

// =====================================================
// Preview Helpers
// =====================================================

/**
 * Get audience count without fetching all recipients
 */
export async function getAudienceCount(
  segment: TargetSegment,
  orgId: string
): Promise<number> {
  const recipients = await resolveTargetSegment(segment, orgId);
  return recipients.length;
}

/**
 * Get sample recipients for preview
 */
export async function getAudienceSample(
  segment: TargetSegment,
  orgId: string,
  limit: number = 5
): Promise<Recipient[]> {
  const recipients = await resolveTargetSegment(segment, orgId);
  return recipients.slice(0, limit);
}
