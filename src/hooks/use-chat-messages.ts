import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface ChatMessage {
  id: string;
  org_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: any;
  metadata?: any;
  created_at: string;
}

/**
 * Fetch chat message history
 */
export function useChatMessages(limit: number = 50) {
  return useQuery({
    queryKey: ['chat-messages', limit],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('org_id', user.id)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []) as ChatMessage[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds to get new messages
  });
}

/**
 * Save a chat message
 */
export function useSaveChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: { role: 'user' | 'assistant'; content: string }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          org_id: user.id,
          role: message.role,
          content: message.content,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });
}

/**
 * Clear chat history
 */
export function useClearChatHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('org_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });
}

