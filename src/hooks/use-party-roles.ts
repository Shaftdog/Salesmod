'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { PartyRole } from '@/lib/types';
import { transformPartyRole } from '@/lib/supabase/transforms';

export function usePartyRoles() {
  return useQuery({
    queryKey: ['party-roles'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('party_roles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data ? data.map(transformPartyRole) : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (roles change rarely)
  });
}

export function useRolesByCategory() {
  const { data: roles, ...rest } = usePartyRoles();
  
  const grouped = roles?.reduce((acc, role) => {
    const category = role.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(role);
    return acc;
  }, {} as Record<string, PartyRole[]>);
  
  return { roles: grouped, ...rest };
}

