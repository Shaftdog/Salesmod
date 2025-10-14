import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Goal, GoalProgress, Order, Deal, Client } from '@/lib/types';
import { startOfMonth, endOfMonth, differenceInDays, parseISO } from 'date-fns';

// =============================================
// QUERY: Fetch Goals
// =============================================

export function useGoals(periodStart?: string, periodEnd?: string, assignedTo?: string) {
  return useQuery({
    queryKey: ['goals', periodStart, periodEnd, assignedTo],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from('goals')
        .select(`
          *,
          assignee:assigned_to(id, name, email),
          creator:created_by(id, name, email)
        `)
        .eq('is_active', true)
        .order('period_start', { ascending: false });
      
      if (periodStart && periodEnd) {
        query = query
          .gte('period_end', periodStart)
          .lte('period_start', periodEnd);
      }
      
      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Transform snake_case to camelCase
      return (data || []).map(goal => ({
        id: goal.id,
        metricType: goal.metric_type,
        targetValue: parseFloat(goal.target_value),
        periodType: goal.period_type,
        periodStart: goal.period_start,
        periodEnd: goal.period_end,
        assignedTo: goal.assigned_to,
        description: goal.description,
        isActive: goal.is_active,
        createdBy: goal.created_by,
        createdAt: goal.created_at,
        updatedAt: goal.updated_at,
        assignee: goal.assignee,
        creator: goal.creator
      })) as Goal[];
    }
  });
}

// =============================================
// QUERY: Current Period Goals
// =============================================

export function useCurrentGoals(assignedTo?: string) {
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString().split('T')[0];
  const monthEnd = endOfMonth(now).toISOString().split('T')[0];
  
  return useGoals(monthStart, monthEnd, assignedTo);
}

// =============================================
// CALCULATE GOAL PROGRESS
// =============================================

export function calculateGoalProgress(
  goal: Goal,
  orders: Order[],
  deals?: Deal[],
  clients?: Client[]
): GoalProgress {
  const now = new Date();
  const periodStart = parseISO(goal.periodStart);
  const periodEnd = parseISO(goal.periodEnd);
  
  // Filter data for the goal period
  const periodOrders = orders.filter(order => {
    const orderDate = parseISO(order.orderedDate);
    return orderDate >= periodStart && orderDate <= periodEnd;
  });
  
  let currentValue = 0;
  
  switch(goal.metricType) {
    case 'order_volume':
      currentValue = periodOrders.length;
      break;
      
    case 'revenue':
      currentValue = periodOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      break;
      
    case 'completion_rate':
      const completedOrders = periodOrders.filter(o => 
        o.status === 'completed' || o.status === 'delivered'
      ).length;
      currentValue = periodOrders.length > 0 
        ? (completedOrders / periodOrders.length) * 100 
        : 0;
      break;
      
    case 'new_clients':
      if (clients) {
        currentValue = clients.filter(client => {
          const createdDate = parseISO(client.createdAt);
          return createdDate >= periodStart && createdDate <= periodEnd;
        }).length;
      }
      break;
      
    case 'deal_value':
      if (deals) {
        const periodDeals = deals.filter(deal => {
          const dealDate = parseISO(deal.createdAt);
          return dealDate >= periodStart && 
                 dealDate <= periodEnd &&
                 deal.stage !== 'lost';
        });
        currentValue = periodDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      }
      break;
      
    case 'deals_closed':
      if (deals) {
        currentValue = deals.filter(deal => {
          if (!deal.actualCloseDate) return false;
          const closeDate = parseISO(deal.actualCloseDate);
          return closeDate >= periodStart && 
                 closeDate <= periodEnd &&
                 deal.stage === 'won';
        }).length;
      }
      break;
  }
  
  // Calculate progress metrics
  const progress = goal.targetValue > 0 
    ? (currentValue / goal.targetValue) * 100 
    : 0;
    
  const daysRemaining = differenceInDays(periodEnd, now);
  
  const periodDuration = differenceInDays(periodEnd, periodStart);
  const daysElapsed = differenceInDays(now, periodStart);
  const periodProgressPct = periodDuration > 0 
    ? Math.min((daysElapsed / periodDuration) * 100, 100)
    : 100;
  
  // Determine if on track (progress should be >= period progress)
  const isOnTrack = progress >= periodProgressPct * 0.9; // 90% of expected progress
  
  return {
    goal,
    currentValue,
    progress: Math.round(progress * 10) / 10, // Round to 1 decimal
    isOnTrack,
    daysRemaining,
    periodProgressPct: Math.round(periodProgressPct)
  };
}

// =============================================
// HOOK: Goal Progress with Data
// =============================================

export function useGoalProgress(
  goal: Goal,
  orders: Order[],
  deals?: Deal[],
  clients?: Client[]
): GoalProgress {
  return calculateGoalProgress(goal, orders, deals, clients);
}

// =============================================
// MUTATION: Create Goal
// =============================================

export function useCreateGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newGoal: Partial<Goal>) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('goals')
        .insert({
          metric_type: newGoal.metricType,
          target_value: newGoal.targetValue,
          period_type: newGoal.periodType,
          period_start: newGoal.periodStart,
          period_end: newGoal.periodEnd,
          assigned_to: newGoal.assignedTo || null,
          description: newGoal.description,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });
}

// =============================================
// MUTATION: Update Goal
// =============================================

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Goal> }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('goals')
        .update({
          metric_type: updates.metricType,
          target_value: updates.targetValue,
          period_type: updates.periodType,
          period_start: updates.periodStart,
          period_end: updates.periodEnd,
          assigned_to: updates.assignedTo,
          description: updates.description,
          is_active: updates.isActive
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });
}

// =============================================
// MUTATION: Delete Goal
// =============================================

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });
}

// =============================================
// MUTATION: Toggle Goal Active Status
// =============================================

export function useToggleGoalActive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('goals')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });
}

