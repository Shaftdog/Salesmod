/**
 * Client merge utilities
 * Handles merging duplicate clients (companies)
 */

import { Client } from './types';
import { SupabaseClient } from '@supabase/supabase-js';

export interface ClientMergeResult {
  merged: boolean;
  winnerClient: Client;
  counts: {
    contacts: number;
    companyHistory: number;
    orders: number;
    properties: number;
    activities: number;
    deals: number;
    tasks: number;
    cases: number;
  };
  deletedClientId: string;
}

export interface DuplicateClient {
  client1Id: string;
  client1Name: string;
  client1Domain: string | null;
  client2Id: string;
  client2Name: string;
  client2Domain: string | null;
  matchType: 'exact_domain' | 'similar_name';
  similarityScore: number;
}

/**
 * Merge two clients into one canonical client
 * Uses database function to atomically transfer all contacts and related records
 *
 * @param supabase - Supabase client
 * @param winnerId - Client ID to keep
 * @param loserId - Client ID to delete
 * @returns Merge result with winner client and counts
 */
export async function mergeClients(
  supabase: SupabaseClient,
  winnerId: string,
  loserId: string
): Promise<ClientMergeResult> {
  try {
    // Call database merge function
    const { data, error } = await supabase.rpc('merge_clients', {
      p_winner_id: winnerId,
      p_loser_id: loserId,
    });

    if (error) {
      throw new Error(`Failed to merge clients: ${error.message}`);
    }

    if (!data || !data.success) {
      throw new Error('Client merge failed');
    }

    // Fetch updated winner client
    const { data: winnerClient, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', winnerId)
      .single();

    if (fetchError || !winnerClient) {
      throw new Error('Failed to fetch merged client');
    }

    return {
      merged: true,
      winnerClient,
      counts: {
        contacts: data.counts.contacts || 0,
        companyHistory: data.counts.company_history || 0,
        orders: data.counts.orders || 0,
        properties: data.counts.properties || 0,
        activities: data.counts.activities || 0,
        deals: data.counts.deals || 0,
        tasks: data.counts.tasks || 0,
        cases: data.counts.cases || 0,
      },
      deletedClientId: loserId,
    };
  } catch (error: any) {
    console.error('Client merge error:', error);
    throw error;
  }
}

/**
 * Find potential duplicate clients in an organization
 * Returns clients that might be duplicates for review
 *
 * @param supabase - Supabase client
 * @param orgId - Organization ID to search within
 * @param limit - Maximum number of duplicate pairs to return
 * @returns Array of potential duplicate client pairs
 */
export async function findDuplicateClients(
  supabase: SupabaseClient,
  orgId: string,
  limit: number = 50
): Promise<DuplicateClient[]> {
  try {
    const { data, error } = await supabase.rpc('find_duplicate_clients', {
      p_org_id: orgId,
      p_limit: limit,
    });

    if (error) {
      throw new Error(`Failed to find duplicate clients: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      client1Id: row.client1_id,
      client1Name: row.client1_name,
      client1Domain: row.client1_domain,
      client2Id: row.client2_id,
      client2Name: row.client2_name,
      client2Domain: row.client2_domain,
      matchType: row.match_type,
      similarityScore: parseFloat(row.similarity_score),
    }));
  } catch (error: any) {
    console.error('Find duplicate clients error:', error);
    throw error;
  }
}

/**
 * Determine which client should be the winner in a merge
 * Priority: 1) More orders, 2) More contacts, 3) Older
 */
export function selectClientMergeWinner(
  client1: Client & { orderCount?: number; contactCount?: number },
  client2: Client & { orderCount?: number; contactCount?: number }
): { winnerId: string; loserId: string } {
  // More orders wins
  if ((client1.orderCount || 0) > (client2.orderCount || 0)) {
    return { winnerId: client1.id, loserId: client2.id };
  }
  if ((client2.orderCount || 0) > (client1.orderCount || 0)) {
    return { winnerId: client2.id, loserId: client1.id };
  }

  // More contacts wins
  if ((client1.contactCount || 0) > (client2.contactCount || 0)) {
    return { winnerId: client1.id, loserId: client2.id };
  }
  if ((client2.contactCount || 0) > (client1.contactCount || 0)) {
    return { winnerId: client2.id, loserId: client1.id };
  }

  // Older client wins
  const created1 = new Date(client1.createdAt).getTime();
  const created2 = new Date(client2.createdAt).getTime();

  if (created1 < created2) {
    return { winnerId: client1.id, loserId: client2.id };
  }

  return { winnerId: client2.id, loserId: client1.id };
}

/**
 * Get client with order and contact counts for merge decision
 */
export async function getClientWithCounts(
  supabase: SupabaseClient,
  clientId: string
): Promise<Client & { orderCount: number; contactCount: number }> {
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    throw new Error('Client not found');
  }

  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);

  const { count: contactCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);

  return {
    ...client,
    orderCount: orderCount || 0,
    contactCount: contactCount || 0,
  };
}
