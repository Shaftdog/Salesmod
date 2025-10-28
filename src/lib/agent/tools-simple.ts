import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Minimal tool set for testing
 */
export const simpleAgentTools = {
  createCard: tool({
    description: 'Create a new action card on the Kanban board',
    parameters: z.object({
      type: z.enum(['send_email', 'create_task', 'create_deal', 'follow_up', 'research']),
      title: z.string(),
      rationale: z.string(),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
      clientId: z.string().optional(),
    }),
    execute: async ({ type, title, rationale, priority, clientId }) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('kanban_cards')
        .insert({
          org_id: user.id,
          client_id: clientId || null,
          type,
          title,
          rationale,
          priority,
          state: 'suggested',
          action_payload: {},
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return {
        success: true,
        card: {
          id: data.id,
          title: data.title,
          type: data.type,
          state: data.state,
        },
      };
    },
  }),
};


