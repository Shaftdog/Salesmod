/**
 * Contact merge utilities
 * Handles merging duplicate contacts when standardization reveals same person
 */

import { Contact } from './types';
import { SupabaseClient } from '@supabase/supabase-js';

export interface ContactMergeResult {
  merged: boolean;
  winnerContact: Contact;
  counts: {
    activities: number;
    emailSuppressions: number;
    emailNotifications: number;
    kanbanCards: number;
    deals: number;
    tasks: number;
    cases: number;
    companyHistory: number;
  };
  deletedContactId: string;
}

export interface DuplicateContact {
  contact1Id: string;
  contact1Name: string;
  contact1Email: string | null;
  contact2Id: string;
  contact2Name: string;
  contact2Email: string | null;
  matchType: 'exact_email' | 'similar_name_same_client';
  similarityScore: number;
}

/**
 * Merge two contacts into one canonical contact
 * Uses database function to atomically re-link all dependent records
 *
 * @param supabase - Supabase client
 * @param winnerId - Contact ID to keep
 * @param loserId - Contact ID to delete
 * @returns Merge result with winner contact and counts
 */
export async function mergeContacts(
  supabase: SupabaseClient,
  winnerId: string,
  loserId: string
): Promise<ContactMergeResult> {
  try {
    // Call database merge function
    const { data, error } = await supabase.rpc('merge_contacts', {
      p_winner_id: winnerId,
      p_loser_id: loserId,
    });

    if (error) {
      throw new Error(`Failed to merge contacts: ${error.message}`);
    }

    if (!data || !data.success) {
      throw new Error('Contact merge failed');
    }

    // Fetch updated winner contact
    const { data: winnerContact, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', winnerId)
      .single();

    if (fetchError || !winnerContact) {
      throw new Error('Failed to fetch merged contact');
    }

    return {
      merged: true,
      winnerContact,
      counts: {
        activities: data.counts.activities || 0,
        emailSuppressions: data.counts.email_suppressions || 0,
        emailNotifications: data.counts.email_notifications || 0,
        kanbanCards: data.counts.kanban_cards || 0,
        deals: data.counts.deals || 0,
        tasks: data.counts.tasks || 0,
        cases: data.counts.cases || 0,
        companyHistory: data.counts.company_history || 0,
      },
      deletedContactId: loserId,
    };
  } catch (error: any) {
    console.error('Contact merge error:', error);
    throw error;
  }
}

/**
 * Find potential duplicate contacts in an organization
 * Returns contacts that might be duplicates for review
 *
 * @param supabase - Supabase client
 * @param orgId - Organization ID to search within
 * @param limit - Maximum number of duplicate pairs to return
 * @returns Array of potential duplicate contact pairs
 */
export async function findDuplicateContacts(
  supabase: SupabaseClient,
  orgId: string,
  limit: number = 50
): Promise<DuplicateContact[]> {
  try {
    const { data, error } = await supabase.rpc('find_duplicate_contacts', {
      p_org_id: orgId,
      p_limit: limit,
    });

    if (error) {
      throw new Error(`Failed to find duplicate contacts: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      contact1Id: row.contact1_id,
      contact1Name: row.contact1_name,
      contact1Email: row.contact1_email,
      contact2Id: row.contact2_id,
      contact2Name: row.contact2_name,
      contact2Email: row.contact2_email,
      matchType: row.match_type,
      similarityScore: parseFloat(row.similarity_score),
    }));
  } catch (error: any) {
    console.error('Find duplicate contacts error:', error);
    throw error;
  }
}

/**
 * Determine which contact should be the winner in a merge
 * Priority: 1) More activities, 2) Older, 3) Has email
 */
export function selectContactMergeWinner(
  contact1: Contact & { activityCount?: number },
  contact2: Contact & { activityCount?: number }
): { winnerId: string; loserId: string } {
  // More activities wins
  if ((contact1.activityCount || 0) > (contact2.activityCount || 0)) {
    return { winnerId: contact1.id, loserId: contact2.id };
  }
  if ((contact2.activityCount || 0) > (contact1.activityCount || 0)) {
    return { winnerId: contact2.id, loserId: contact1.id };
  }

  // Has email wins
  if (contact1.email && !contact2.email) {
    return { winnerId: contact1.id, loserId: contact2.id };
  }
  if (contact2.email && !contact1.email) {
    return { winnerId: contact2.id, loserId: contact1.id };
  }

  // Older contact wins
  const created1 = new Date(contact1.createdAt).getTime();
  const created2 = new Date(contact2.createdAt).getTime();

  if (created1 < created2) {
    return { winnerId: contact1.id, loserId: contact2.id };
  }

  return { winnerId: contact2.id, loserId: contact1.id };
}

/**
 * Get contact with activity count for merge decision
 */
export async function getContactWithActivityCount(
  supabase: SupabaseClient,
  contactId: string
): Promise<Contact & { activityCount: number }> {
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (contactError || !contact) {
    throw new Error('Contact not found');
  }

  const { count } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('contact_id', contactId);

  return {
    ...contact,
    activityCount: count || 0,
  };
}
