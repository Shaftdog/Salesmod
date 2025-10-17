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
export function useChatMessages(limit: number = 500) {
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

      console.log(`[ChatMessages] Loaded ${data?.length || 0} messages from database`);
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

      console.log('[ChatMessages] Saving message:', {
        role: message.role,
        contentLength: message.content.length,
        userId: user.id,
      });

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

      if (error) {
        console.error('[ChatMessages] Save failed:', error);
        throw error;
      }
      
      console.log('[ChatMessages] Save successful:', data.id);
      return data as ChatMessage;
    },
    onSuccess: (data) => {
      console.log('[ChatMessages] Invalidating queries after save');
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
    onError: (error) => {
      console.error('[ChatMessages] Mutation error:', error);
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

