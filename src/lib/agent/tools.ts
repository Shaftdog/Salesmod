import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { searchRAG } from './rag';
import { calculateGoalProgress } from '@/hooks/use-goals';
import { searchWeb as webSearchFunction } from '../research/web-search';
import {
  executeComputerUseTask,
  researchCompetitorPricing,
  deepCompanyResearch,
  isComputerUseAvailable,
  getComputerUseStatus
} from './computer-use';

/**
 * Agent tools for conversational interaction
 */
export const agentTools: any = {
  /**
   * Search for clients
   */
  searchClients: (tool as any)({
    description: 'Search for clients by name, email, or other criteria. Use this when user asks about specific clients or wants to find clients.',
    parameters: z.object({
      query: z.string().min(1).describe('Search term (company name, contact name, email, etc.)'),
    }),
    execute: async ({ query }: { query: string }) => {
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
  } as any),

  /**
   * Search for contacts
   */
  searchContacts: (tool as any)({
    description: 'Search for individual contacts by name, email, title, or other criteria. Use this when user asks about specific people or wants to find contacts.',
    parameters: z.object({
      query: z.string().min(1).describe('Search term (first name, last name, email, title, etc.)'),
      clientId: z.string().optional().describe('Optional: filter by specific client UUID'),
    }),
    execute: async ({ query, clientId }: { query: string; clientId?: string }) => {
      const supabase = await createClient();

      let queryBuilder = supabase
        .from('contacts')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          title,
          is_primary,
          client_id,
          client:clients(
            id,
            company_name
          ),
          created_at
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,title.ilike.%${query}%`)
        .limit(10);

      if (clientId) {
        queryBuilder = queryBuilder.eq('client_id', clientId);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        return { error: error.message };
      }

      return {
        contacts: (data || []).map((contact: any) => ({
          id: contact.id,
          name: `${contact.first_name} ${contact.last_name}`,
          firstName: contact.first_name,
          lastName: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          title: contact.title,
          isPrimary: contact.is_primary,
          client: contact.client ? {
            id: contact.client.id,
            name: contact.client.company_name,
          } : null,
          createdAt: contact.created_at,
        })),
        count: data?.length || 0,
      };
    },
  } as any),

  /**
   * Get current goals and progress
   */
  getGoals: (tool as any)({
    description: 'Get active goals and their current progress. Use this when user asks about goals, targets, or performance.',
    parameters: z.object({}),
    execute: async (): Promise<any> => {
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
          createdBy: goal.created_by || user.id,
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

        const progress = calculateGoalProgress(goalObj, orders || [], deals || undefined, clients || undefined);
        
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
  } as any),

  /**
   * Create an action card
   */
  createCard: (tool as any)({
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
    execute: async (params: any) => {
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
  } as any),

  /**
   * Search knowledge base (RAG)
   */
  searchKnowledge: (tool as any)({
    description: 'Search the knowledge base for relevant information about clients, activities, notes, or past interactions. Use this to find specific information.',
    parameters: z.object({
      query: z.string().describe('What to search for'),
      limit: z.number().optional().default(5).describe('Maximum results to return'),
    }),
    execute: async ({ query, limit }: { query: string; limit?: number }) => {
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
  } as any),

  /**
   * Get recent activity for a client
   */
  getClientActivity: (tool as any)({
    description: 'Get recent activity and interaction history for a specific client.',
    parameters: z.object({
      clientId: z.string().describe('Client UUID'),
      limit: z.number().optional().default(10),
    }),
    execute: async ({ clientId, limit = 10 }: { clientId: string; limit?: number }) => {
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
  } as any),

  /**
   * Get pending action cards
   */
  getPendingCards: (tool as any)({
    description: 'Get pending action cards that need review or approval. Use when user asks "what\'s pending?" or "what needs my attention?"',
    parameters: z.object({
      state: z.enum(['suggested', 'in_review', 'approved']).optional(),
    }),
    execute: async ({ state }: { state?: 'suggested' | 'in_review' | 'approved' }) => {
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
  } as any),

  /**
   * Get agent run history
   */
  getRunHistory: (tool as any)({
    description: 'Get recent agent run history and performance metrics.',
    parameters: z.object({
      limit: z.number().optional().default(5),
    }),
    execute: async ({ limit = 5 }: { limit?: number }) => {
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
  } as any),

  /**
   * Search the web
   */
  searchWeb: (tool as any)({
    description: 'Search the internet for information about companies, people, news, or any topic. Use this when the user asks you to search for something or when you need external information not available in the database.',
    parameters: z.object({
      query: z.string().describe('Search query - what to look up on the internet'),
      maxResults: z.number().optional().default(5).describe('Maximum number of results to return'),
    }),
    execute: async ({ query, maxResults }: { query: string; maxResults?: number }) => {
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
  } as any),

  /**
   * Computer Use - Visual research task
   */
  computerUseTask: (tool as any)({
    description: 'Execute a computer use task for visual research. Use this for: browsing websites visually, extracting data from web pages, competitive research, or any task requiring actual web browsing. This is more expensive and slower than APIs, so only use when necessary.',
    parameters: z.object({
      instruction: z.string().describe('Detailed instruction for what to do (e.g., "Go to competitor.com and extract all pricing information")'),
      maxSteps: z.number().optional().default(15).describe('Maximum steps to execute (default: 15)'),
    }),
    execute: async ({ instruction, maxSteps }: { instruction: string; maxSteps?: number }) => {
      // Check if computer use is available
      const status = getComputerUseStatus();
      if (!status.available) {
        return {
          error: `Computer Use is not available: ${status.reason}`,
          message: 'Computer Use requires additional infrastructure setup.',
          requirements: status.requirements,
          available: false,
        };
      }

      try {
        const result = await executeComputerUseTask({
          instruction,
          maxSteps,
        });

        return {
          success: result.success,
          output: result.finalOutput,
          steps: result.steps,
          screenshots: result.screenshots?.length || 0,
          error: result.error,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Computer Use task failed',
        };
      }
    },
  } as any),

  /**
   * Research competitor pricing
   */
  researchCompetitorPricing: (tool as any)({
    description: 'Research competitor pricing by visiting their website and extracting pricing information. Returns structured pricing data.',
    parameters: z.object({
      competitorUrl: z.string().describe('URL of the competitor website'),
    }),
    execute: async ({ competitorUrl }: { competitorUrl: string }) => {
      const status = getComputerUseStatus();
      if (!status.available) {
        return {
          error: `Computer Use is not available: ${status.reason}`,
          available: false,
        };
      }

      try {
        const result = await researchCompetitorPricing(competitorUrl);
        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          pricing: [],
          analysis: 'Failed to research competitor pricing',
        };
      }
    },
  } as any),

  /**
   * Deep company research
   */
  deepCompanyResearch: (tool as any)({
    description: 'Perform deep research on a company by browsing their website and gathering information. Returns a comprehensive report.',
    parameters: z.object({
      companyName: z.string().describe('Name of the company to research'),
      companyWebsite: z.string().optional().describe('Company website URL (optional, will search if not provided)'),
    }),
    execute: async ({ companyName, companyWebsite }: { companyName: string; companyWebsite?: string }) => {
      const status = getComputerUseStatus();
      if (!status.available) {
        return {
          error: `Computer Use is not available: ${status.reason}`,
          available: false,
          report: null,
        };
      }

      try {
        const report = await deepCompanyResearch(companyName, companyWebsite);
        return {
          success: true,
          company: companyName,
          report,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          company: companyName,
          report: null,
        };
      }
    },
  } as any),

  /**
   * Check Computer Use availability
   */
  checkComputerUseStatus: (tool as any)({
    description: 'Check if Computer Use capabilities are available and properly configured.',
    parameters: z.object({}),
    execute: async () => {
      const status = getComputerUseStatus();
      return {
        available: status.available,
        reason: status.reason,
        requirements: status.requirements,
        message: status.available
          ? 'Computer Use is available and ready to use'
          : `Computer Use is not available: ${status.reason}`,
      };
    },
  } as any),
};

