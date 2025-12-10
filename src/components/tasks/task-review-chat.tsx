'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface TaskReviewChatProps {
  task: Task;
  onClose?: () => void;
}

export function TaskReviewChat({ task, onClose }: TaskReviewChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      role: 'assistant',
      content: `I can help you with this task: "${task.title}". What would you like to discuss or get help with?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    // Add to UI immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const requestBody = {
        taskId: task.id,
        clientId: task.clientId || null,
        contactId: task.contactId || null,
        messages: [...messages, userMessage]
          .filter((m) => m && m.content && m.content.trim().length > 0)
          .map((m) => ({
            role: m.role || 'user',
            content: m.content || '',
          })),
        context: {
          task: {
            id: task.id,
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            status: task.status,
            dueDate: task.dueDate,
          },
          client: task.client
            ? {
                id: task.client.id,
                name: task.client.companyName,
                email: task.client.email,
              }
            : null,
          contact: task.contact
            ? {
                id: task.contact.id,
                name: `${task.contact.firstName} ${task.contact.lastName}`,
                email: task.contact.email,
              }
            : null,
          assignee: task.assignee
            ? {
                id: task.assignee.id,
                name: task.assignee.name,
              }
            : null,
        },
      };

      const response = await fetch('/api/agent/task-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TaskReviewChat] Error response:', errorText);
        throw new Error(`Request failed: ${response.status}`);
      }

      // Create placeholder message for streaming
      const assistantMessageId = Date.now().toString();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
        },
      ]);

      // Stream the response in real-time
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          // Update the message content as chunks arrive
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedText }
                : msg
            )
          );
        }
      }
    } catch (err: any) {
      console.error('[TaskReviewChat] Caught error:', err);

      const errorMessage = `Sorry, I encountered an error: ${err.message || 'Unknown error'}`;
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: 'How to approach?', prompt: 'What is the best approach to complete this task?' },
    { label: 'Need context', prompt: 'Can you provide more context about this task?' },
    { label: 'Next steps', prompt: 'What should be my next steps for this task?' },
  ];

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex flex-col h-full border-t pt-4 bg-muted/30 rounded-lg">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 space-y-3"
        style={{ maxHeight: '300px', minHeight: '150px' }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-2 items-start',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-1">
                <Bot className="h-3 w-3 text-blue-600" />
              </div>
            )}

            <div
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'
              )}
            >
              <div className="whitespace-pre-wrap">
                {message.content ? (
                  message.content
                ) : isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-xs italic">Thinking...</span>
                  </div>
                ) : null}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mt-1">
                <User className="h-3 w-3 text-gray-600" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 mx-4 rounded">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Quick Actions */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t bg-white/50">
          <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant="outline"
                onClick={() => handleQuickAction(action.prompt)}
                className="text-xs h-7"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this task..."
            disabled={isLoading}
            className="flex-1 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          />
          <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
