'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, User, Bot, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KanbanCard } from '@/hooks/use-agent';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: any[];
}

interface CardReviewChatProps {
  card: KanbanCard;
  onCardRevised?: (newCard: any) => void;
  onFeedbackStored?: (feedback: any) => void;
  onClose?: () => void;
}

export function CardReviewChat({
  card,
  onCardRevised,
  onFeedbackStored,
  onClose
}: CardReviewChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      role: 'assistant',
      content: `I suggested this ${card.type.replace('_', ' ')} card. What would you like to discuss or change about it?`,
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
      console.log('[CardReviewChat] Sending request to /api/agent/card-review');

      const response = await fetch('/api/agent/card-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.id,
          contactId: card.contact_id,
          clientId: card.client_id,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            card: {
              id: card.id,
              type: card.type,
              title: card.title,
              rationale: card.rationale,
              priority: card.priority,
              state: card.state,
              action_payload: card.action_payload,
            },
            contact: card.contact ? {
              id: card.contact.id,
              name: `${card.contact.first_name} ${card.contact.last_name}`,
              firstName: card.contact.first_name,
              lastName: card.contact.last_name,
              email: card.contact.email,
            } : null,
            client: card.client ? {
              id: card.client.id,
              name: card.client.company_name,
              email: card.client.email,
            } : null,
          },
        }),
      });

      console.log('[CardReviewChat] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CardReviewChat] Error response:', errorText);
        throw new Error(`Request failed: ${response.status}`);
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantMessageId = Date.now().toString();

      // Add initial empty assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
        },
      ]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;

          // Update assistant message in real-time
          setMessages((prev) => {
            return prev.map(m =>
              m.id === assistantMessageId
                ? { ...m, content: assistantContent }
                : m
            );
          });
        }
      }
    } catch (err: any) {
      console.error('[CardReviewChat] Error:', err);

      const errorMessage = `Sorry, I encountered an error: ${err.message}`;
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
    { label: 'Why This Card?', prompt: 'Why did you suggest this card?' },
    { label: 'Revise Content', prompt: 'Revise this card with better content' },
    { label: 'Store Feedback', prompt: 'Store this feedback for future runs' },
  ];

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex flex-col h-full border-t pt-4 bg-muted/30 rounded-lg">
      <div className="px-4 mb-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4 text-blue-600" />
          Review with AI Agent
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Discuss improvements or store feedback for future runs
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 space-y-3"
        style={{ maxHeight: '400px', minHeight: '200px' }}
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
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border'
              )}
            >
              {message.role === 'user' ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <div className={cn(
                  "prose prose-sm max-w-none",
                  "prose-p:my-1 prose-p:leading-relaxed",
                  "prose-ul:my-1 prose-ol:my-1",
                  "prose-li:my-0.5",
                  "prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
                  "prose-strong:text-gray-900 prose-strong:font-semibold"
                )}>
                  {message.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  ) : isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs italic">Thinking...</span>
                    </div>
                  ) : null}
                </div>
              )}
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
            placeholder="Ask about this card or request changes..."
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
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
