import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { searchRAG } from './rag';
import { calculateGoalProgress } from '@/hooks/use-goals';
import { searchWeb as webSearchFunction } from '../research/web-search';

/**
 * Agent tools for conversational interaction
 */
export const agentTools = {
  /**
   * Search for clients
   */
  searchClients: tool({
    description: 'Search for clients by name, email, or other criteria. Use this when user asks about specific clients or wants to find clients.',
    parameters: z.object({
      query: z.string().min(1).describe('Search term (company name, contact name, email, etc.)'),
    }).strict(),
    execute: async ({ query }) => {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          company_name,
          primary_contact,
          email,
          phone,
          is_active,
          created_at
        `)
        .or(`company_name.ilike.%${query}%,primary_contact.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(10);

      if (error) {
        return { error: error.message };
      }

      return {
        clients: data || [],
        count: data?.length || 0,
      };
    },
  }),

  /**
   * Get current goals and progress
   */
  getGoals: tool({
    description: 'Get active goals and their current progress. Use this when user asks about goals, targets, or performance.',
    parameters: z.object({}),
    execute: async () => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('is_active', true)
        .order('period_start', { ascending: false });

      if (goalsError) {
        return { error: goalsError.message };
      }

      // Get orders and deals for progress calculation
      const { data: orders } = await supabase.from('orders').select('*');
      const { data: deals } = await supabase.from('deals').select('*');
      const { data: clients } = await supabase.from('clients').select('*');

      const goalsWithProgress = (goals || []).map((goal: any) => {
        const goalObj = {
          id: goal.id,
          metricType: goal.metric_type,
          targetValue: parseFloat(goal.target_value),
          periodType: goal.period_type,
          periodStart: goal.period_start,
          periodEnd: goal.period_end,
          description: goal.description,
          isActive: goal.is_active,
          createdAt: goal.created_at,
          updatedAt: goal.updated_at,
        };

        const progress = calculateGoalProgress(goalObj, orders || [], deals, clients);
        
        return {
          ...goalObj,
          currentValue: progress.currentValue,
          progress: progress.progress,
          isOnTrack: progress.isOnTrack,
          daysRemaining: progress.daysRemaining,
          gap: goalObj.targetValue - progress.currentValue,
        };
      });

      return {
        goals: goalsWithProgress,
        summary: {
          total: goalsWithProgress.length,
          onTrack: goalsWithProgress.filter((g: any) => g.isOnTrack).length,
          behind: goalsWithProgress.filter((g: any) => !g.isOnTrack).length,
        },
      };
    },
  }),

  /**
   * Create an action card
   */
  createCard: tool({
    description: 'Create a new action card on the Kanban board. Use this when user requests to create a task, draft an email, or propose an action. For calls/meetings, create a task instead.',
    parameters: z.object({
      type: z.enum(['send_email', 'create_task', 'create_deal', 'follow_up', 'research']),
      clientId: z.string().describe('UUID of the client'),
      title: z.string().describe('Brief title for the action'),
      rationale: z.string().describe('Why this action is recommended'),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
      emailDraft: z.object({
        to: z.string(),
        subject: z.string(),
        body: z.string().describe('HTML email body'),
      }).optional(),
      taskDetails: z.object({
        description: z.string(),
        dueDate: z.string().optional(),
      }).optional(),
    }),
    execute: async (params) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      // Build action payload
      let actionPayload: any = {};
      if (params.emailDraft) {
        actionPayload = params.emailDraft;
      } else if (params.taskDetails) {
        actionPayload = params.taskDetails;
      }

      const { data, error } = await supabase
        .from('kanban_cards')
        .insert({
          org_id: user.id,
          client_id: params.clientId,
          type: params.type,
          title: params.title,
          rationale: params.rationale,
          priority: params.priority,
          state: 'suggested',
          action_payload: actionPayload,
          created_by: user.id, // User created via chat
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

  /**
   * Search knowledge base (RAG)
   */
  searchKnowledge: tool({
    description: 'Search the knowledge base for relevant information about clients, activities, notes, or past interactions. Use this to find specific information.',
    parameters: z.object({
      query: z.string().describe('What to search for'),
      limit: z.number().optional().default(5).describe('Maximum results to return'),
    }),
    execute: async ({ query, limit }) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      const results = await searchRAG(user.id, query, limit);

      return {
        results: results.map(r => ({
          title: r.title,
          content: r.content.substring(0, 300) + '...', // Truncate for chat
          source: r.source,
          similarity: Math.round(r.similarity * 100),
        })),
        count: results.length,
      };
    },
  }),

  /**
   * Get recent activity for a client
   */
  getClientActivity: tool({
    description: 'Get recent activity and interaction history for a specific client.',
    parameters: z.object({
      clientId: z.string().describe('Client UUID'),
      limit: z.number().optional().default(10),
    }),
    execute: async ({ clientId, limit }) => {
      const supabase = await createClient();

      const { data: activities, error } = await supabase
        .from('activities')
        .select(`
          id,
          activity_type,
          subject,
          description,
          status,
          outcome,
          created_at,
          scheduled_at
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { error: error.message };
      }

      return {
        activities: activities || [],
        count: activities?.length || 0,
      };
    },
  }),

  /**
   * Get pending action cards
   */
  getPendingCards: tool({
    description: 'Get pending action cards that need review or approval. Use when user asks "what\'s pending?" or "what needs my attention?"',
    parameters: z.object({
      state: z.enum(['suggested', 'in_review', 'approved']).optional(),
    }),
    execute: async ({ state }) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      let query = supabase
        .from('kanban_cards')
        .select(`
          id,
          type,
          title,
          state,
          priority,
          rationale,
          created_at,
          client:clients(company_name)
        `)
        .eq('org_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (state) {
        query = query.eq('state', state);
      } else {
        query = query.in('state', ['suggested', 'in_review', 'approved']);
      }

      const { data, error } = await query;

      if (error) {
        return { error: error.message };
      }

      return {
        cards: data || [],
        count: data?.length || 0,
      };
    },
  }),

  /**
   * Get agent run history
   */
  getRunHistory: tool({
    description: 'Get recent agent run history and performance metrics.',
    parameters: z.object({
      limit: z.number().optional().default(5),
    }),
    execute: async ({ limit }) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('org_id', user.id)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { error: error.message };
      }

      return {
        runs: data || [],
        count: data?.length || 0,
      };
    },
  }),

  /**
   * Search the web
   */
  searchWeb: tool({
    description: 'Search the internet for information about companies, people, news, or any topic. Use this when the user asks you to search for something or when you need external information not available in the database.',
    parameters: z.object({
      query: z.string().describe('Search query - what to look up on the internet'),
      maxResults: z.number().optional().default(5).describe('Maximum number of results to return'),
    }),
    execute: async ({ query, maxResults }) => {
      try {
        const results = await webSearchFunction(query, maxResults);
        
        if (results.length === 0) {
          return {
            message: 'No search results found. Tavily API key may not be configured.',
            results: [],
            count: 0,
          };
        }

        return {
          results: results.map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.snippet,
            score: r.score,
          })),
          count: results.length,
          query,
        };
      } catch (error: any) {
        return {
          error: error.message,
          message: 'Web search failed. Check Tavily API key configuration.',
          results: [],
          count: 0,
        };
      }
    },
  }),
};

