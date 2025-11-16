import { createClient } from '@/lib/supabase/server';
import { Contact, Client } from '@/lib/types';
import { LeadScore, LeadLabel, LeadSignals } from '@/lib/types/marketing';
import { PartyRoleCode } from '../roles/mapPartyRole';

/**
 * Calculate lead score for a contact
 */
export async function calculateLeadScore(
  contactId: string
): Promise<LeadScore | null> {
  const supabase = await createClient();

  // Fetch contact with related data
  const { data: contact, error } = await supabase
    .from('contacts')
    .select(`
      *,
      client:clients(*),
      activities:activities(*)
    `)
    .eq('id', contactId)
    .single();

  if (error || !contact) {
    console.error('Error fetching contact for scoring:', error);
    return null;
  }

  // Calculate score components
  const fitScore = calculateFitScore(contact);
  const engagementScore = await calculateEngagementScore(contact);
  const recencyScore = calculateRecencyScore(contact);
  const valueScore = calculateValueScore(contact.client);

  const totalScore = fitScore + engagementScore + recencyScore + valueScore;
  const label = getLeadLabel(totalScore);

  // Build signals object
  const signals = await buildLeadSignals(contact);

  // Upsert lead score
  const { data: leadScore, error: upsertError } = await supabase
    .from('lead_scores')
    .upsert({
      contact_id: contactId,
      fit_score: fitScore,
      engagement_score: engagementScore,
      recency_score: recencyScore,
      value_score: valueScore,
      total_score: totalScore,
      label: label,
      signals: signals,
      last_calculated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'contact_id'
    })
    .select()
    .single();

  if (upsertError) {
    console.error('Error upserting lead score:', upsertError);
    return null;
  }

  return leadScore as LeadScore;
}

/**
 * Calculate fit score (0-25 points)
 * Based on role, territory, company profile
 */
function calculateFitScore(contact: any): number {
  let score = 0;

  // Role-based scoring
  const roleScore = getRoleScore(contact.primary_role_code);
  score += roleScore;

  // Geographic fit (within target territory)
  // TODO: Implement territory matching
  // For now, add 5 points if client has address
  if (contact.client?.address) {
    score += 5;
  }

  // Company size/profile fit
  // TODO: Implement company profile scoring
  // For now, add points based on existing data
  if (contact.client?.active_orders && contact.client.active_orders > 0) {
    score += 5;
  }

  return Math.min(score, 25);
}

/**
 * Get score value for a role (0-15 points)
 */
function getRoleScore(roleCode: PartyRoleCode | null | undefined): number {
  if (!roleCode) return 0;

  // High-value roles (15 points)
  const highValueRoles: PartyRoleCode[] = [
    'mortgage_lender',
    'loan_officer',
    'qm_lender_contact',
    'non_qm_lender_contact',
    'amc_contact',
    'accredited_investor',
    'fund_manager',
    'registered_investment_advisor'
  ];
  if (highValueRoles.includes(roleCode)) return 15;

  // Medium-value roles (10 points)
  const mediumValueRoles: PartyRoleCode[] = [
    'realtor',
    'real_estate_broker',
    'investor',
    'real_estate_investor',
    'private_lender',
    'co_gp'
  ];
  if (mediumValueRoles.includes(roleCode)) return 10;

  // Low-value roles (5 points)
  const lowValueRoles: PartyRoleCode[] = [
    'buyer',
    'seller',
    'owner',
    'builder',
    'general_contractor'
  ];
  if (lowValueRoles.includes(roleCode)) return 5;

  // Unknown/other roles
  return 0;
}

/**
 * Calculate engagement score (0-50 points)
 * Based on email opens, clicks, website visits, content interactions
 */
async function calculateEngagementScore(contact: any): Promise<number> {
  let score = 0;

  // Email engagement (0-20 points)
  const emailActivities = contact.activities?.filter(
    (a: any) => a.activity_type === 'email' && a.status === 'completed'
  ) || [];
  const emailScore = Math.min(emailActivities.length * 2, 20);
  score += emailScore;

  // Meeting/call engagement (0-15 points)
  const meetingActivities = contact.activities?.filter(
    (a: any) => ['meeting', 'call'].includes(a.activity_type) && a.status === 'completed'
  ) || [];
  const meetingScore = Math.min(meetingActivities.length * 5, 15);
  score += meetingScore;

  // Other interactions (0-15 points)
  const otherActivities = contact.activities?.filter(
    (a: any) => !['email', 'meeting', 'call'].includes(a.activity_type)
  ) || [];
  const otherScore = Math.min(otherActivities.length * 3, 15);
  score += otherScore;

  return Math.min(score, 50);
}

/**
 * Calculate recency score (0-15 points)
 * Based on how recently they engaged
 */
