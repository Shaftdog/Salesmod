import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

// =============================================
// TYPES
// =============================================

export interface AgentRun {
  id: string;
  org_id: string;
  started_at: string;
  ended_at?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  mode: 'auto' | 'review';
  goal_pressure?: number;
  planned_actions: number;
  approved: number;
  sent: number;
  errors: any[];
}

export interface KanbanCard {
  id: string;
  org_id: string;
  run_id?: string;
  client_id: string;
  contact_id?: string;
  gmail_message_id?: string;
  gmail_thread_id?: string;
  email_category?: string;
  type: string;
  title: string;
  description?: string;
  rationale: string;
  priority: 'low' | 'medium' | 'high';
  state: 'suggested' | 'in_review' | 'approved' | 'executing' | 'done' | 'blocked' | 'rejected';
  action_payload: any;
  created_by?: string;
  approved_by?: string;
  executed_at?: string;
  due_at?: string;
  created_at: string;
  updated_at: string;
  // Relations
  client?: any;
  contact?: any;
}

export interface AgentSettings {
  id: string;
  org_id: string;
  mode: 'auto' | 'review';
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
  daily_send_limit: number;
  cooldown_days: number;
  escalation_threshold: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// QUERY: Fetch Agent Runs
// =============================================

export function useAgentRuns(limit: number = 20) {
  return useQuery({
    queryKey: ['agent-runs', limit],
    queryFn: async () => {
      const response = await fetch(`/api/agent/run?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch agent runs');
      }
      const data = await response.json();
      return data.runs as AgentRun[];
    },
  });
}

// =============================================
// QUERY: Fetch Latest Run
// =============================================

export function useLatestRun() {
  return useQuery({
    queryKey: ['agent-runs', 'latest'],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('org_id', user.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data as AgentRun | null;
    },
    refetchInterval: 10000, // Poll every 10 seconds for status updates
  });
}

// =============================================
// QUERY: Fetch Kanban Cards
// =============================================

export function useKanbanCards(state?: string, clientId?: string, jobId?: string) {
  return useQuery({
    queryKey: ['kanban-cards', state, clientId, jobId],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('kanban_cards')
        .select(`
          *,
          client:clients(id, company_name, primary_contact, email),
          contact:contacts!kanban_cards_contact_id_fkey(id, first_name, last_name, email)
        `)
        .eq('org_id', user.id)
        .order('created_at', { ascending: false });

      if (state) {
        query = query.eq('state', state);
      }

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((card: any) => ({
        id: card.id,
        org_id: card.org_id,
        run_id: card.run_id,
        client_id: card.client_id,
        contact_id: card.contact_id,
        type: card.type,
        title: card.title,
        description: card.description,
        rationale: card.rationale,
        priority: card.priority,
        state: card.state,
        action_payload: card.action_payload,
        created_by: card.created_by,
        approved_by: card.approved_by,
        executed_at: card.executed_at,
        due_at: card.due_at,
        created_at: card.created_at,
        updated_at: card.updated_at,
        client: card.client,
        contact: card.contact,
      })) as KanbanCard[];
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

// =============================================
// QUERY: Fetch Single Card
// =============================================

export function useKanbanCard(cardId: string) {
  return useQuery({
    queryKey: ['kanban-cards', cardId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kanban_cards')
        .select(`
          *,
          client:clients(id, company_name, primary_contact, email),
          contact:contacts!kanban_cards_contact_id_fkey(id, first_name, last_name, email)
        `)
        .eq('id', cardId)
        .single();

      if (error) throw error;
      return data as KanbanCard;
    },
  });
}

// =============================================
// QUERY: Fetch Agent Settings
// =============================================

export function useAgentSettings() {
  return useQuery({
    queryKey: ['agent-settings'],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('agent_settings')
        .select('*')
        .eq('org_id', user.id)
        .single();

      // If no settings exist, return defaults
      if (error && error.code === 'PGRST116') {
        return {
          org_id: user.id,
          mode: 'review',
          timezone: 'America/New_York',
          daily_send_limit: 50,
          cooldown_days: 5,
          escalation_threshold: 0.75,
          enabled: true,
        } as Partial<AgentSettings>;
      }

      if (error) throw error;

      return data as AgentSettings;
    },
  });
}

// =============================================
// MUTATION: Trigger Agent Run
// =============================================

export function useTriggerRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mode: 'auto' | 'review' = 'review') => {
      const supabase = createClient();

      // Get the current session to include auth headers
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ mode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to trigger agent run');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-runs'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
    },
  });
}

// =============================================
// MUTATION: Stop Agent Run
// =============================================

export function useStopRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();

      // Get the current session to include auth headers
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/agent/run', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to stop agent run');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-runs'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
    },
  });
}

// =============================================
// MUTATION: Approve Card
// =============================================

export function useApproveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kanban_cards')
        .update({ state: 'approved' })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
    },
  });
}

// =============================================
// MUTATION: Reject Card
// =============================================

export function useRejectCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kanban_cards')
        .update({ state: 'rejected' })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
    },
  });
}

// =============================================
// MUTATION: Mark Card as Done
// =============================================

export function useMarkCardDone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kanban_cards')
        .update({ state: 'done', executed_at: new Date().toISOString() })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
    },
  });
}

// =============================================
// MUTATION: Update Card State
// =============================================

export function useUpdateCardState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, state }: { cardId: string; state: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kanban_cards')
        .update({ state })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
    },
  });
}

// =============================================
// MUTATION: Update Card
// =============================================

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, updates }: { cardId: string; updates: Record<string, any> }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kanban_cards')
        .update(updates)
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
    },
  });
}

// =============================================
// MUTATION: Delete Card
// =============================================

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('kanban_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
    },
  });
}

// =============================================
// MUTATION: Execute Card
// =============================================

export function useExecuteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      const response = await fetch('/api/agent/execute-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to execute card');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
      queryClient.invalidateQueries({ queryKey: ['agent-runs'] });
    },
  });
}

// =============================================
// MUTATION: Update Agent Settings
// =============================================

export function useUpdateAgentSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<AgentSettings>) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('agent_settings')
        .upsert({
          org_id: user.id,
          ...settings,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-settings'] });
    },
  });
}

// =============================================
// QUERY: Dashboard Stats
// =============================================

export function useAgentStats(days: number = 30) {
  return useQuery({
    queryKey: ['agent-stats', days],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      // Fetch runs
      const { data: runs } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('org_id', user.id)
        .gte('started_at', cutoff.toISOString());

      // Fetch cards
      const { data: cards } = await supabase
        .from('kanban_cards')
        .select('*')
        .eq('org_id', user.id)
        .gte('created_at', cutoff.toISOString());

      const totalRuns = runs?.length || 0;
      const totalCards = cards?.length || 0;
      const approvedCards = cards?.filter((c) => c.state === 'approved' || c.state === 'done').length || 0;
      const doneCards = cards?.filter((c) => c.state === 'done').length || 0;
      const emailsSent = cards?.filter((c) => c.type === 'send_email' && c.state === 'done').length || 0;

      return {
        totalRuns,
        totalCards,
        approvedCards,
        doneCards,
        emailsSent,
        approvalRate: totalCards > 0 ? (approvedCards / totalCards) * 100 : 0,
        completionRate: approvedCards > 0 ? (doneCards / approvedCards) * 100 : 0,
      };
    },
  });
}


