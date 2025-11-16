import { createClient } from '@/lib/supabase/server';
import { AudienceFilter } from '@/lib/types/marketing';
import { Contact } from '@/lib/types';

/**
 * Get contacts matching audience filter criteria
 */
export async function getAudienceContacts(
  orgId: string,
  filter: AudienceFilter
): Promise<Contact[]> {
  const supabase = await createClient();

  // Start with base query
  let query = supabase
    .from('contacts')
    .select(`
      *,
      client:clients!inner(
        *,
        client_tags:client_tags(
          tag:tags(*)
        )
      ),
      lead_score:lead_scores(*)
    `)
    .eq('client.org_id', orgId);

  // Filter by role codes
  if (filter.targetRoleCodes?.length) {
    query = query.in('primary_role_code', filter.targetRoleCodes);
  }

  // Filter by role categories (need to join party_roles)
  if (filter.targetRoleCategories?.length) {
    const { data: roles } = await supabase
      .from('party_roles')
      .select('code')
      .in('category', filter.targetRoleCategories);

    if (roles) {
      const roleCodes = roles.map(r => r.code);
      query = query.in('primary_role_code', roleCodes);
    }
  }

  // Exclude role codes
  if (filter.excludeRoleCodes?.length) {
    query = query.not('primary_role_code', 'in', filter.excludeRoleCodes);
  }

  const { data: contacts, error } = await query;

  if (error) {
    console.error('Error fetching audience contacts:', error);
    return [];
  }

  if (!contacts) return [];

  // Apply additional filters in application layer
  let filtered = contacts;

  // Filter by tags
  if (filter.includeTags?.length || filter.excludeTags?.length) {
    filtered = filtered.filter(contact => {
      const contactTags = contact.client?.client_tags?.map(ct => ct.tag?.name) || [];

      if (filter.includeTags?.length) {
        const hasRequiredTag = filter.includeTags.some(tag =>
          contactTags.includes(tag)
        );
        if (!hasRequiredTag) return false;
      }

      if (filter.excludeTags?.length) {
        const hasExcludedTag = filter.excludeTags.some(tag =>
          contactTags.includes(tag)
        );
        if (hasExcludedTag) return false;
      }

      return true;
    });
  }

  // Filter by lead score
  if (filter.minLeadScore !== undefined || filter.maxLeadScore !== undefined || filter.leadLabels?.length) {
    filtered = filtered.filter(contact => {
      const score = contact.lead_score?.total_score || 0;
      const label = contact.lead_score?.label;

      if (filter.minLeadScore !== undefined && score < filter.minLeadScore) return false;
      if (filter.maxLeadScore !== undefined && score > filter.maxLeadScore) return false;
      if (filter.leadLabels?.length && (!label || !filter.leadLabels.includes(label))) {
        return false;
      }

      return true;
    });
  }

  // Filter by activity
  if (filter.hasOrders !== undefined) {
    filtered = filtered.filter(contact => {
      const hasOrders = (contact.client?.active_orders || 0) > 0;
      return hasOrders === filter.hasOrders;
    });
  }

  if (filter.orderCountMin !== undefined) {
    filtered = filtered.filter(contact =>
      (contact.client?.active_orders || 0) >= filter.orderCountMin!
    );
  }

  if (filter.orderCountMax !== undefined) {
    filtered = filtered.filter(contact =>
      (contact.client?.active_orders || 0) <= filter.orderCountMax!
    );
  }

  if (filter.totalRevenueMin !== undefined) {
    filtered = filtered.filter(contact =>
      parseFloat(contact.client?.total_revenue?.toString() || '0') >= filter.totalRevenueMin!
    );
  }

  // Filter by last activity
  if (filter.lastActivityDays !== undefined) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filter.lastActivityDays);

    // This would require joining activities table - for now, skip
    // TODO: Implement activity-based filtering
  }

  // Filter by geography
  if (filter.states?.length) {
    filtered = filtered.filter(contact =>
      filter.states?.includes(contact.client?.address?.split(',').pop()?.trim() || '')
    );
  }

  return filtered as Contact[];
}

/**
 * Get estimated audience size
 */
export async function getAudienceSize(
  orgId: string,
  filter: AudienceFilter
): Promise<number> {
  const contacts = await getAudienceContacts(orgId, filter);
  return contacts.length;
}

/**
 * Validate audience filter
 */
export function validateAudienceFilter(filter: AudienceFilter): { valid: boolean; error?: string } {
  if (!filter.targetRoleCodes?.length && !filter.targetRoleCategories?.length) {
    return { valid: false, error: 'Must specify at least one target role or category' };
  }

  if (filter.minLeadScore !== undefined && (filter.minLeadScore < 0 || filter.minLeadScore > 100)) {
    return { valid: false, error: 'Lead score must be between 0 and 100' };
  }

  if (filter.maxLeadScore !== undefined && (filter.maxLeadScore < 0 || filter.maxLeadScore > 100)) {
    return { valid: false, error: 'Lead score must be between 0 and 100' };
  }

  if (
    filter.minLeadScore !== undefined &&
    filter.maxLeadScore !== undefined &&
    filter.minLeadScore > filter.maxLeadScore
  ) {
    return { valid: false, error: 'Min lead score cannot be greater than max lead score' };
  }

  return { valid: true };
}