function calculateRecencyScore(contact: any): number {
  const activities = contact.activities || [];
  if (activities.length === 0) return 0;

  // Find most recent activity
  const mostRecent = activities.reduce((latest: any, current: any) => {
    const latestDate = new Date(latest.created_at || latest.scheduled_at);
    const currentDate = new Date(current.created_at || current.scheduled_at);
    return currentDate > latestDate ? current : latest;
  });

  const daysSince = Math.floor(
    (Date.now() - new Date(mostRecent.created_at || mostRecent.scheduled_at).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  // Scoring based on recency
  if (daysSince <= 7) return 15;      // Last week
  if (daysSince <= 14) return 12;     // Last 2 weeks
  if (daysSince <= 30) return 10;     // Last month
  if (daysSince <= 60) return 7;      // Last 2 months
  if (daysSince <= 90) return 5;      // Last 3 months
  if (daysSince <= 180) return 3;     // Last 6 months
  return 0;                            // Older than 6 months
}

/**
 * Calculate value score (0-10 points)
 * Based on revenue, deal size, potential
 */
function calculateValueScore(client: any): number {
  if (!client) return 0;

  let score = 0;

  // Historical revenue (0-5 points)
  const revenue = parseFloat(client.total_revenue?.toString() || '0');
  if (revenue > 50000) score += 5;
  else if (revenue > 20000) score += 4;
  else if (revenue > 10000) score += 3;
  else if (revenue > 5000) score += 2;
  else if (revenue > 0) score += 1;

  // Order volume (0-5 points)
  const orders = client.active_orders || 0;
  if (orders >= 10) score += 5;
  else if (orders >= 5) score += 4;
  else if (orders >= 3) score += 3;
  else if (orders >= 1) score += 2;

  return Math.min(score, 10);
}

/**
 * Get lead label from total score
 */
function getLeadLabel(totalScore: number): LeadLabel {
  if (totalScore >= 75) return 'hot';
  if (totalScore >= 50) return 'warm';
  return 'cold';
}

/**
 * Build detailed signals object
 */
async function buildLeadSignals(contact: any): Promise<LeadSignals> {
  const activities = contact.activities || [];

  const emailActivities = activities.filter((a: any) => a.activity_type === 'email');
  const meetingActivities = activities.filter((a: any) =>
    ['meeting', 'call'].includes(a.activity_type)
  );

  // Find last engagement
  const lastActivity = activities.reduce((latest: any, current: any) => {
    if (!latest) return current;
    const latestDate = new Date(latest.created_at || latest.scheduled_at);
    const currentDate = new Date(current.created_at || current.scheduled_at);
    return currentDate > latestDate ? current : latest;
  }, null);

  return {
    emailOpens: emailActivities.length,
    emailClicks: 0, // TODO: Track email clicks
    websiteVisits: 0, // TODO: Implement website tracking
    contentDownloads: 0, // TODO: Track content downloads
    webinarAttendance: 0, // TODO: Track webinar attendance
    socialInteractions: 0, // TODO: Track social interactions
    lastEngagement: lastActivity?.created_at || lastActivity?.scheduled_at,
    preferredChannels: emailActivities.length > 0 ? ['email'] : [],
    topicInterests: [], // TODO: Extract from activity descriptions
  };
}

/**
 * Recalculate scores for all contacts in an org
 */
export async function recalculateAllScores(orgId: string): Promise<number> {
  const supabase = await createClient();

  // Get all contacts for the org
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, client:clients!inner(org_id)')
    .eq('client.org_id', orgId);

  if (!contacts) return 0;

  let successCount = 0;

  // Calculate score for each contact
  for (const contact of contacts) {
    const score = await calculateLeadScore(contact.id);
    if (score) successCount++;
  }

  return successCount;
}

/**
 * Get top leads by score
 */
export async function getTopLeads(
  orgId: string,
  limit: number = 50
): Promise<LeadScore[]> {
  const supabase = await createClient();

  const { data: scores } = await supabase
    .from('lead_scores')
    .select(`
      *,
      contact:contacts!inner(
        *,
        client:clients!inner(org_id)
      )
    `)
    .eq('contact.client.org_id', orgId)
    .order('total_score', { ascending: false })
    .limit(limit);

  return (scores || []) as LeadScore[];
}

/**
 * Get hot leads (75+ score)
 */
export async function getHotLeads(orgId: string): Promise<LeadScore[]> {
  const supabase = await createClient();

  const { data: scores } = await supabase
    .from('lead_scores')
    .select(`
      *,
      contact:contacts!inner(
        *,
        client:clients!inner(org_id)
      )
    `)
    .eq('contact.client.org_id', orgId)
    .eq('label', 'hot')
    .order('total_score', { ascending: false });

  return (scores || []) as LeadScore[];
}
