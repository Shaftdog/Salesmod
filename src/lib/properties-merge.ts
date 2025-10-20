/**
 * Property merge utilities
 * Handles merging duplicate properties when standardization reveals same building
 */

import { Property } from './types';

export interface PropertyMergeResult {
  merged: boolean;
  winnerProperty: Property;
  ordersRelinked: number;
  deletedPropertyId: string;
}

/**
 * Merge two properties into one canonical property
 * Re-links all orders from loser to winner, then deletes loser
 * 
 * @param supabase - Supabase client
 * @param winnerId - Property ID to keep (usually older/has more orders)
 * @param loserId - Property ID to delete
 * @returns Merge result with winner property and counts
 */
export async function mergeProperties(
  supabase: any,
  winnerId: string,
  loserId: string
): Promise<PropertyMergeResult> {
  try {
    // 1. Get both properties
    const { data: winner } = await supabase
      .from('properties')
      .select('*')
      .eq('id', winnerId)
      .single();

    const { data: loser } = await supabase
      .from('properties')
      .select('*')
      .eq('id', loserId)
      .single();

    if (!winner || !loser) {
      throw new Error('One or both properties not found');
    }

    // 2. Get orders linked to loser
    const { data: ordersToRelink } = await supabase
      .from('orders')
      .select('id, props')
      .eq('property_id', loserId);

    // 3. Re-link all orders from loser to winner
    const { error: relinkError } = await supabase
      .from('orders')
      .update({ property_id: winnerId })
      .eq('property_id', loserId);

    if (relinkError) {
      throw new Error(`Failed to re-link orders: ${relinkError.message}`);
    }

    // 4. Merge props JSONB
    const mergedProps = {
      ...winner.props,
      units_seen: Array.from(new Set([
        ...(winner.props?.units_seen || []),
        ...(loser.props?.units_seen || []),
      ])),
      merge_history: [
        ...(winner.props?.merge_history || []),
        {
          merged_property_id: loserId,
          merged_at: new Date().toISOString(),
          orders_relinked: ordersToRelink?.length || 0,
        },
      ],
    };

    // 5. Update winner with merged props
    const { data: updatedWinner, error: updateError } = await supabase
      .from('properties')
      .update({ props: mergedProps })
      .eq('id', winnerId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update winner: ${updateError.message}`);
    }

    // 6. Delete loser property
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', loserId);

    if (deleteError) {
      throw new Error(`Failed to delete loser property: ${deleteError.message}`);
    }

    return {
      merged: true,
      winnerProperty: updatedWinner,
      ordersRelinked: ordersToRelink?.length || 0,
      deletedPropertyId: loserId,
    };

  } catch (error: any) {
    console.error('Property merge error:', error);
    throw error;
  }
}

/**
 * Check if a property with given addr_hash already exists in org
 * Returns the existing property if found
 */
export async function findExistingProperty(
  supabase: any,
  orgId: string,
  addrHash: string,
  excludePropertyId?: string
): Promise<Property | null> {
  let query = supabase
    .from('properties')
    .select('*')
    .eq('org_id', orgId)
    .eq('addr_hash', addrHash);

  // Exclude current property if checking for duplicates
  if (excludePropertyId) {
    query = query.neq('id', excludePropertyId);
  }

  const { data } = await query.single();
  
  return data || null;
}

/**
 * Determine which property should be the winner in a merge
 * Priority: 1) More orders, 2) Older, 3) Better verification status
 */
export function selectMergeWinner(
  property1: Property & { orderCount?: number },
  property2: Property & { orderCount?: number }
): { winnerId: string; loserId: string } {
  // More orders wins
  if ((property1.orderCount || 0) > (property2.orderCount || 0)) {
    return { winnerId: property1.id, loserId: property2.id };
  }
  if ((property2.orderCount || 0) > (property1.orderCount || 0)) {
    return { winnerId: property2.id, loserId: property1.id };
  }

  // Older property wins
  const created1 = new Date(property1.createdAt).getTime();
  const created2 = new Date(property2.createdAt).getTime();
  
  if (created1 < created2) {
    return { winnerId: property1.id, loserId: property2.id };
  }
  
  return { winnerId: property2.id, loserId: property1.id };
}

